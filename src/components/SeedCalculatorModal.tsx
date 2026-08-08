import React, { useState } from 'react';
import { CROP_DATABASE, LAND_UNITS, CropInfo } from '../data/cropData';
import { Calculator, Sparkles, Sprout, ArrowRight, Check, Copy, DollarSign, Info, Shield, Layers, BookOpen } from 'lucide-react';

interface SeedCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToLedger?: (entry: { title: string; category: any; type: 'expense'; amount: number; cropName: string; notes: string }) => void;
}

export const SeedCalculatorModal: React.FC<SeedCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddToLedger,
}) => {
  const [landValue, setLandValue] = useState<string>('5');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('bigha_up');
  const [selectedCropId, setSelectedCropId] = useState<string>('wheat');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copied, setCopied] = useState<boolean>(false);
  const [addedToLedger, setAddedToLedger] = useState<boolean>(false);

  if (!isOpen) return null;

  const numLand = parseFloat(landValue) || 0;
  const currentUnit = LAND_UNITS.find((u) => u.unitId === selectedUnitId) || LAND_UNITS[0];
  const totalAcres = numLand * currentUnit.acresEquivalent;
  const totalHectares = totalAcres / 2.471;

  const currentCrop = CROP_DATABASE.find((c) => c.id === selectedCropId) || CROP_DATABASE[0];

  // Seed Calculations
  const seedMin = Math.round(totalAcres * currentCrop.seedRateKgMin * 10) / 10;
  const seedMax = Math.round(totalAcres * currentCrop.seedRateKgMax * 10) / 10;

  // Fertilizer Calculations
  const dapKg = Math.round(totalAcres * currentCrop.dapKgPerAcre);
  const dapBags = (dapKg / 50).toFixed(1);

  const ureaKg = Math.round(totalAcres * currentCrop.ureaKgPerAcre);
  const ureaBags = (ureaKg / 45).toFixed(1); // 45kg standard neem coated urea bag

  const potashKg = Math.round(totalAcres * currentCrop.potashKgPerAcre);
  const potashBags = (potashKg / 50).toFixed(1);

  // Yield & Value Estimation
  const yieldMin = Math.round(totalAcres * currentCrop.expectedYieldMin);
  const yieldMax = Math.round(totalAcres * currentCrop.expectedYieldMax);

  const revenueMin = yieldMin * currentCrop.avgPricePerQuintal;
  const revenueMax = yieldMax * currentCrop.avgPricePerQuintal;

  // Est. Input Cost (Seed + Fertilizer rough estimate)
  const estFertilizerCost = Math.round(
    parseFloat(dapBags) * 1350 + parseFloat(ureaBags) * 267 + parseFloat(potashBags) * 1700
  );

  const categories = ['All', 'Cereals & Grains', 'Cash Crops', 'Pulses & Dal', 'Oilseeds', 'Vegetables'];

  const filteredCrops = selectedCategory === 'All'
    ? CROP_DATABASE
    : CROP_DATABASE.filter((c) => c.category === selectedCategory);

  const handleCopySummary = () => {
    const summary = `🌾 Krishakarya Crop & Seed Calculation
--------------------------------
Field Size: ${numLand} ${currentUnit.unitName.split('(')[0].trim()} (= ${totalAcres.toFixed(2)} Acres / ${totalHectares.toFixed(2)} Ha)
Selected Crop: ${currentCrop.nameEn} (${currentCrop.nameHi})

🌱 Seed Requirement: ${seedMin} - ${seedMax} ${currentCrop.seedUnit}
🧪 Fertilizer Recommendation:
 - DAP: ${dapKg} Kg (~${dapBags} Bags)
 - Neem Coated Urea: ${ureaKg} Kg (~${ureaBags} Bags)
 - MOP (Potash): ${potashKg} Kg (~${potashBags} Bags)

🌾 Expected Yield: ${yieldMin} - ${yieldMax} Quintals
💰 Est. Gross Revenue: ₹${revenueMin.toLocaleString('en-IN')} - ₹${revenueMax.toLocaleString('en-IN')} (At ₹${currentCrop.avgPricePerQuintal}/Quintal)
--------------------------------
Calculated on Krishakarya App`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePushToLedger = () => {
    if (onAddToLedger) {
      onAddToLedger({
        title: `Seed & Fertilizer Inputs for ${currentCrop.nameEn} (${totalAcres.toFixed(1)} Acres)`,
        category: 'seed_fertilizer',
        type: 'expense',
        amount: estFertilizerCost > 0 ? estFertilizerCost : 5000,
        cropName: currentCrop.nameEn,
        notes: `Est. Seeds: ${seedMin}-${seedMax} ${currentCrop.seedUnit}, DAP: ${dapKg}kg, Urea: ${ureaKg}kg.`,
      });
      setAddedToLedger(true);
      setTimeout(() => setAddedToLedger(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-3xl w-full shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-2xl text-emerald-700 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2 leading-tight">
                Land Acreage & Seed Calculator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Accurate seed rates, fertilizer schedule & yield estimation for 20+ crops
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Step 1: Land Unit & Area */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> 1. Enter Land Measurement
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Land Area Value
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={landValue}
                onChange={(e) => setLandValue(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-black text-slate-900 dark:text-slate-100 text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Regional Land Unit
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {LAND_UNITS.map((unit) => (
                  <option key={unit.unitId} value={unit.unitId}>
                    {unit.unitName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversion pill */}
          <div className="flex items-center justify-between bg-emerald-900 text-emerald-100 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs">
            <span>Equivalent Size:</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-300 font-extrabold text-sm">{totalAcres.toFixed(2)} Acres</span>
              <span className="text-emerald-300/80">|</span>
              <span className="text-emerald-200">{totalHectares.toFixed(2)} Hectares</span>
            </div>
          </div>
        </div>

        {/* Step 2: Select Crop */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5" /> 2. Select Crop ({filteredCrops.length} Available)
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Crop Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {filteredCrops.map((crop) => {
              const isSelected = crop.id === selectedCropId;
              return (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => setSelectedCropId(crop.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[56px] ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                  }`}
                >
                  <span className="font-extrabold text-xs leading-tight">{crop.nameEn}</span>
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                    {crop.nameHi}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Detailed Output Cards */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-emerald-900 to-green-950 text-white p-4 sm:p-5 rounded-2xl shadow-lg space-y-4 border border-emerald-700/50">
            
            <div className="flex items-start justify-between border-b border-emerald-800/80 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Calculated Requirements for</span>
                <h4 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1.5">
                  {currentCrop.nameEn} <span className="text-xs font-normal text-emerald-200">({currentCrop.nameHi})</span>
                </h4>
                <p className="text-[11px] text-emerald-200 font-medium">
                  {numLand} {currentUnit.unitName.split('(')[0].trim()} = <strong className="text-white">{totalAcres.toFixed(2)} Acres</strong>
                </p>
              </div>

              <span className="px-2.5 py-1 bg-emerald-800/90 text-amber-300 border border-emerald-600/50 rounded-lg text-[10px] font-black uppercase">
                {currentCrop.category}
              </span>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Seed Requirement */}
              <div className="bg-emerald-800/60 p-3.5 rounded-xl border border-emerald-700/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-amber-300" /> Seed Quantity
                </span>
                <p className="text-xl font-black text-white">
                  {seedMin} - {seedMax} <span className="text-xs text-amber-300 font-bold">{currentCrop.seedUnit}</span>
                </p>
                <p className="text-[10px] text-emerald-200">
                  Rate: {currentCrop.seedRateKgMin}-{currentCrop.seedRateKgMax} {currentCrop.seedUnit}/Acre
                </p>
              </div>

              {/* Fertilizer Recommendation */}
              <div className="bg-emerald-800/60 p-3.5 rounded-xl border border-emerald-700/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-300" /> Fertilizer Needed
                </span>
                <div className="text-xs font-bold text-white space-y-0.5">
                  <p>DAP: <span className="text-amber-300 font-black">{dapKg} Kg</span> (~{dapBags} Bags)</p>
                  <p>Urea: <span className="text-amber-300 font-black">{ureaKg} Kg</span> (~{ureaBags} Bags)</p>
                  <p>MOP Potash: <span className="text-amber-300 font-black">{potashKg} Kg</span> (~{potashBags} Bags)</p>
                </div>
              </div>

              {/* Yield & Gross Revenue */}
              <div className="bg-emerald-800/60 p-3.5 rounded-xl border border-emerald-700/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-300" /> Est. Yield & Revenue
                </span>
                <p className="text-sm font-black text-white">
                  Yield: <span className="text-amber-300">{yieldMin} - {yieldMax} Qtl</span>
                </p>
                <p className="text-sm font-black text-amber-300">
                  Revenue: ₹{revenueMin.toLocaleString('en-IN')} - ₹{revenueMax.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-emerald-200">
                  @ ₹{currentCrop.avgPricePerQuintal}/Quintal
                </p>
              </div>

            </div>

            {/* Additional Ag Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-emerald-950/80 p-3 rounded-xl border border-emerald-800/60">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Spacing & Season</span>
                <p className="font-semibold text-white">{currentCrop.recommendedSpacing}</p>
                <p className="text-emerald-300 text-[11px]">{currentCrop.sowingSeason} • {currentCrop.harvestingDays}</p>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase">Agri Advisory Tip</span>
                <p className="text-[11px] text-slate-200 italic leading-snug">{currentCrop.growingTips}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t dark:border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Summary!' : 'Copy Calculation'}</span>
            </button>

            {onAddToLedger && (
              <button
                type="button"
                onClick={handlePushToLedger}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                {addedToLedger ? <Check className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                <span>{addedToLedger ? 'Saved to Khatabook!' : 'Add Cost to Ledger'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
          >
            Close Calculator
          </button>
        </div>

      </div>
    </div>
  );
};
