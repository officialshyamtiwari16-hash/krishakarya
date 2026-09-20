import React, { useState, useMemo } from 'react';
import { MarketplaceListing, MarketplaceCategory, User } from '../types';
import { X, Upload, ShoppingBag, Sprout, Check, ShieldCheck, Phone, MapPin } from 'lucide-react';
import { ALL_INDIAN_STATES, DISTRICTS_BY_STATE, ALL_INDIAN_DISTRICTS } from '../data/indiaLocations';

interface AddMarketplaceListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onAddListing: (listing: MarketplaceListing) => void;
}

const CATEGORIES: { label: string; hindi: string; icon: string; value: MarketplaceCategory }[] = [
  { label: 'Crops & Grains', hindi: 'अनाज व फसलें', icon: '🌾', value: 'Crops & Grains' },
  { label: 'Vegetables', hindi: 'ताजा सब्जियां', icon: '🥦', value: 'Vegetables' },
  { label: 'Fruits', hindi: 'बागवानी फल', icon: '🍎', value: 'Fruits' },
  { label: 'Eggs & Poultry', hindi: 'अंडे व पोल्ट्री', icon: '🥚', value: 'Eggs & Poultry' },
  { label: 'Fish & Aquaculture', hindi: 'मछली पालन', icon: '🐟', value: 'Fish & Aquaculture' },
  { label: 'Dairy & Livestock', hindi: 'दूध व पशु उत्पाद', icon: '🥛', value: 'Dairy & Livestock' },
  { label: 'Pulses & Legumes', hindi: 'दालें व तिलहन', icon: '🌱', value: 'Pulses & Legumes' },
  { label: 'Spices & Condiments', hindi: 'मसाले व जड़ी-बूटी', icon: '🌶️', value: 'Spices & Condiments' },
  { label: 'Organic & Seeds', hindi: 'बीज व पौध', icon: '🌰', value: 'Organic & Seeds' },
];

const COMMON_UNITS = [
  '₹/Quintal',
  '₹/Kg',
  '₹/Tray (30 pcs)',
  '₹/Dozen',
  '₹/Ton',
  '₹/Liter',
  '₹/Piece',
  '₹/Crate',
  '₹/Bag',
];

export const AddMarketplaceListingModal: React.FC<AddMarketplaceListingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onAddListing,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('Crops & Grains');
  const [variety, setVariety] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState('₹/Quintal');
  const [quantityAvailable, setQuantityAvailable] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('1');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [isOrganic, setIsOrganic] = useState(false);
  const [harvestDate, setHarvestDate] = useState('');
  const [village, setVillage] = useState(currentUser?.village || '');
  const [district, setDistrict] = useState(currentUser?.district || '');
  const [state, setState] = useState(currentUser?.state || 'Uttar Pradesh');
  const [sellerName, setSellerName] = useState(currentUser?.name || '');
  const [sellerPhone, setSellerPhone] = useState(currentUser?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser?.phone || '');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  // Handle local image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Photo size must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setFormError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!title.trim()) {
      setFormError('Please enter a descriptive produce/crop title.');
      return;
    }
    if (!pricePerUnit || Number(pricePerUnit) <= 0) {
      setFormError('Please enter a valid price per unit.');
      return;
    }
    if (!sellerPhone.trim()) {
      setFormError('Please provide a contact phone number for buyers.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const newListing: MarketplaceListing = {
        id: `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sellerId: currentUser.id,
        sellerName: sellerName.trim() || currentUser.name,
        sellerPhone: sellerPhone.trim(),
        whatsappNumber: whatsappNumber.trim() || sellerPhone.trim(),
        title: title.trim(),
        category,
        variety: variety.trim() || 'Standard Harvest',
        pricePerUnit: Number(pricePerUnit),
        unit,
        quantityAvailable: Number(quantityAvailable) || 0,
        minOrderQuantity: Number(minOrderQuantity) || 1,
        isNegotiable,
        isOrganic,
        harvestDate: harvestDate.trim() || 'Fresh Harvest',
        village: village.trim() || 'Local Area',
        district: district.trim() || 'District',
        state: state.trim() || 'Uttar Pradesh',
        image: image.trim(),
        description: description.trim() || `${title} available for sale directly from farm harvest. Contact for bulk orders and delivery arrangements.`,
        status: 'available',
        createdAt: new Date().toISOString(),
      };

      onAddListing(newListing);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to publish listing. Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-emerald-500/20 overflow-hidden animate-modalPop">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl tracking-tight leading-tight">
                Sell Produce & Agro Goods (फसल व उत्पाद बेचें)
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                Direct farm-to-buyer marketplace • Zero middleman commission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {formError}
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Category (श्रेणी चुनें) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    category === cat.value
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500'
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs truncate">{cat.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{cat.hindi}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Variety */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Produce Name / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sharbati Wheat (गेहूं), Fresh Rohu Fish"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Variety / Breed / Grade
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Grade A+ / Desi / Kadaknath / 1121"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Pricing & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-emerald-50/50 border border-emerald-500/20 rounded-2xl">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                Price (मूल्य) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  placeholder="2450"
                  required
                  className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-extrabold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                Unit (इकाई)
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-slate-900 focus:border-emerald-500 outline-hidden"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl border border-emerald-200">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">Negotiable (मोलभाव संभव)</span>
              </label>
            </div>
          </div>

          {/* Quantity & Order Min */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Quantity Available
              </label>
              <input
                type="number"
                min="0"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(e.target.value)}
                placeholder="e.g. 50 (Quintals / Kg / Trays)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Order Quantity (MOQ)
              </label>
              <input
                type="number"
                min="1"
                value={minOrderQuantity}
                onChange={(e) => setMinOrderQuantity(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Organic Toggle & Harvest Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <input
                type="checkbox"
                id="isOrganicCheck"
                checked={isOrganic}
                onChange={(e) => setIsOrganic(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <label htmlFor="isOrganicCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                <span className="block text-emerald-800">🌱 Organic / Natural (जैविक)</span>
                <span className="text-[11px] text-slate-500 font-normal">Grown without synthetic pesticides</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harvest Date / Freshness
              </label>
              <input
                type="text"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                placeholder="e.g. Fresh Daily Pluck / March 2024"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Village / Town</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Village / Tehsil"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District (जिला) *</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                list="listing-districts-list"
                placeholder="e.g. Varanasi, Patna, Karnal"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
              <datalist id="listing-districts-list">
                {state && DISTRICTS_BY_STATE[state]
                  ? DISTRICTS_BY_STATE[state].map((d) => <option key={d} value={d} />)
                  : ALL_INDIAN_DISTRICTS.slice(0, 150).map((d) => (
                      <option key={`${d.district}-${d.state}`} value={d.district} label={d.state} />
                    ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State (राज्य)</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                list="listing-states-list"
                placeholder="Uttar Pradesh"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
              <datalist id="listing-states-list">
                {ALL_INDIAN_STATES.map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farmer / Seller Name *</label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp (Optional)</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Produce Photo (फसल की फोटो जोड़ें)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload From Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {image && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-400">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Quality Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about quality, packaging, moisture percentage, direct pickup or transport options..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Listing (लिस्टिंग प्रकाशित करें)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
