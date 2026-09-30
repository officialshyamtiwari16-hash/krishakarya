import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  ShoppingBag,
  Clock,
  Compass,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAutoLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { MandiRateItem } from '../types';

interface AutoMandiRatesCardProps {
  onNavigateToMarketplace: () => void;
}

export const AutoMandiRatesCard: React.FC<AutoMandiRatesCardProps> = ({
  onNavigateToMarketplace,
}) => {
  const { t } = useLanguage();
  const {
    detectedDistrict,
    detectedState,
    location,
    isDetectingLocation,
    permissionStatus,
    mandiRates,
    isLoadingMandi,
    detectLocationAutomatically,
    fetchMandiRatesAutomatically,
  } = useAutoLocation();

  const [filterCategory, setFilterCategory] = useState<'all' | 'crops' | 'veg' | 'other'>('all');

  const rates: MandiRateItem[] = mandiRates?.rates || [];

  const filteredRates = rates.filter((r) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'crops') return r.category?.includes('Crop') || r.category?.includes('Grain') || r.category?.includes('Pulse');
    if (filterCategory === 'veg') return r.category?.includes('Veg') || r.category?.includes('Fruit');
    return r.category?.includes('Egg') || r.category?.includes('Fish') || r.category?.includes('Dairy');
  });

  const getTrendBadge = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          <span>Bullish / तेज</span>
        </span>
      );
    }
    if (trend === 'down') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-full">
          <TrendingDown className="w-3 h-3 text-rose-600" />
          <span>Dip / मंदा</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded-full">
        <Minus className="w-3 h-3 text-slate-500" />
        <span>Steady / स्थिर</span>
      </span>
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/90 via-emerald-950/85 to-slate-950/90 border border-emerald-400/40 shadow-2xl backdrop-blur-2xl p-4 sm:p-5 text-white space-y-4 animate-fadeIn">
      {/* Top Header Bar: Auto-Detected Location & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shrink-0 border border-amber-300/40">
            <ShoppingBag className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-['Outfit',sans-serif] font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                <span>{t('krishiBazaar')}</span>
                <span className="text-amber-300">• Live Mandi Rates</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Auto-Updated Daily</span>
              </span>
            </div>
            
            <p className="text-xs text-emerald-100/90 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-bold text-white">📍 Auto-Detected:</span>
              <span className="text-amber-300 font-extrabold">{detectedDistrict}, {detectedState}</span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">({mandiRates?.marketName || `${detectedDistrict} APMC Mandi`})</span>
            </p>
          </div>
        </div>

        {/* Action Controls: Refresh & Auto GPS Detect */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            onClick={() => detectLocationAutomatically(true)}
            disabled={isDetectingLocation}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-emerald-500/20 text-emerald-200 hover:text-white rounded-xl text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Auto-detect location from device GPS"
          >
            <Compass className={`w-3.5 h-3.5 text-emerald-400 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>{isDetectingLocation ? 'Locating...' : 'GPS Auto-Detect'}</span>
          </button>

          <button
            onClick={() => fetchMandiRatesAutomatically()}
            disabled={isLoadingMandi}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-emerald-500/20 text-emerald-200 hover:text-white rounded-xl text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh live Mandi rates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingMandi ? 'animate-spin' : ''}`} />
            <span>{isLoadingMandi ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={onNavigateToMarketplace}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer btn-futuristic"
          >
            <span>Full Mandi Market</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        {[
          { key: 'all', label: 'All Commodities (सभी)' },
          { key: 'crops', label: '🌾 Crops & Grains (फसलें)' },
          { key: 'veg', label: '🥦 Vegetables & Fruits (सब्जियां)' },
          { key: 'other', label: '🐟 Fish, Eggs & Poultry' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterCategory(tab.key as any)}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterCategory === tab.key
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rates Grid / Carousel */}
      {isLoadingMandi && rates.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/10 animate-pulse space-y-2">
              <div className="h-4 bg-white/15 rounded w-3/4" />
              <div className="h-6 bg-white/20 rounded w-1/2" />
              <div className="h-3 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredRates.slice(0, 8).map((rate, idx) => (
            <div
              key={`${rate.commodity}-${idx}`}
              onClick={onNavigateToMarketplace}
              className="group p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/15 hover:border-amber-400/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-extrabold text-xs text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {rate.commodity}
                  </h4>
                  {getTrendBadge(rate.trend)}
                </div>
                {rate.variety && (
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {rate.variety}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-['Outfit',sans-serif] font-black text-lg sm:text-xl text-emerald-400">
                    ₹{rate.modalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{rate.unit}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10 mt-1">
                  <span>Range: ₹{rate.minPrice} - ₹{rate.maxPrice}</span>
                  {rate.arrival && <span className="text-amber-300/80 font-medium">{rate.arrival}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Notice & Agmarknet Reference */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10 flex-wrap gap-2">
        <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Grounded with APMC Mandi daily arrivals & Government MSP benchmarks</span>
        </span>

        <button
          onClick={onNavigateToMarketplace}
          className="text-amber-300 hover:text-amber-200 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>View 7-Day Trend Charts & Compare Prices</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
