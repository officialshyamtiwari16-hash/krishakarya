import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Scale,
  CheckCircle2,
  Clock,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import { MandiRateItem, MandiWeeklyTrendPoint } from '../types';
import { getOrGenerateWeeklyTrends, analyzeSellingDecision, GOI_MSP_BENCHMARKS } from '../lib/mandiTrendService';

interface MandiPriceTrendsChartProps {
  rates: MandiRateItem[];
  selectedDistrict: string;
  selectedState: string;
  marketName?: string;
  updatedAt?: string;
}

type ChartDisplayMode = 'area' | 'spread' | 'arrival';

export const MandiPriceTrendsChart: React.FC<MandiPriceTrendsChartProps> = ({
  rates,
  selectedDistrict,
  selectedState,
  marketName,
  updatedAt,
}) => {
  // Available crops
  const availableCrops = useMemo(() => {
    return rates.filter((r) => r.modalPrice > 0);
  }, [rates]);

  // Selected primary commodity
  const [selectedCropName, setSelectedCropName] = useState<string>(() => {
    if (availableCrops.length > 0) {
      // Prefer Wheat, Paddy, or first item
      const preferred = availableCrops.find(
        (c) => c.commodity.toLowerCase().includes('wheat') || c.commodity.includes('गेहूं')
      );
      return preferred ? preferred.commodity : availableCrops[0].commodity;
    }
    return '';
  });

  // Selected comparison commodity (optional)
  const [compareCropName, setCompareCropName] = useState<string>('');

  // Chart view mode
  const [chartMode, setChartMode] = useState<ChartDisplayMode>('area');

  // Interactive quantity for Kisan profit calculation (in Quintals / units)
  const [produceQuantity, setProduceQuantity] = useState<number>(30);

  // Sync if selected crop is no longer in list
  React.useEffect(() => {
    if (availableCrops.length > 0 && !availableCrops.some((c) => c.commodity === selectedCropName)) {
      setSelectedCropName(availableCrops[0].commodity);
    }
  }, [availableCrops, selectedCropName]);

  const activeCrop = useMemo(() => {
    return availableCrops.find((c) => c.commodity === selectedCropName) || availableCrops[0] || null;
  }, [availableCrops, selectedCropName]);

  const compareCrop = useMemo(() => {
    if (!compareCropName) return null;
    return availableCrops.find((c) => c.commodity === compareCropName) || null;
  }, [availableCrops, compareCropName]);

  // Generate or retrieve weekly trends for active crop
  const weeklyData = useMemo(() => {
    if (!activeCrop) return [];
    return getOrGenerateWeeklyTrends(activeCrop);
  }, [activeCrop]);

  // Weekly trends for compare crop if active
  const compareWeeklyData = useMemo(() => {
    if (!compareCrop) return [];
    return getOrGenerateWeeklyTrends(compareCrop);
  }, [compareCrop]);

  // Combined dataset for recharts
  const combinedChartData = useMemo(() => {
    if (!weeklyData.length) return [];
    return weeklyData.map((point, i) => {
      const compPoint = compareWeeklyData[i];
      return {
        ...point,
        compareModalPrice: compPoint ? compPoint.modalPrice : undefined,
        compareCropName: compareCrop ? compareCrop.commodity : undefined,
      };
    });
  }, [weeklyData, compareWeeklyData, compareCrop]);

  // Selling decision analysis
  const sellingDecision = useMemo(() => {
    if (!activeCrop || !weeklyData.length) return null;
    return analyzeSellingDecision(activeCrop, weeklyData);
  }, [activeCrop, weeklyData]);

  if (!activeCrop || weeklyData.length === 0) {
    return null;
  }

  // Calculate high and low modal price over 7 days
  const weeklyPrices = weeklyData.map((d) => d.modalPrice);
  const weekHigh = Math.max(...weeklyPrices);
  const weekLow = Math.min(...weeklyPrices);
  const weekChange = weeklyData[weeklyData.length - 1].modalPrice - weeklyData[0].modalPrice;
  const weekChangePct = Number(((weekChange / weeklyData[0].modalPrice) * 100).toFixed(1));

  // Kisan Revenue Projections
  const totalRevenue = Math.round(produceQuantity * activeCrop.modalPrice);
  const revenueGainVsLow = Math.round(produceQuantity * (activeCrop.modalPrice - weekLow));

  return (
    <div
      id="mandi-weekly-price-trends-container"
      className="bg-gradient-to-b from-white to-slate-50/80 rounded-3xl p-4 sm:p-6 border border-emerald-500/25 shadow-sm space-y-5"
    >
      {/* Top Header: Title & Crop Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              Recharts Visualizer
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Kisan Selling Advisory (बिक्री सलाह)
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            Weekly Price Trends & Market Decision
            <span className="text-xs sm:text-sm font-semibold text-slate-500 hidden sm:inline">
              (साप्ताहिक मूल्य रुझान)
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Analyze 7-day APMC price oscillations, arrival volume, and MSP benchmarks for{' '}
            <strong className="text-emerald-900 font-bold">{selectedDistrict}</strong> Mandi.
          </p>
        </div>

        {/* Commodity Selector Dropdown and Compare Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex-1 sm:flex-initial">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Select Crop (फसल चुनें)
            </label>
            <select
              id="mandi-trend-crop-select"
              aria-label="Select Crop for Price Trends"
              value={selectedCropName}
              onChange={(e) => setSelectedCropName(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 bg-white hover:bg-slate-50 border border-emerald-500/30 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {availableCrops.map((c) => (
                <option key={c.commodity} value={c.commodity}>
                  {c.commodity} (₹{c.modalPrice}/{c.unit.replace('₹/', '')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 sm:flex-initial">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Compare Crop (तुलना करें)
            </label>
            <select
              id="mandi-trend-compare-select"
              aria-label="Compare with another crop"
              value={compareCropName}
              onChange={(e) => setCompareCropName(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="">None (Single Crop)</option>
              {availableCrops
                .filter((c) => c.commodity !== selectedCropName)
                .map((c) => (
                  <option key={c.commodity} value={c.commodity}>
                    {c.commodity}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Commodity Pills for Easy Mobile Switching */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap pl-0.5 pr-1">
          Quick Switch:
        </span>
        {availableCrops.slice(0, 6).map((c) => {
          const isSelected = c.commodity === selectedCropName;
          return (
            <button
              key={c.commodity}
              onClick={() => setSelectedCropName(c.commodity)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {c.commodity.split('/')[0].trim()}
            </button>
          );
        })}
      </div>

      {/* Primary Overview Bar & Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Current Modal Rate */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Today's Modal Bhav
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-slate-900">
              ₹{activeCrop.modalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">{activeCrop.unit}</span>
          </div>
          <div className="text-[11px] font-bold flex items-center gap-1">
            {weekChange > 0 ? (
              <span className="text-emerald-700 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +₹{weekChange} ({weekChangePct}%) 7D
              </span>
            ) : weekChange < 0 ? (
              <span className="text-rose-600 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                -₹{Math.abs(weekChange)} ({weekChangePct}%) 7D
              </span>
            ) : (
              <span className="text-slate-500 flex items-center">
                <Minus className="w-3 h-3 mr-0.5" />
                ₹0 Stable 7D
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Weekly High / Low Range */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            7-Day Range (रेंज)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm sm:text-base font-black text-slate-800">
              ₹{weekLow} — ₹{weekHigh}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            Negotiation spread: ₹{weekHigh - weekLow} / quintal
          </p>
        </div>

        {/* Metric 3: Government MSP Status */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Govt MSP Benchmark
          </span>
          <div className="flex items-baseline justify-between">
            {sellingDecision?.mspComparison ? (
              <span className="text-sm sm:text-base font-black text-slate-800">
                ₹{sellingDecision.mspComparison.msp.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500">Market Driven</span>
            )}
          </div>
          <p className="text-[10px] font-semibold">
            {sellingDecision?.mspComparison ? (
              sellingDecision.mspComparison.isAboveMsp ? (
                <span className="text-emerald-700">
                  +₹{sellingDecision.mspComparison.diff} above MSP
                </span>
              ) : (
                <span className="text-amber-700">
                  -₹{Math.abs(sellingDecision.mspComparison.diff)} below MSP
                </span>
              )
            ) : (
              <span className="text-slate-400">Non-MSP crop</span>
            )}
          </p>
        </div>

        {/* Metric 4: Selling Signal Indicator */}
        <div
          className={`p-3 rounded-2xl border shadow-xs space-y-1 ${
            sellingDecision?.action === 'SELL_NOW'
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : sellingDecision?.action === 'HOLD'
              ? 'bg-amber-50/70 border-amber-300 text-amber-950'
              : 'bg-blue-50/70 border-blue-300 text-blue-950'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wide opacity-75">
            Recommended Action
          </span>
          <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm">
            {sellingDecision?.action === 'SELL_NOW' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>SELL NOW (बेचें)</span>
              </>
            )}
            {sellingDecision?.action === 'HOLD' && (
              <>
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>HOLD (रोकें)</span>
              </>
            )}
            {sellingDecision?.action === 'SPLIT_SELL' && (
              <>
                <Scale className="w-4 h-4 text-blue-700 shrink-0" />
                <span>SPLIT SELL (आंशिक)</span>
              </>
            )}
          </div>
          <p className="text-[10px] font-semibold opacity-85 truncate">
            {sellingDecision?.confidenceScore}% confidence index
          </p>
        </div>
      </div>

      {/* Chart Display Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setChartMode('area')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartMode === 'area'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trend Wave (भाव रुझान)
          </button>
          <button
            onClick={() => setChartMode('spread')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartMode === 'spread'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Min-Max Spread (रेंज)
          </button>
          <button
            onClick={() => setChartMode('arrival')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartMode === 'arrival'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Price vs Arrivals (आवक)
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>{activeCrop.commodity}</span>
          {compareCrop && (
            <>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" />
              <span>{compareCrop.commodity}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="w-full h-72 sm:h-80 bg-white p-2 sm:p-4 rounded-2xl border border-slate-200/70 shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'area' ? (
            <AreaChart data={combinedChartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                domain={['dataMin - 50', 'dataMax + 50']}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `₹${val}`}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<CustomMandiTooltip unit={activeCrop.unit} />} />
              {sellingDecision?.mspComparison?.msp && (
                <ReferenceLine
                  y={sellingDecision.mspComparison.msp}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Govt MSP: ₹${sellingDecision.mspComparison.msp}`,
                    fill: '#059669',
                    fontSize: 10,
                    fontWeight: 700,
                    position: 'insideTopLeft',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="modalPrice"
                name={activeCrop.commodity}
                stroke="#047857"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#emeraldGradient)"
                activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
              />
              {compareCrop && (
                <Area
                  type="monotone"
                  dataKey="compareModalPrice"
                  name={compareCrop.commodity}
                  stroke="#d97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#amberGradient)"
                  activeDot={{ r: 5, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          ) : chartMode === 'spread' ? (
            <LineChart data={combinedChartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                domain={['dataMin - 40', 'dataMax + 40']}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `₹${val}`}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<CustomMandiTooltip unit={activeCrop.unit} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingBottom: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="maxPrice"
                name="Max Rate (उच्चतम भाव)"
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="modalPrice"
                name="Modal Rate (औसत भाव)"
                stroke="#047857"
                strokeWidth={3.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="minPrice"
                name="Min Rate (न्यूनतम भाव)"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={{ r: 3 }}
              />
            </LineChart>
          ) : (
            <ComposedChart data={combinedChartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                yAxisId="price"
                domain={['dataMin - 60', 'dataMax + 60']}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `₹${val}`}
                tick={{ fill: '#047857', fontSize: 11, fontWeight: 700 }}
              />
              <YAxis
                yAxisId="arrival"
                orientation="right"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `${val}T`}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip content={<CustomMandiTooltip unit={activeCrop.unit} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingBottom: '8px' }}
              />
              <Bar
                yAxisId="arrival"
                dataKey="arrivalTonnes"
                name="Mandi Arrivals (आवक - टन)"
                fill="#cbd5e1"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="modalPrice"
                name="Modal Price (भाव)"
                stroke="#047857"
                strokeWidth={3}
                dot={{ r: 4, fill: '#047857' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Smart Selling Decision Advisory Card */}
      {sellingDecision && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Advisory Box */}
          <div
            className={`md:col-span-7 p-4 sm:p-5 rounded-2xl border space-y-2.5 ${
              sellingDecision.action === 'SELL_NOW'
                ? 'bg-emerald-50/50 border-emerald-200'
                : sellingDecision.action === 'HOLD'
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-blue-50/50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Actionable Recommendation (कृषक परामर्श)
              </span>
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                  sellingDecision.action === 'SELL_NOW'
                    ? 'bg-emerald-700 text-white'
                    : sellingDecision.action === 'HOLD'
                    ? 'bg-amber-700 text-white'
                    : 'bg-blue-700 text-white'
                }`}
              >
                {sellingDecision.titleHindi}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
              {sellingDecision.titleEnglish}
            </h4>

            {/* Bilingual Explanations */}
            <div className="space-y-1.5 text-xs text-slate-700">
              <p className="font-medium bg-white/70 p-2.5 rounded-xl border border-black/5 leading-relaxed">
                🌾 <strong className="font-bold text-slate-900">सलाह (Hindi):</strong>{' '}
                {sellingDecision.reasoningHindi}
              </p>
              <p className="font-normal text-slate-600 bg-white/70 p-2.5 rounded-xl border border-black/5 leading-relaxed">
                📊 <strong className="font-bold text-slate-900">Analysis (English):</strong>{' '}
                {sellingDecision.reasoningEnglish}
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-semibold">
              <span>Peak Day: <strong className="text-slate-800">{sellingDecision.peakDay}</strong></span>
              <span>•</span>
              <span>Lowest Day: <strong className="text-slate-800">{sellingDecision.lowestDay}</strong></span>
            </div>
          </div>

          {/* Interactive Kisan Profit & Revenue Estimator */}
          <div className="md:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                  Kisan Revenue Calculator
                </span>
                <span className="text-[10px] text-slate-400 font-bold">बिक्री लाभ गणक</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Calculate your estimated harvest revenue at current Mandi rate:
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Your Produce Quantity (क्विंटल / मात्रा)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="produce-quantity-input"
                  type="number"
                  min="1"
                  max="1000"
                  value={produceQuantity}
                  onChange={(e) => setProduceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-600">Quintals (क्विंटल)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-600 font-medium">Estimated Revenue:</span>
                <span className="text-base font-black text-emerald-950">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              {revenueGainVsLow > 0 && (
                <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                  <span>Gain vs 7-day low:</span>
                  <span>+₹{revenueGainVsLow.toLocaleString('en-IN')} extra</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              Tip: Always weigh your load at certified APMC electronic weighbridges to avoid trader deduction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Tooltip for Recharts
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
}

const CustomMandiTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MandiWeeklyTrendPoint & {
      compareModalPrice?: number;
      compareCropName?: string;
    };

    return (
      <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-44">
        <div className="text-[11px] font-black text-amber-300 border-b border-slate-800 pb-1">
          {label}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300">Modal Price:</span>
            <span className="font-black text-emerald-400">
              ₹{data.modalPrice.toLocaleString('en-IN')} {unit}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>Range:</span>
            <span>
              ₹{data.minPrice} - ₹{data.maxPrice}
            </span>
          </div>

          {data.arrivalTonnes !== undefined && (
            <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
              <span>Arrivals:</span>
              <span className="font-bold text-slate-200">{data.arrivalTonnes} Tonnes</span>
            </div>
          )}

          {data.compareModalPrice !== undefined && (
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800 text-[11px] text-amber-300">
              <span>{data.compareCropName || 'Compare'}:</span>
              <span className="font-black">₹{data.compareModalPrice}</span>
            </div>
          )}

          {data.msp && (
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800 text-[10px] text-emerald-300">
              <span>Govt MSP:</span>
              <span className="font-bold">₹{data.msp}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};
