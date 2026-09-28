import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MarketplaceListing, MarketplaceCategory, User, MandiRateResponse, MandiRateItem } from '../types';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  MessageCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  Filter, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Info, 
  Scale, 
  ExternalLink,
  ChevronDown,
  X,
  BarChart3
} from 'lucide-react';
import { MandiPriceTrendsChart } from './MandiPriceTrendsChart';
import { AddMarketplaceListingModal } from './AddMarketplaceListingModal';
import { 
  INDIA_LOCATIONS, 
  DISTRICTS_BY_STATE, 
  ALL_INDIAN_DISTRICTS 
} from '../data/indiaLocations';
import { useLanguage } from '../context/LanguageContext';

interface MarketplaceViewProps {
  listings: MarketplaceListing[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onAddListing?: (listing: MarketplaceListing) => void;
  onDeleteListing?: (id: string) => void;
  onOpenAddListing?: () => void;
}

const CATEGORY_TABS: { label: string; hindi: string; icon: string; value: string }[] = [
  { label: 'All Produce', hindi: 'सभी उत्पाद', icon: '🧺', value: 'all' },
  { label: 'Crops & Grains', hindi: 'अनाज व फसलें', icon: '🌾', value: 'Crops & Grains' },
  { label: 'Vegetables', hindi: 'सब्जियां', icon: '🥦', value: 'Vegetables' },
  { label: 'Fruits', hindi: 'फल', icon: '🍎', value: 'Fruits' },
  { label: 'Eggs & Poultry', hindi: 'अंडे व पोल्ट्री', icon: '🥚', value: 'Eggs & Poultry' },
  { label: 'Fish & Aquaculture', hindi: 'मछली पालन', icon: '🐟', value: 'Fish & Aquaculture' },
  { label: 'Dairy & Livestock', hindi: 'दूध व पशु', icon: '🥛', value: 'Dairy & Livestock' },
  { label: 'Pulses & Oilseeds', hindi: 'दालें व तिलहन', icon: '🌱', value: 'Pulses & Oilseeds' },
];

const POPULAR_AGRICULTURAL_HUBS = [
  { district: 'Varanasi', state: 'Uttar Pradesh' },
  { district: 'Lucknow', state: 'Uttar Pradesh' },
  { district: 'Gorakhpur', state: 'Uttar Pradesh' },
  { district: 'Patna', state: 'Bihar' },
  { district: 'Darbhanga', state: 'Bihar' },
  { district: 'Karnal', state: 'Haryana' },
  { district: 'Ludhiana', state: 'Punjab' },
  { district: 'Bathinda', state: 'Punjab' },
  { district: 'Indore', state: 'Madhya Pradesh' },
  { district: 'Bhopal', state: 'Madhya Pradesh' },
  { district: 'Nashik', state: 'Maharashtra' },
  { district: 'Pune', state: 'Maharashtra' },
  { district: 'Jaipur', state: 'Rajasthan' },
  { district: 'Guntur', state: 'Andhra Pradesh' },
  { district: 'Ahmedabad', state: 'Gujarat' },
  { district: 'Dehradun', state: 'Uttarakhand' },
  { district: 'Ranchi', state: 'Jharkhand' },
];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  listings,
  currentUser,
  onOpenAuth,
  onAddListing,
  onDeleteListing,
  onOpenAddListing,
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedListingDetail, setSelectedListingDetail] = useState<MarketplaceListing | null>(null);

  // Mandi Rates State
  const [selectedMandiDistrict, setSelectedMandiDistrict] = useState(
    currentUser?.district || 'Varanasi'
  );
  const [selectedMandiState, setSelectedMandiState] = useState(
    currentUser?.state || 'Uttar Pradesh'
  );
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [mandiCommodityFilter, setMandiCommodityFilter] = useState('all');
  const [showTrendChart, setShowTrendChart] = useState(true);
  const [mandiRatesData, setMandiRatesData] = useState<MandiRateResponse | null>(null);
  const [isLoadingMandi, setIsLoadingMandi] = useState(false);
  const [mandiError, setMandiError] = useState<string | null>(null);

  const districtsForState = useMemo(() => {
    return DISTRICTS_BY_STATE[selectedMandiState] || [];
  }, [selectedMandiState]);

  const handleStateSelect = (newState: string) => {
    setSelectedMandiState(newState);
    const districts = DISTRICTS_BY_STATE[newState] || [];
    if (districts.length > 0 && !districts.includes(selectedMandiDistrict)) {
      setSelectedMandiDistrict(districts[0]);
    }
  };

  const searchResults = useMemo(() => {
    if (!districtSearchQuery.trim()) return [];
    const q = districtSearchQuery.toLowerCase().trim();
    return ALL_INDIAN_DISTRICTS.filter(
      (item) => item.district.toLowerCase().includes(q) || item.state.toLowerCase().includes(q)
    ).slice(0, 16);
  }, [districtSearchQuery]);

  // Fetch Mandi Rates
  const fetchMandiRates = async (district: string, state: string) => {
    setIsLoadingMandi(true);
    setMandiError(null);
    try {
      const res = await fetch(`/api/mandi-rates?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`);
      if (!res.ok) throw new Error('Failed to fetch Mandi rates');
      const data: MandiRateResponse = await res.json();
      setMandiRatesData(data);
    } catch {
      setMandiError('Live data temporarily unavailable, showing benchmark market rates.');
    } finally {
      setIsLoadingMandi(false);
    }
  };

  useEffect(() => {
    fetchMandiRates(selectedMandiDistrict, selectedMandiState);
  }, [selectedMandiDistrict, selectedMandiState]);

  // Extract unique districts from listings for filter
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.district) set.add(l.district);
    });
    return Array.from(set);
  }, [listings]);

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        listing.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === 'Pulses & Oilseeds' && (listing.category.includes('Pulse') || listing.category.includes('Grain')));
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        listing.title.toLowerCase().includes(query) ||
        listing.variety?.toLowerCase().includes(query) ||
        listing.category.toLowerCase().includes(query) ||
        listing.district?.toLowerCase().includes(query) ||
        listing.village?.toLowerCase().includes(query);

      const matchesDistrict =
        filterDistrict === 'all' ||
        listing.district.toLowerCase() === filterDistrict.toLowerCase();

      return matchesCategory && matchesSearch && matchesDistrict;
    });
  }, [listings, selectedCategory, searchQuery, filterDistrict]);

  // Filter Mandi Rates
  const filteredMandiRates = useMemo(() => {
    if (!mandiRatesData?.rates) return [];
    if (mandiCommodityFilter === 'all') return mandiRatesData.rates;
    return mandiRatesData.rates.filter((r) =>
      r.category.toLowerCase().includes(mandiCommodityFilter.toLowerCase())
    );
  }, [mandiRatesData, mandiCommodityFilter]);

  const handleOpenAddModal = () => {
    if (!currentUser) {
      onOpenAuth();
    } else if (onOpenAddListing) {
      onOpenAddListing();
    } else {
      setIsAddModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white p-5 sm:p-7 border border-emerald-500/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
              <span>Direct Kisan Mandi • No Middlemen</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Agri Marketplace & Live Mandi Rates
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              Sell or buy farm produce directly: crops, grains, vegetables, fruits, eggs, fish, and dairy. 
              Real-time APMC Mandi Bhav fetched directly with Google Engine data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Sell Crops & Produce (फसल बेचें)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Live Mandi Bhav (District & Area-specific with Google Engine) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-500/20 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700 font-extrabold text-lg shrink-0">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  District Mandi Bhav (आज का मंडी भाव)
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Live Google Engine
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                  All 36 States & UTs (780+ Districts)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Showing live APMC wholesale rates for <span className="font-bold text-emerald-800">{selectedMandiDistrict}, {selectedMandiState}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="toggle-mandi-chart-btn"
              onClick={() => setShowTrendChart(!showTrendChart)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                showTrendChart
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
              title="Toggle Weekly Price Trend Chart & Selling Advisory"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{showTrendChart ? 'Hide Trends (चार्ट छुपाएं)' : 'Price Trends (चार्ट देखें)'}</span>
            </button>

            <button
              id="refresh-mandi-rates-btn"
              onClick={() => fetchMandiRates(selectedMandiDistrict, selectedMandiState)}
              disabled={isLoadingMandi}
              title="Refresh Live Mandi Rates"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMandi ? 'animate-spin text-emerald-200' : ''}`} />
              <span>{t('refresh')}</span>
            </button>
          </div>
        </div>

        {/* All-India District & State Selectors Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* 1. Indian State Selector */}
          <div className="sm:col-span-4 relative">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Select State / UT (राज्य)
            </label>
            <div className="relative">
              <select
                id="mandi-state-selector"
                aria-label="Select State of India"
                value={selectedMandiState}
                onChange={(e) => handleStateSelect(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
              >
                <optgroup label="28 States">
                  {INDIA_LOCATIONS.filter((l) => l.type === 'state').map((loc) => (
                    <option key={loc.state} value={loc.state}>
                      {loc.state} ({loc.districts.length} Districts)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="8 Union Territories">
                  {INDIA_LOCATIONS.filter((l) => l.type === 'ut').map((loc) => (
                    <option key={loc.state} value={loc.state}>
                      {loc.state} ({loc.districts.length} Districts)
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. District in Selected State */}
          <div className="sm:col-span-4 relative">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Select District ({districtsForState.length} in {selectedMandiState})
            </label>
            <div className="relative">
              <select
                id="mandi-district-selector"
                aria-label="Select District"
                value={selectedMandiDistrict}
                onChange={(e) => setSelectedMandiDistrict(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
              >
                {districtsForState.map((dist) => (
                  <option key={dist} value={dist}>
                    📍 {dist}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 3. Fast Typeahead across all 780+ Districts */}
          <div ref={searchContainerRef} className="sm:col-span-4 relative">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Search All 780+ Districts of India
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Type district name (e.g. Gorakhpur, Moga)..."
                value={districtSearchQuery}
                onChange={(e) => {
                  setDistrictSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => {
                  if (districtSearchQuery.trim().length >= 1) setIsSearchOpen(true);
                }}
                className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
              {districtSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setDistrictSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {isSearchOpen && districtSearchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Matches Across India</span>
                  <span>{searchResults.length} found</span>
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={`${item.district}-${item.state}`}
                      type="button"
                      onClick={() => {
                        setSelectedMandiState(item.state);
                        setSelectedMandiDistrict(item.district);
                        setDistrictSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-bold text-slate-900">📍 {item.district}</span>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {item.state}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No district found matching "{districtSearchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Hubs Chips */}
        <div className="pt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase shrink-0">
            Quick Hubs:
          </span>
          {currentUser?.district && (
            <button
              type="button"
              onClick={() => {
                if (currentUser.state) setSelectedMandiState(currentUser.state);
                setSelectedMandiDistrict(currentUser.district);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                selectedMandiDistrict === currentUser.district
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span>📍 My District ({currentUser.district})</span>
            </button>
          )}
          {POPULAR_AGRICULTURAL_HUBS.map((hub) => {
            const isSelected =
              selectedMandiDistrict === hub.district && selectedMandiState === hub.state;
            return (
              <button
                key={`${hub.district}-${hub.state}`}
                type="button"
                onClick={() => {
                  setSelectedMandiState(hub.state);
                  setSelectedMandiDistrict(hub.district);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {hub.district}
              </button>
            );
          })}
        </div>

        {/* SECTION 1.5: Recharts Weekly Price Trends & Kisan Selling Advisory */}
        {showTrendChart && mandiRatesData && mandiRatesData.rates.length > 0 && (
          <MandiPriceTrendsChart
            rates={mandiRatesData.rates}
            selectedDistrict={selectedMandiDistrict}
            selectedState={selectedMandiState}
            marketName={mandiRatesData.marketName}
            updatedAt={mandiRatesData.updatedAt}
          />
        )}

        {/* Commodity Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: 'All Commodities', value: 'all' },
            { label: 'Crops & Grains', value: 'Crops' },
            { label: 'Vegetables', value: 'Vegetables' },
            { label: 'Fruits', value: 'Fruits' },
            { label: 'Eggs & Poultry', value: 'Eggs' },
            { label: 'Fish & Aqua', value: 'Fish' },
            { label: 'Pulses', value: 'Pulses' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMandiCommodityFilter(tab.value)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                mandiCommodityFilter === tab.value
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mandi Rates Grid / Table */}
        {isLoadingMandi ? (
          <div className="py-10 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              Fetching current mandi prices with Google Engine live search...
            </p>
          </div>
        ) : filteredMandiRates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredMandiRates.map((item, idx) => (
              <div
                key={`${item.commodity}-${idx}`}
                className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-tight">
                      {item.commodity}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.variety || item.category}
                    </p>
                  </div>
                  {item.trend === 'up' ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      +High
                    </span>
                  ) : item.trend === 'down' ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                      <TrendingDown className="w-3 h-3 text-rose-600" />
                      -Low
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      <Minus className="w-3 h-3 text-slate-500" />
                      Steady
                    </span>
                  )}
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Modal Price:</span>
                    <span className="text-sm font-black text-emerald-950">
                      ₹{item.modalPrice.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Min: ₹{item.minPrice}</span>
                    <span>Max: ₹{item.maxPrice}</span>
                  </div>
                </div>

                {item.arrival && (
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Mandi Arrival:</span>
                    <span className="font-bold text-slate-700">{item.arrival}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowTrendChart(true);
                    setTimeout(() => {
                      const el = document.getElementById('mandi-weekly-price-trends-container');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                      const selectEl = document.getElementById('mandi-trend-crop-select') as HTMLSelectElement | null;
                      if (selectEl) {
                        selectEl.value = item.commodity;
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                    }, 50);
                  }}
                  className="w-full mt-1 py-1.5 px-2 bg-slate-100/90 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 border border-transparent rounded-xl text-[10px] font-bold text-slate-600 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  title={`Analyze 7-day price trend & selling decision for ${item.commodity}`}
                >
                  <BarChart3 className="w-3 h-3 text-emerald-600" />
                  <span>7D Trend & Advisory (चार्ट)</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs">
            No specific mandi prices found for the selected category.
          </div>
        )}

        {/* Source citation */}
        {mandiRatesData && (
          <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <span>
              Source: <strong className="text-slate-600">{mandiRatesData.source}</strong> ({mandiRatesData.marketName}) • Updated: {mandiRatesData.updatedAt}
            </span>
            {mandiRatesData.groundingSources && mandiRatesData.groundingSources.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Grounding links:</span>
                {mandiRatesData.groundingSources.slice(0, 2).map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: Marketplace Listings (Produce for Sale & Purchase) */}
      <div className="space-y-4">
        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-500/20 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crops, fish, eggs, vegetables, variety, or farmer..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            {/* District Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
                >
                  <option value="all">📍 {t('allDistricts')}</option>
                  {availableDistricts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ {t('sellProduce')}</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === tab.value
                    ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Listings Count */}
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-bold text-slate-600">
            Showing <span className="text-emerald-800 font-extrabold">{filteredListings.length}</span> harvest listings available for purchase
          </p>
        </div>

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredListings.map((listing) => {
              const isOwner = currentUser && currentUser.id === listing.sellerId;
              const waUrl = `https://wa.me/${listing.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Namaste ${listing.sellerName}, I am interested in buying your ${listing.title} listed on Krishakarya at ₹${listing.pricePerUnit} ${listing.unit}. Please let me know availability and delivery.`
              )}`;

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 hover:border-emerald-400/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Photo Container or Clean Category Banner */}
                  {listing.image && listing.image.trim().length > 0 ? (
                    <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Category & Organic Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-200 text-[10px] font-black backdrop-blur-md">
                          {listing.category}
                        </span>
                        {listing.isOrganic && (
                          <span className="px-2 py-0.5 rounded-lg bg-lime-600 text-white text-[10px] font-black shadow-xs">
                            🌱 100% Organic
                          </span>
                        )}
                      </div>

                      {/* Negotiable Tag */}
                      {listing.isNegotiable && (
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-extrabold shadow-xs">
                            🤝 Negotiable
                          </span>
                        </div>
                      )}

                      {/* Owner Delete Button */}
                      {isOwner && (
                        <button
                          onClick={() => onDeleteListing(listing.id)}
                          title="Delete this listing"
                          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-32 w-full bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50 border-b border-emerald-100/60 p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-800 text-emerald-100 text-[10px] font-black">
                            {listing.category}
                          </span>
                          {listing.isOrganic && (
                            <span className="px-2 py-0.5 rounded-lg bg-lime-600 text-white text-[10px] font-black shadow-xs">
                              🌱 Organic
                            </span>
                          )}
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => onDeleteListing(listing.id)}
                            title="Delete this listing"
                            className="w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{listing.variety || listing.category}</span>
                        </div>
                        {listing.isNegotiable && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold">
                            🤝 Negotiable
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Price Display */}
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-xl font-black text-emerald-800 tracking-tight">
                          ₹{listing.pricePerUnit.toLocaleString('en-IN')}
                          <span className="text-xs font-semibold text-slate-500 ml-1">
                            {listing.unit}
                          </span>
                        </div>

                        {listing.quantityAvailable > 0 && (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Stock: {listing.quantityAvailable} {listing.unit.replace('₹/', '')}
                          </span>
                        )}
                      </div>

                      {/* Title & Variety */}
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mt-1 leading-snug group-hover:text-emerald-800 transition-colors">
                        {listing.title}
                      </h3>

                      {listing.variety && (
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                          Variety: <span className="text-slate-800">{listing.variety}</span>
                        </p>
                      )}

                      {/* Location & Harvest */}
                      <div className="pt-2 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">
                            {listing.village ? `${listing.village}, ` : ''}{listing.district}, {listing.state}
                          </span>
                        </div>

                        {listing.harvestDate && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Harvest: {listing.harvestDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Description preview */}
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {listing.description}
                      </p>
                    </div>

                    {/* Seller Information & Actions */}
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center">
                            {listing.sellerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{listing.sellerName}</p>
                            <p className="text-[10px] text-emerald-700 font-semibold">Direct Farmer Seller</p>
                          </div>
                        </div>

                        {listing.minOrderQuantity > 1 && (
                          <span className="text-[10px] text-slate-400">
                            Min: {listing.minOrderQuantity} {listing.unit.replace('₹/', '')}
                          </span>
                        )}
                      </div>

                      {/* Contact Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={`tel:${listing.sellerPhone}`}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-xl border border-emerald-200 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{t('call')}</span>
                        </a>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{t('whatsapp')}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3 p-8">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">No Produce Listed in Marketplace Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Be the first farmer or agricultural producer to list your freshly harvested grains, vegetables, fruits, pulses, or dairy directly to buyers with zero middlemen commission.
            </p>
            <div className="pt-2">
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                List Your Produce Now
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3 p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">No Produce Listings Match Filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No crop or produce listings match your active filters. Try resetting the category or search query, or publish a new crop listing.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setFilterDistrict('all');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                + List Produce
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Produce Modal */}
      <AddMarketplaceListingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onAddListing={onAddListing || (() => {})}
      />
    </div>
  );
};
