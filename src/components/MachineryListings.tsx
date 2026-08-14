import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Machinery, MachineryCategory, User, Booking } from '../types';
import { 
  Tractor, 
  Search, 
  MapPin, 
  Star, 
  Calendar, 
  Filter, 
  X, 
  Plus, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AnimatedCounter } from './AnimatedCounter';

interface MachineryListingsProps {
  machineries: Machinery[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onBookMachinery: (booking: Booking) => void;
  onAddReview: (machineryId: string, rating: number, comment: string) => void;
  onOpenAddListing: () => void;
}

const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const MachineryListings: React.FC<MachineryListingsProps> = ({
  machineries = [],
  currentUser,
  onOpenAuth,
  onBookMachinery,
  onAddReview,
  onOpenAddListing,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [maxRate, setMaxRate] = useState<number>(10000);
  const [selectedMachine, setSelectedMachine] = useState<Machinery | null>(null);
  const [bookingToast, setBookingToast] = useState<string | null>(null);

  // Booking Modal state
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => formatLocalDate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return formatLocalDate(d);
  });
  const [rentalUnit, setRentalUnit] = useState<'days' | 'hours'>('days');
  const [hoursOrDays, setHoursOrDays] = useState('2');
  const [deliveryNeeded, setDeliveryNeeded] = useState(true);
  const [rentNotes, setRentNotes] = useState('');

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const categories: (MachineryCategory | 'All')[] = [
    'All',
    'Tractor',
    'Combine Harvester',
    'Rotavator',
    'Seed Drill',
    'Sprayer & Drone',
    'Thresher',
    'Water Pump & Solar',
    'Agricultural Tools',
  ];

  const districts = ['All', ...Array.from(new Set(machineries.map((m) => m.district)))];

  const filteredMachinery = machineries.filter((m) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      m.title.toLowerCase().includes(searchLower) ||
      m.category.toLowerCase().includes(searchLower) ||
      m.brandModel.toLowerCase().includes(searchLower) ||
      m.village.toLowerCase().includes(searchLower) ||
      m.district.toLowerCase().includes(searchLower) ||
      m.state.toLowerCase().includes(searchLower) ||
      (m.description && m.description.toLowerCase().includes(searchLower)) ||
      (m.ownerName && m.ownerName.toLowerCase().includes(searchLower));

    const matchesCategory =
      selectedCategory === 'All' || m.category === selectedCategory;

    const matchesDistrict =
      selectedDistrict === 'All' || m.district === selectedDistrict;

    const matchesPrice = m.ratePerDay <= maxRate;

    return matchesSearch && matchesCategory && matchesDistrict && matchesPrice;
  });

  const calculateTotalCost = (m: Machinery): number => {
    if (rentalUnit === 'days') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.max(86400000, end.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return days * m.ratePerDay;
    } else {
      const hrs = parseInt(hoursOrDays) || 1;
      return hrs * m.ratePerHour;
    }
  };

  const handleConfirmRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const total = calculateTotalCost(selectedMachine);

    const booking: Booking = {
      id: `bok_${Date.now()}`,
      type: 'machinery',
      itemId: selectedMachine.id,
      itemName: selectedMachine.title,
      itemImage: selectedMachine.image,
      renterId: currentUser.id,
      renterName: currentUser.name,
      renterPhone: currentUser.phone,
      ownerId: selectedMachine.ownerId,
      ownerName: selectedMachine.ownerName,
      ownerPhone: selectedMachine.ownerPhone,
      startDate: startDate,
      endDate: endDate,
      unit: rentalUnit,
      quantity: rentalUnit === 'days' ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) || 1 : parseInt(hoursOrDays) || 1,
      dailyRate: selectedMachine.ratePerDay,
      totalAmount: total,
      totalCost: total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      notes: `${rentNotes} ${deliveryNeeded ? '(Farm Delivery Requested)' : ''}`,
      location: `${selectedMachine.village}, ${selectedMachine.district}`,
    };

    onBookMachinery(booking);
    setIsRentModalOpen(false);
    setBookingToast(`Machinery rental request submitted with status Pending for ${selectedMachine.title}! Check your Bookings tab.`);
    setTimeout(() => setBookingToast(null), 5000);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !reviewComment.trim()) return;

    onAddReview(selectedMachine.id, reviewRating, reviewComment);
    setReviewComment('');
    setIsReviewFormOpen(false);
  };

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {bookingToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 max-w-md bg-amber-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-xs font-bold leading-relaxed">{bookingToast}</p>
            <button onClick={() => setBookingToast(null)} className="text-amber-300 hover:text-white text-xs font-bold ml-auto">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-amber-950 p-4 sm:p-5 text-white shadow-xl space-y-2 border border-emerald-500/30"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
              <Tractor className="w-3 h-3 icon-micro-rotate" /> Reliable Agricultural Equipment Hub
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight leading-snug">
              Rent Modern <span className="text-amber-400">Tractors & Farming Machinery</span>
            </h1>
            <p className="text-amber-100 text-[11px] leading-tight">
              Rent tractors, combine harvesters, rotavators, spray drones, solar water pumps, and thresher tools.
            </p>
          </div>

          <button
            onClick={onOpenAddListing}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 self-start sm:self-center btn-futuristic pulse-glow-cta cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> List Machine for Rent
          </button>
        </div>
      </motion.div>

      {/* Filter and Category Pills */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-2xl p-4 sm:p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar smooth-scroll">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-600" /> Equipment Type:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search machinery type (tractor, rotavator, drone), model, village, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {districts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist === 'All' ? 'All Locations (Districts)' : `Location: ${dist}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" /> Max Daily Rent: ₹<AnimatedCounter value={maxRate} />
            </span>
            <input
              type="range"
              min={500}
              max={12000}
              step={500}
              value={maxRate}
              onChange={(e) => setMaxRate(Number(e.target.value))}
              className="w-36 accent-emerald-600 cursor-pointer"
            />

            {(searchTerm || selectedCategory !== 'All' || selectedDistrict !== 'All' || maxRate < 12000) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedDistrict('All');
                  setMaxRate(12000);
                }}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Clear All Filters
              </button>
            )}
          </div>

          <div className="text-slate-500 font-medium">
            Showing <span className="font-bold text-emerald-700"><AnimatedCounter value={filteredMachinery.length} /></span> Rentable Equipment
          </div>
        </div>
      </motion.div>

      {/* Grid of Machinery Cards */}
      {filteredMachinery.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Tractor className="w-8 h-8 icon-micro-rotate" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Machinery Listed for Rent Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Be the first to list your tractor, rotavator, harvester, or spray drone for rent to earn income from local farmers.
            </p>
          </div>
          <button
            onClick={onOpenAddListing}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-sm btn-futuristic cursor-pointer"
          >
            <Plus className="w-4 h-4" /> List Machinery for Rent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachinery.map((machine, index) => (
            <motion.div
              key={machine.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {machine.image && machine.image.trim().length > 0 && (
                  <div className="w-full h-40 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                    <img
                      src={machine.image}
                      alt={machine.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border-b border-amber-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="bg-amber-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {machine.category}
                      </span>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{machine.brandModel}</p>
                    </div>
                  </div>
                  {machine.includesOperator && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Driver Included
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {machine.title}
                    </h3>
                    <span className="bg-amber-50 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {machine.rating} ({machine.reviewCount})
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    {machine.village}, {machine.district}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {machine.description}
                  </p>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] grid grid-cols-2 gap-1 text-slate-700">
                    <span>HP: <strong className="text-slate-900">{machine.horsepower > 0 ? <><AnimatedCounter value={machine.horsepower} /> HP</> : 'N/A'}</strong></span>
                    <span>Hourly: <strong className="text-emerald-800">₹<AnimatedCounter value={machine.ratePerHour} />/hr</strong></span>
                  </div>
                </div>
              </div>


            <div className="bg-slate-50 px-4 sm:px-5 py-3 border-t border-slate-100 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Daily Rent Rate
                </span>
                <span className="text-base sm:text-lg font-extrabold text-amber-700">
                  ₹<AnimatedCounter value={machine.ratePerDay} />
                  <span className="text-xs font-normal text-slate-500"> / day</span>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full xs:w-auto justify-end">
                <button
                  onClick={() => setSelectedMachine(machine)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 min-h-[38px] cursor-pointer"
                >
                  Specs & Reviews
                </button>
                <button
                  onClick={() => {
                    setSelectedMachine(machine);
                    setIsRentModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 min-h-[38px] btn-futuristic cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> Rent Equipment
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      {/* Detail & Rental Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="relative p-6 bg-gradient-to-r from-amber-900 via-stone-900 to-emerald-950 text-white flex-shrink-0">
              <button
                onClick={() => setSelectedMachine(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-1.5 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 pr-8">
                <div className="p-3.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-2xl flex-shrink-0">
                  <Tractor className="w-8 h-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full mb-1 inline-block">
                    {selectedMachine.category}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold truncate">{selectedMachine.title}</h2>
                  <p className="text-xs text-amber-200 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> Owner: {selectedMachine.ownerName} ({selectedMachine.village}, {selectedMachine.district})
                  </p>
                </div>
              </div>
            </div>


            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Rate Per Day</span>
                  <p className="text-xl font-extrabold text-amber-700">₹{selectedMachine.ratePerDay}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Rate Per Hour</span>
                  <p className="text-xl font-extrabold text-slate-900">₹{selectedMachine.ratePerHour}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Refundable Deposit</span>
                  <p className="text-xl font-extrabold text-emerald-800">₹{selectedMachine.securityDeposit}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Technical Specifications</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedMachine.specs.map((sp, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between">
                      <span className="text-slate-500">{sp.key}:</span>
                      <strong className="text-slate-900">{sp.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {isRentModalOpen ? (
                <form onSubmit={handleConfirmRental} className="bg-amber-50/80 border-2 border-amber-500 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-700" /> Equipment Rental Booking Form
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsRentModalOpen(false)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Rental Billing Basis</label>
                      <select
                        value={rentalUnit}
                        onChange={(e) => setRentalUnit(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                      >
                        <option value="days">Per Day Basis</option>
                        <option value="hours">Per Hour Basis</option>
                      </select>
                    </div>

                    {rentalUnit === 'days' ? (
                      <>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Quick Booking Dates</label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                const t = new Date().toISOString().split('T')[0];
                                setStartDate(t);
                                setEndDate(t);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              Today (1 Day)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const tom = new Date();
                                tom.setDate(tom.getDate() + 1);
                                const tomStr = tom.toISOString().split('T')[0];
                                setStartDate(tomStr);
                                setEndDate(tomStr);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              Tomorrow
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const s = new Date();
                                const e = new Date();
                                e.setDate(e.getDate() + 2);
                                setStartDate(s.toISOString().split('T')[0]);
                                setEndDate(e.toISOString().split('T')[0]);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              Next 3 Days
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const s = new Date();
                                const e = new Date();
                                e.setDate(e.getDate() + 6);
                                setStartDate(s.toISOString().split('T')[0]);
                                setEndDate(e.toISOString().split('T')[0]);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                            >
                              1 Full Week
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Calendar Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Calendar End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Number of Hours</label>
                        <input
                          type="number"
                          min="1"
                          value={hoursOrDays}
                          onChange={(e) => setHoursOrDays(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="delCheck"
                      checked={deliveryNeeded}
                      onChange={(e) => setDeliveryNeeded(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="delCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Request Farm Delivery by Machine Operator
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Additional Booking Notes / Requirements</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Total acres to harvest, preferred morning/evening time..."
                      value={rentNotes}
                      onChange={(e) => setRentNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Rental Fee</span>
                      <p className="text-xl font-extrabold text-amber-400">
                        ₹{calculateTotalCost(selectedMachine)}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-md"
                    >
                      Confirm Rental & Get Owner Contact
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <div>
                    <h5 className="font-bold text-amber-950 text-sm">Need this machine for your farm?</h5>
                    <p className="text-xs text-amber-800">Direct booking with owner contact info.</p>
                  </div>
                  <button
                    onClick={() => setIsRentModalOpen(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4" /> Rent Machinery
                  </button>
                </div>
              )}

              {/* Reviews */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Farmer Reviews ({selectedMachine.reviews.length})</h4>
                  <button
                    onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                    className="text-xs font-bold text-amber-700 hover:underline"
                  >
                    + Review Machine
                  </button>
                </div>

                {isReviewFormOpen && (
                  <form onSubmit={handleSubmitReview} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Feedback</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="How was the machine condition and operator behavior?"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl"
                    >
                      Post Review
                    </button>
                  </form>
                )}

                <div className="space-y-3">
                  {selectedMachine.reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{rev.authorName}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-500" /> {rev.rating}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{rev.comment}</p>
                      <span className="text-[10px] text-slate-400 block">{rev.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
