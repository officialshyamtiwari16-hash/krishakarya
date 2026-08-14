import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sahyogi, User, Booking } from '../types';
import { 
  Users, 
  Search, 
  MapPin, 
  Star, 
  Calendar, 
  Plus, 
  Filter, 
  X, 
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AnimatedCounter } from './AnimatedCounter';

interface SahyogiListingsProps {
  sahyogis: Sahyogi[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onBookSahyogi: (booking: Booking) => void;
  onAddReview: (sahyogiId: string, rating: number, comment: string) => void;
  onOpenAddListing: () => void;
}

const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const SahyogiListings: React.FC<SahyogiListingsProps> = ({
  sahyogis = [],
  currentUser,
  onOpenAuth,
  onBookSahyogi,
  onAddReview,
  onOpenAddListing,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [maxRate, setMaxRate] = useState<number>(1000);
  const [selectedSahyogi, setSelectedSahyogi] = useState<Sahyogi | null>(null);
  const [bookingToast, setBookingToast] = useState<string | null>(null);

  // Booking Modal State
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => formatLocalDate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return formatLocalDate(d);
  });
  const [acresOrHours, setAcresOrHours] = useState('3');
  const [hireUnit, setHireUnit] = useState<'days' | 'hours' | 'acres'>('days');
  const [hireNotes, setHireNotes] = useState('');

  // Review Modal state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  // Unique skills and districts
  const allSkills = ['All', 'Harvesting', 'Sowing', 'Tractor Driver', 'Irrigation', 'Crop Protection', 'Threshing'];
  const allDistricts = ['All', ...Array.from(new Set(sahyogis.map((s) => s.district)))];

  // Filter logic
  const filteredSahyogis = sahyogis.filter((s) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      s.name.toLowerCase().includes(searchLower) ||
      s.village.toLowerCase().includes(searchLower) ||
      s.district.toLowerCase().includes(searchLower) ||
      s.state.toLowerCase().includes(searchLower) ||
      s.skills.some((skill) => skill.toLowerCase().includes(searchLower)) ||
      (s.bio && s.bio.toLowerCase().includes(searchLower));

    const matchesSkill =
      selectedSkill === 'All' || s.skills.includes(selectedSkill);

    const matchesDistrict =
      selectedDistrict === 'All' || s.district === selectedDistrict;

    const matchesRate = s.dailyRate <= maxRate;

    return matchesSearch && matchesSkill && matchesDistrict && matchesRate;
  });

  const calculateTotalCost = (dailyRate: number, hourlyRate: number): number => {
    if (hireUnit === 'days') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.max(86400000, end.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return days * dailyRate;
    } else if (hireUnit === 'hours') {
      return (parseInt(acresOrHours) || 1) * hourlyRate;
    } else {
      return (parseFloat(acresOrHours) || 1) * dailyRate;
    }
  };

  const handleConfirmHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSahyogi) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const total = calculateTotalCost(selectedSahyogi.dailyRate, selectedSahyogi.hourlyRate);

    const booking: Booking = {
      id: `bok_${Date.now()}`,
      type: 'sahyogi',
      itemId: selectedSahyogi.id,
      itemName: selectedSahyogi.name,
      itemImage: selectedSahyogi.photo,
      renterId: currentUser.id,
      renterName: currentUser.name,
      renterPhone: currentUser.phone,
      ownerId: selectedSahyogi.userId || selectedSahyogi.id,
      ownerName: selectedSahyogi.name,
      ownerPhone: selectedSahyogi.phone,
      startDate: startDate,
      endDate: endDate,
      unit: hireUnit,
      quantity: hireUnit === 'days' ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) || 1 : parseFloat(acresOrHours) || 1,
      dailyRate: selectedSahyogi.dailyRate,
      totalAmount: total,
      totalCost: total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      notes: hireNotes,
      location: `${selectedSahyogi.village}, ${selectedSahyogi.district}`,
    };

    onBookSahyogi(booking);
    setIsHireModalOpen(false);
    setBookingToast(`Booking request sent with status Pending for ${selectedSahyogi.name}! Check your Bookings tab.`);
    setTimeout(() => setBookingToast(null), 5000);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSahyogi || !reviewComment.trim()) return;

    onAddReview(selectedSahyogi.id, reviewRating, reviewComment);
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
            className="fixed top-20 right-4 z-50 max-w-md bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-bold leading-relaxed">{bookingToast}</p>
            <button onClick={() => setBookingToast(null)} className="text-emerald-300 hover:text-white text-xs font-bold ml-auto">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-4 sm:p-5 text-white shadow-xl space-y-2 border border-emerald-500/30"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <UserCheck className="w-3 h-3 text-amber-300 icon-micro-rotate" /> Rated Agricultural Helpers (Sahyogi)
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight leading-snug">
              Hire Skilled <span className="text-amber-400">Sahyogi Labor</span> for Harvesting & Crop Work
            </h1>
            <p className="text-emerald-100 text-[11px] leading-tight">
              Connect with local Sahyogis for wheat/paddy harvesting, tractor operation, sowing, and irrigation.
            </p>
          </div>

          <button
            onClick={onOpenAddListing}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-[11px] shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 self-start sm:self-center btn-futuristic pulse-glow-cta cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Register as Sahyogi
          </button>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-2xl p-4 sm:p-5 shadow-sm space-y-4"
      >
        {/* Horizontal Skill Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar smooth-scroll">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-600" /> Service Type:
          </span>
          {allSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                selectedSkill === skill
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {skill === 'All' ? 'All Operations' : skill}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search helper name, location (village, district) or skill (harvesting, tractor driver)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="All">All Districts ({allDistricts.length - 1})</option>
              {allDistricts.filter(d => d !== 'All').map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-center px-2">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1">
              <span>Max Rate: ₹<AnimatedCounter value={maxRate} />/day</span>
            </div>
            <input
              type="range"
              min="200"
              max="1500"
              step="50"
              value={maxRate}
              onChange={(e) => setMaxRate(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          {(searchTerm || selectedSkill !== 'All' || selectedDistrict !== 'All' || maxRate < 1500) ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSkill('All');
                setSelectedDistrict('All');
                setMaxRate(1500);
              }}
              className="text-emerald-700 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear All Filters
            </button>
          ) : <div />}

          <div className="text-slate-500 font-medium">
            Found <span className="font-bold text-emerald-700"><AnimatedCounter value={filteredSahyogis.length} /></span> Sahyogi Profiles
          </div>
        </div>
      </motion.div>

      {/* Sahyogi Cards Grid */}
      {filteredSahyogis.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 icon-micro-rotate" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Sahyogi Helpers Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Be the first to list yourself or your team as a Sahyogi worker to offer agricultural labor services to local farmers.
            </p>
          </div>
          <button
            onClick={onOpenAddListing}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-sm btn-futuristic cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register as a Sahyogi Helper
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSahyogis.map((sahyogi, index) => (
            <motion.div
              key={sahyogi.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                    <Users className="w-7 h-7 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">
                        {sahyogi.name}
                      </h3>
                      <span className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {sahyogi.rating} ({sahyogi.reviewCount})
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      {sahyogi.village}, {sahyogi.district}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {sahyogi.experienceYears} Years Exp.
                      </span>
                      {sahyogi.teamSize && sahyogi.teamSize > 1 && (
                        <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Team of {sahyogi.teamSize}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {sahyogi.bio}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {sahyogi.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                  Daily Rate
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-800">
                  ₹<AnimatedCounter value={sahyogi.dailyRate} />
                  <span className="text-xs font-normal text-slate-500"> / day</span>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full xs:w-auto justify-end">
                <button
                  onClick={() => setSelectedSahyogi(sahyogi)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-colors min-h-[38px] cursor-pointer"
                >
                  View Details
                </button>
                <button
                  onClick={() => {
                    setSelectedSahyogi(sahyogi);
                    setIsHireModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 min-h-[38px] btn-futuristic cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> {t('bookNow')}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      {/* Detail & Hire Modal */}
      {selectedSahyogi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900">

            <div className="bg-gradient-to-r from-emerald-800 to-green-900 p-5 sm:p-6 text-white relative flex-shrink-0">
              <button
                onClick={() => setSelectedSahyogi(null)}
                className="absolute top-4 right-4 text-emerald-200 hover:text-white bg-white/10 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center ring-4 ring-white/20 shadow-md flex-shrink-0">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-700" />
                </div>
                <div className="min-w-0 flex-1 pr-6">

                  <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full mb-1">
                    Verified Sahyogi Profile
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{selectedSahyogi.name}</h2>
                  <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {selectedSahyogi.village}, {selectedSahyogi.district}, {selectedSahyogi.state}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Daily Rate</span>
                  <p className="text-lg font-extrabold text-emerald-800">₹{selectedSahyogi.dailyRate} / day</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Hourly Rate</span>
                  <p className="text-lg font-extrabold text-slate-900">₹{selectedSahyogi.hourlyRate} / hour</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Rating & Trust</span>
                  <p className="text-lg font-extrabold text-amber-600 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    {selectedSahyogi.rating} ({selectedSahyogi.reviewCount} reviews)
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">About Sahyogi</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedSahyogi.bio}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Work Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSahyogi.skills.map((s) => (
                    <span key={s} className="bg-emerald-100 text-emerald-900 font-bold text-xs px-3 py-1 rounded-xl">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {isHireModalOpen ? (
                <form onSubmit={handleConfirmHire} className="bg-emerald-50/80 border-2 border-emerald-500 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-700" /> Sahyogi Booking Form
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsHireModalOpen(false)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hire Unit</label>
                      <select
                        value={hireUnit}
                        onChange={(e) => setHireUnit(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                      >
                        <option value="days">Per Day Basis</option>
                        <option value="hours">Per Hour Basis</option>
                        <option value="acres">Per Acre Field Basis</option>
                      </select>
                    </div>

                    {hireUnit === 'days' ? (
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
                              className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
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
                              className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
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
                              className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
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
                              className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
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
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Number of {hireUnit === 'hours' ? 'Hours' : 'Acres'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={acresOrHours}
                          onChange={(e) => setAcresOrHours(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Special Instructions / Farm Location Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Wheat field near Tubewell #2, bring harvesting sickles"
                      value={hireNotes}
                      onChange={(e) => setHireNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="bg-emerald-900 text-white p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-200 font-bold uppercase">Total Calculated Cost</span>
                      <p className="text-xl font-extrabold text-amber-400">
                        ₹{calculateTotalCost(selectedSahyogi.dailyRate, selectedSahyogi.hourlyRate)}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-md"
                    >
                      Confirm Booking & Unlock Contact
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div>
                    <h5 className="font-bold text-emerald-950 text-sm">Need help for harvesting or field work?</h5>
                    <p className="text-xs text-emerald-800">Hire {selectedSahyogi.name} directly.</p>
                  </div>
                  <button
                    onClick={() => setIsHireModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4" /> Book Sahyogi Now
                  </button>
                </div>
              )}

              {/* Reviews Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Farmer Ratings & Reviews ({selectedSahyogi.reviews.length})</h4>
                  <button
                    onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    + Write Review
                  </button>
                </div>

                {isReviewFormOpen && (
                  <form onSubmit={handleSubmitReview} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Review Comment</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Describe your work experience with this Sahyogi..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                    >
                      Submit Rating
                    </button>
                  </form>
                )}

                <div className="space-y-3">
                  {selectedSahyogi.reviews.map((rev) => (
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
