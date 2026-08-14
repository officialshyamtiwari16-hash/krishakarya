import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LedgerEntry, LedgerCategory, Booking, User } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  DollarSign, 
  Filter, 
  Search, 
  Users, 
  Tractor, 
  Sprout, 
  Printer, 
  CheckCircle2, 
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Tag
} from 'lucide-react';
import { saveLedgerEntryToFirestore, deleteLedgerEntryFromFirestore } from '../lib/firestoreService';

interface KisanKhatabookProps {
  currentUser: User | null;
  ledgerEntries: LedgerEntry[];
  myBookings: Booking[];
  onAddLedgerEntry: (entry: LedgerEntry) => void;
  onDeleteLedgerEntry: (id: string) => void;
  onSyncBookingsToLedger: () => void;
}

export const CATEGORY_LABELS: Record<LedgerCategory, { label: string; type: 'income' | 'expense'; icon: string }> = {
  sahyogi_labor: { label: 'Sahyogi Labor Worker', type: 'expense', icon: '👥' },
  machinery_rental: { label: 'Machinery Rental Cost', type: 'expense', icon: '🚜' },
  crop_sale: { label: 'Crop / Grain Sale Income', type: 'income', icon: '🌾' },
  seed_fertilizer: { label: 'Seed, Fertilizer & Inputs', type: 'expense', icon: '🌱' },
  diesel_irrigation: { label: 'Diesel, Pump & Irrigation', type: 'expense', icon: '⛽' },
  government_subsidy: { label: 'Govt Subsidy / PM Kisan', type: 'income', icon: '🏛️' },
  other_expense: { label: 'Other Farm Expenses', type: 'expense', icon: '💸' },
  other_income: { label: 'Other Income', type: 'income', icon: '💰' },
};

export const KisanKhatabook: React.FC<KisanKhatabookProps> = ({
  currentUser,
  ledgerEntries,
  myBookings,
  onAddLedgerEntry,
  onDeleteLedgerEntry,
  onSyncBookingsToLedger,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const [entryError, setEntryError] = useState('');

  // Form States
  const [entryTitle, setEntryTitle] = useState('');
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [entryCategory, setEntryCategory] = useState<LedgerCategory>('seed_fertilizer');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [entryCrop, setEntryCrop] = useState('');
  const [entryParty, setEntryParty] = useState('');
  const [entryPaymentMode, setEntryPaymentMode] = useState<'cash' | 'online' | 'bank_transfer' | 'credit_udhar'>('cash');
  const [entryNotes, setEntryNotes] = useState('');

  // Calculations
  const totalIncome = ledgerEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalExpense = ledgerEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netProfitLoss = totalIncome - totalExpense;

  // Filtered List
  const filteredEntries = ledgerEntries.filter((entry) => {
    if (filterType !== 'all' && entry.type !== filterType) return false;
    if (filterCategory !== 'all' && entry.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchParty = entry.partyName?.toLowerCase().includes(q);
      const matchCrop = entry.cropName?.toLowerCase().includes(q);
      return matchTitle || matchParty || matchCrop;
    }
    return true;
  });

  const handleSyncBookings = () => {
    onSyncBookingsToLedger();
    setSyncSuccessMsg('Synced confirmed & completed Krishakarya bookings into Khatabook!');
    setTimeout(() => setSyncSuccessMsg(''), 4000);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError('');
    if (!currentUser) {
      setEntryError('Please sign in to save records to your Kisan Khatabook.');
      return;
    }

    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt <= 0) {
      setEntryError('Please enter a valid positive amount.');
      return;
    }

    const newEntry: LedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      date: entryDate,
      title: entryTitle.trim() || 'Farm Transaction',
      type: entryType,
      category: entryCategory,
      amount: amt,
      cropName: entryCrop.trim() || undefined,
      partyName: entryParty.trim() || undefined,
      paymentMode: entryPaymentMode,
      notes: entryNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddLedgerEntry(newEntry);
    saveLedgerEntryToFirestore(newEntry);

    // Reset Form
    setEntryTitle('');
    setEntryAmount('');
    setEntryCrop('');
    setEntryParty('');
    setEntryNotes('');
    setEntryError('');
    setIsAddModalOpen(false);
  };

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-800 to-amber-950 text-white p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Kisan Bahi Khata <span className="text-amber-300 font-extrabold text-sm sm:text-base">(Farm Ledger Record)</span>
            </h2>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
            Track all labor payments, machinery rent, seed/fertilizer expenses & crop sales. Automatically calculate total costs and net profit/loss for your farm.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleSyncBookings}
            className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs border border-emerald-400/40 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
            <span>Sync Krishakarya Bookings</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Entry</span>
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Income */}
        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4 text-emerald-600 icon-micro-rotate" /> Total Farm Income (आय)
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
              <AnimatedCounter value={ledgerEntries.filter((e) => e.type === 'income').length} /> Entries
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">
            ₹<AnimatedCounter value={totalIncome} />
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Crop sales, Mandi payouts & subsidies</p>
        </div>

        {/* Total Expense */}
        <div className="glass-card p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <ArrowDownRight className="w-4 h-4 text-rose-600 icon-micro-rotate" /> Total Farm Expenses (खर्च)
            </span>
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">
              <AnimatedCounter value={ledgerEntries.filter((e) => e.type === 'expense').length} /> Entries
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600">
            ₹<AnimatedCounter value={totalExpense} />
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Labor, machinery rent, seeds & fertilizer</p>
        </div>

        {/* Net Profit / Loss */}
        <div className={`p-5 rounded-2xl border shadow-md space-y-1 ${
          netProfitLoss >= 0 
            ? 'bg-gradient-to-br from-emerald-900 to-teal-950 text-white border-emerald-700/50' 
            : 'bg-gradient-to-br from-rose-950 to-slate-900 text-white border-rose-800/50'
        }`}>
          <div className="flex items-center justify-between text-emerald-200">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-amber-300 icon-micro-rotate" /> Net Profit / Loss (शुद्ध लाभ)
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white/10 rounded-md text-amber-300">
              {netProfitLoss >= 0 ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            ₹<AnimatedCounter value={Math.abs(netProfitLoss)} />
          </p>
          <p className="text-[11px] text-emerald-200/90 font-medium">
            {netProfitLoss >= 0 ? 'Total Income exceeds farm costs' : 'Total Expenses exceed farm sales'}
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, party, crop..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterType === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({ledgerEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('income')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterType === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setFilterType('expense')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                filterType === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Expenses
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
              <option key={catKey} value={catKey}>
                {info.icon} {info.label}
              </option>
            ))}
          </select>

          {/* Action Print */}
          <button
            type="button"
            onClick={handlePrintLedger}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <Printer className="w-3.5 h-3.5" /> Print Ledger
          </button>

        </div>
      </div>

      {/* Ledger Table Log */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">No Ledger Entries Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't recorded any transactions yet or no entries match your search filter. Click "+ Add Entry" or "Sync <span className="text-emerald-600 dark:text-emerald-400 font-bold">Krishakarya</span> Bookings" to start recording!
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add First Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Transaction Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Crop / Party</th>
                  <th className="p-3.5 text-right">Amount (₹)</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {filteredEntries.map((entry) => {
                  const catInfo = CATEGORY_LABELS[entry.category] || CATEGORY_LABELS.other_expense;
                  const isIncome = entry.type === 'income';

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                      
                      {/* Date */}
                      <td className="p-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {entry.date}
                      </td>

                      {/* Title */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{entry.title}</span>
                          {entry.bookingId && (
                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-black">
                              Synced Booking
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{entry.notes}</p>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          isIncome 
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.label}</span>
                        </span>
                      </td>

                      {/* Crop / Party */}
                      <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 text-[11px]">
                        {entry.cropName && (
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 block">🌾 {entry.cropName}</span>
                        )}
                        {entry.partyName && (
                          <span className="text-slate-500 block">👤 {entry.partyName}</span>
                        )}
                        {!entry.cropName && !entry.partyName && <span className="text-slate-400">-</span>}
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 whitespace-nowrap text-right font-black text-sm">
                        <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isIncome ? '+' : '-'} ₹{(entry.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete ledger record "${entry.title}"?`)) {
                              onDeleteLedgerEntry(entry.id);
                              deleteLedgerEntryFromFirestore(entry.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Ledger Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 my-auto">
            
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Record Khatabook Entry
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5 text-xs">
              {entryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span>{entryError}</span>
                </div>
              )}
              
              {/* Type Toggle */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('expense');
                      setEntryCategory('sahyogi_labor');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs transition-all ${
                      entryType === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    💸 Expense (खर्च)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('income');
                      setEntryCategory('crop_sale');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs transition-all ${
                      entryType === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    💰 Income (कमाई)
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Description *
                </label>
                <input
                  type="text"
                  required
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  placeholder={entryType === 'expense' ? 'e.g. Paddy Harvesting Workers Payment' : 'e.g. Wheat Sale at Mandi'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value as LedgerCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                >
                  {Object.entries(CATEGORY_LABELS)
                    .filter(([_, info]) => info.type === entryType)
                    .map(([catKey, info]) => (
                      <option key={catKey} value={catKey}>
                        {info.icon} {info.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Crop & Party Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Crop Name (Optional)</label>
                  <input
                    type="text"
                    value={entryCrop}
                    onChange={(e) => setEntryCrop(e.target.value)}
                    placeholder="e.g. Wheat"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Party / Mandi (Optional)</label>
                  <input
                    type="text"
                    value={entryParty}
                    onChange={(e) => setEntryParty(e.target.value)}
                    placeholder="e.g. Kanpur Grain Mandi"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {(['cash', 'online', 'bank_transfer', 'credit_udhar'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEntryPaymentMode(mode)}
                      className={`py-1.5 rounded-lg font-extrabold capitalize border transition-all ${
                        entryPaymentMode === mode
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="e.g. Payment made in cash after work completion."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md"
                >
                  Save to Khatabook
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
