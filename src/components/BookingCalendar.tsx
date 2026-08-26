import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Tractor, 
  MapPin, 
  Phone, 
  DollarSign, 
  Filter, 
  Check, 
  X, 
  Info,
  CalendarDays,
  ListFilter,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { Booking, BookingStatus, User as UserType } from '../types';
import { AnimatedCounter } from './AnimatedCounter';

interface BookingCalendarProps {
  bookings: Booking[];
  currentUser: UserType | null;
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus, declineReason?: string) => void;
  onSelectBooking?: (booking: Booking) => void;
  className?: string;
}

const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseLocalDate = (str?: string): Date => {
  if (!str) return new Date();
  const parts = str.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date(str);
};

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  currentUser,
  onUpdateBookingStatus,
  onSelectBooking,
  className = ''
}) => {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return formatLocalDate(new Date());
  });
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sahyogi' | 'machinery'>('all');
  const [onlyUpcoming, setOnlyUpcoming] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'renter' | 'owner'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Decline Modal state
  const [decliningBooking, setDecliningBooking] = useState<Booking | null>(null);
  const [declineReasonInput, setDeclineReasonInput] = useState('');

  // Cancel Modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(formatLocalDate(today));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = formatLocalDate(new Date());

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Role filter
      if (currentUser) {
        if (roleFilter === 'renter' && b.renterId !== currentUser.id) return false;
        if (roleFilter === 'owner' && b.ownerId !== currentUser.id) return false;
      }
      // Type filter (Labor vs Machinery)
      if (typeFilter !== 'all' && b.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;

      // Upcoming only filter (end date or start date >= today)
      if (onlyUpcoming) {
        const endDateStr = b.endDate || b.startDate;
        if (endDateStr < todayStr) return false;
      }

      return true;
    });
  }, [bookings, roleFilter, typeFilter, statusFilter, onlyUpcoming, currentUser, todayStr]);

  // Map of date string 'YYYY-MM-DD' -> Booking[]
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();

    filteredBookings.forEach((b) => {
      // Handle start and end date ranges with safe local date parsing
      const start = b.startDate ? parseLocalDate(b.startDate) : new Date();
      const end = b.endDate ? parseLocalDate(b.endDate) : start;

      // Span across all days in range (safely max 30 days per booking)
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      let count = 0;
      while (cur <= endDay && count < 31) {
        const dateKey = formatLocalDate(cur);
        const existing = map.get(dateKey) || [];
        // Avoid duplicate booking entries in same date
        if (!existing.some(x => x.id === b.id)) {
          existing.push(b);
          map.set(dateKey, existing);
        }
        cur.setDate(cur.getDate() + 1);
        count++;
      }
    });

    return map;
  }, [filteredBookings]);

  // Calendar Day Cells generation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isUpcoming: boolean;
      bookings: Booking[];
      laborCount: number;
      machineryCount: number;
    }> = [];

    // Leading days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = formatLocalDate(prevDate);
      const dayBookings = bookingsByDate.get(dateStr) || [];
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isUpcoming: dateStr >= todayStr,
        bookings: dayBookings,
        laborCount: dayBookings.filter(b => b.type === 'sahyogi').length,
        machineryCount: dayBookings.filter(b => b.type === 'machinery').length,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = formatLocalDate(curDate);
      const dayBookings = bookingsByDate.get(dateStr) || [];
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isUpcoming: dateStr >= todayStr,
        bookings: dayBookings,
        laborCount: dayBookings.filter(b => b.type === 'sahyogi').length,
        machineryCount: dayBookings.filter(b => b.type === 'machinery').length,
      });
    }

    // Trailing days from next month to fill grid (always 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = formatLocalDate(nextDate);
      const dayBookings = bookingsByDate.get(dateStr) || [];
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isUpcoming: dateStr >= todayStr,
        bookings: dayBookings,
        laborCount: dayBookings.filter(b => b.type === 'sahyogi').length,
        machineryCount: dayBookings.filter(b => b.type === 'machinery').length,
      });
    }

    return days;
  }, [year, month, bookingsByDate, todayStr]);

  // Selected date's bookings
  const selectedDateBookings = useMemo(() => {
    return bookingsByDate.get(selectedDateStr) || [];
  }, [bookingsByDate, selectedDateStr]);

  // Upcoming Bookings list sorted chronologically
  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const endDateStr = b.endDate || b.startDate;
        return endDateStr >= todayStr && b.status !== 'Cancelled' && b.status !== 'Declined';
      })
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [bookings, todayStr]);

  // Upcoming labor and machinery counts
  const upcomingLaborCount = useMemo(() => {
    return upcomingBookings.filter(b => b.type === 'sahyogi').length;
  }, [upcomingBookings]);

  const upcomingMachineryCount = useMemo(() => {
    return upcomingBookings.filter(b => b.type === 'machinery').length;
  }, [upcomingBookings]);

  // Jump to next upcoming booking date
  const jumpToNextBooking = () => {
    if (upcomingBookings.length > 0) {
      const nextDate = upcomingBookings[0].startDate || todayStr;
      setSelectedDateStr(nextDate);
      const parsed = parseLocalDate(nextDate);
      setCurrentDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  };

  // Status badge style helper
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          icon: <Clock className="w-3 h-3 text-amber-600 animate-pulse" />,
          label: 'Pending Approval'
        };
      case 'Confirmed':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
          label: 'Confirmed'
        };
      case 'Declined':
        return {
          bg: 'bg-rose-100 text-rose-900 border-rose-300',
          dot: 'bg-rose-500',
          icon: <XCircle className="w-3 h-3 text-rose-600" />,
          label: 'Declined'
        };
      case 'Completed':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          dot: 'bg-blue-500',
          icon: <Check className="w-3 h-3 text-blue-600" />,
          label: 'Completed'
        };
      case 'Cancelled':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          icon: <AlertCircle className="w-3 h-3 text-slate-500" />,
          label: 'Cancelled'
        };
    }
  };

  // Actions
  const handleConfirm = (b: Booking) => {
    onUpdateBookingStatus(b.id, 'Confirmed');
  };

  const handleOpenDeclineModal = (b: Booking) => {
    setDecliningBooking(b);
    setDeclineReasonInput('');
  };

  const handleConfirmDecline = () => {
    if (!decliningBooking) return;
    onUpdateBookingStatus(
      decliningBooking.id, 
      'Declined', 
      declineReasonInput.trim() || 'Unavailable on selected dates'
    );
    setDecliningBooking(null);
  };

  const handleCancelBooking = (b: Booking) => {
    setCancellingBooking(b);
  };

  const handleConfirmCancel = () => {
    if (!cancellingBooking) return;
    onUpdateBookingStatus(cancellingBooking.id, 'Cancelled');
    setCancellingBooking(null);
  };

  const handleCompleteBooking = (b: Booking) => {
    onUpdateBookingStatus(b.id, 'Completed');
  };

  // Counts for filters
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      sahyogi: bookings.filter(b => b.type === 'sahyogi').length,
      machinery: bookings.filter(b => b.type === 'machinery').length,
      pending: bookings.filter(b => b.status === 'Pending').length,
      confirmed: bookings.filter(b => b.status === 'Confirmed').length,
      declined: bookings.filter(b => b.status === 'Declined').length,
      completed: bookings.filter(b => b.status === 'Completed').length,
      cancelled: bookings.filter(b => b.status === 'Cancelled').length,
      upcoming: bookings.filter(b => (b.endDate || b.startDate) >= todayStr && b.status !== 'Cancelled').length
    };
  }, [bookings, todayStr]);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. UPCOMING OVERVIEW STRIP: Quick Metric Cards for Labor & Machinery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Labor Bookings Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-4 rounded-2xl border border-emerald-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Upcoming Labor
            </span>
            <p className="text-2xl font-black">
              <AnimatedCounter value={upcomingLaborCount} /> <span className="text-xs font-normal text-emerald-200">Bookings</span>
            </p>
            <p className="text-[10px] text-emerald-300/80">Sahyogi Agri-Workers</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-800/80 flex items-center justify-center text-emerald-200">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Machinery Bookings Card */}
        <div className="bg-gradient-to-br from-amber-950 to-amber-900 text-white p-4 rounded-2xl border border-amber-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Tractor className="w-3.5 h-3.5" /> Upcoming Machinery
            </span>
            <p className="text-2xl font-black">
              <AnimatedCounter value={upcomingMachineryCount} /> <span className="text-xs font-normal text-amber-200">Rentals</span>
            </p>
            <p className="text-[10px] text-amber-300/80">Tractors, Harvesters & Tools</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-800/80 flex items-center justify-center text-amber-200">
            <Tractor className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Action Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Action
            </span>
            <p className="text-2xl font-black text-slate-900">
              <AnimatedCounter value={counts.pending} /> <span className="text-xs font-semibold text-slate-500">Requests</span>
            </p>
            <p className="text-[10px] text-amber-700 font-bold">Requires confirmation</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Next Jump Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-700" /> Next Schedule
            </span>
            {upcomingBookings.length > 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>

          {upcomingBookings.length > 0 ? (
            <div>
              <p className="text-xs font-extrabold text-slate-900 truncate">
                {upcomingBookings[0].itemName}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-slate-400" />
                <span>Starts {upcomingBookings[0].startDate}</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">No upcoming bookings</p>
          )}

          <button
            type="button"
            onClick={jumpToNextBooking}
            disabled={upcomingBookings.length === 0}
            className="w-full py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Jump to Next</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. TOP HEADER & VIEW MODE CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shadow-inner">
            <CalendarDays className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>Labor & Machinery Booking Calendar</span>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                Monthly Grid
              </span>
            </h3>
            <p className="text-xs text-slate-500">Visualize labor commitments and equipment rental schedules seamlessly</p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Month Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" /> List View ({filteredBookings.length})
          </button>
        </div>
      </div>

      {/* 3. MULTI-LEVEL FILTER CONTROLS BAR */}
      <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* CATEGORY / TYPE TABS: All vs Labor vs Machinery */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({counts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setTypeFilter('sahyogi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                typeFilter === 'sahyogi'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-500" />
              <span>Labor / Sahyogi ({counts.sahyogi})</span>
            </button>

            <button
              type="button"
              onClick={() => setTypeFilter('machinery')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                typeFilter === 'machinery'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Tractor className="w-3.5 h-3.5 text-amber-500" />
              <span>Machinery ({counts.machinery})</span>
            </button>
          </div>

          {/* Quick Upcoming Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyUpcoming(!onlyUpcoming)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                onlyUpcoming
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-extrabold shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upcoming Only ({counts.upcoming})</span>
            </button>

            {/* Role toggle (Farmer/Renter vs Provider/Owner) */}
            {currentUser && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    roleFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('renter')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    roleFilter === 'renter' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  As Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('owner')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    roleFilter === 'owner' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  On My Listings
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar pt-1 border-t border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {(['All', 'Pending', 'Confirmed', 'Completed', 'Declined', 'Cancelled'] as const).map((st) => {
            const count = st === 'All' ? counts.all : counts[st.toLowerCase() as keyof typeof counts];
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <span>{st}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  statusFilter === st ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN CALENDAR GRID VS LIST VIEW */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Monthly Grid (7 cols on Desktop) */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* Month Header Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <span>{monthNames[month]}</span>
                  <span className="text-emerald-700">{year}</span>
                </h4>
                <button
                  onClick={goToToday}
                  className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  aria-label="Previous Month"
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  aria-label="Next Month"
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center border-b pb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const hasPending = cell.bookings.some(b => b.status === 'Pending');
                const hasConfirmed = cell.bookings.some(b => b.status === 'Confirmed');
                const hasDeclined = cell.bookings.some(b => b.status === 'Declined');

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[64px] sm:min-h-[74px] p-1 sm:p-1.5 rounded-xl flex flex-col justify-between text-left transition-all border cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/40 shadow-xs'
                        : cell.isCurrentMonth
                        ? 'border-slate-200/90 bg-white hover:bg-slate-50'
                        : 'border-transparent bg-slate-50/40 text-slate-300'
                    }`}
                  >
                    {/* Top Row: Day Number & Total Day Count */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs ${
                        cell.isToday
                          ? 'bg-emerald-700 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-800 font-bold'
                          : 'text-slate-300 font-medium'
                      }`}>
                        {cell.dayNum}
                      </span>

                      {cell.bookings.length > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-900 text-white">
                          {cell.bookings.length}
                        </span>
                      )}
                    </div>

                    {/* Middle: Visual Labor vs Machinery Chips */}
                    {cell.bookings.length > 0 && (
                      <div className="space-y-0.5 my-1 w-full overflow-hidden">
                        {cell.laborCount > 0 && (
                          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[9px] font-black truncate border border-emerald-200" title={`${cell.laborCount} Labor Booking(s)`}>
                            <User className="w-2.5 h-2.5 flex-shrink-0 text-emerald-700" />
                            <span className="truncate">{cell.laborCount} Labor</span>
                          </div>
                        )}
                        {cell.machineryCount > 0 && (
                          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-black truncate border border-amber-200" title={`${cell.machineryCount} Machinery Booking(s)`}>
                            <Tractor className="w-2.5 h-2.5 flex-shrink-0 text-amber-700" />
                            <span className="truncate">{cell.machineryCount} Machine</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Status Dot Markers */}
                    {cell.bookings.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-white" title="Pending" />}
                        {hasConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" title="Confirmed" />}
                        {hasDeclined && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-white" title="Declined" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <User className="w-3 h-3 text-emerald-600" /> Sahyogi Labor
                </span>
                <span className="flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Tractor className="w-3 h-3 text-amber-600" /> Machinery / Tractor
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Done
                </span>
              </div>
            </div>
          </div>

          {/* Agenda for Selected Date (5 cols on Desktop) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Selected Date Agenda</span>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-emerald-600" />
                    <span>
                      {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </h4>
                </div>
                <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-2.5 py-1 rounded-full border border-emerald-200">
                  {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>

              {selectedDateBookings.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 opacity-60" />
                  <p className="text-xs font-bold text-slate-600">No bookings scheduled on this date.</p>
                  <p className="text-[11px] text-slate-400">Click on any date cell marked with labor or machinery badges to inspect details.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {selectedDateBookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      currentUser={currentUser}
                      getStatusBadge={getStatusBadge}
                      onConfirm={() => handleConfirm(b)}
                      onOpenDecline={() => handleOpenDeclineModal(b)}
                      onCancel={() => handleCancelBooking(b)}
                      onComplete={() => handleCompleteBooking(b)}
                      onSelect={() => onSelectBooking?.(b)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List Mode: All Filtered Bookings */
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs space-y-3">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-extrabold text-slate-800 text-sm">No bookings found matching current filters.</p>
              <p className="text-slate-500">Try resetting status or category filters to view all scheduled bookings.</p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setTypeFilter('all');
                  setOnlyUpcoming(false);
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  currentUser={currentUser}
                  getStatusBadge={getStatusBadge}
                  onConfirm={() => handleConfirm(b)}
                  onOpenDecline={() => handleOpenDeclineModal(b)}
                  onCancel={() => handleCancelBooking(b)}
                  onComplete={() => handleCompleteBooking(b)}
                  onSelect={() => onSelectBooking?.(b)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Decline Reason Modal */}
      {decliningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-modalPop"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5" />
                <h4 className="font-black text-slate-900 text-sm">Decline Booking Request</h4>
              </div>
              <button
                onClick={() => setDecliningBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                You are declining the booking for <strong className="text-slate-900">{decliningBooking.itemName}</strong> by <strong className="text-slate-900">{decliningBooking.renterName}</strong>.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for declining (Optional)</label>
                <textarea
                  rows={3}
                  value={declineReasonInput}
                  onChange={(e) => setDeclineReasonInput(e.target.value)}
                  placeholder="e.g., Equipment under maintenance, unavailable on date..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecliningBooking(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-modalPop"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5" />
                <h4 className="font-black text-slate-900 text-sm">Cancel Booking Confirmation</h4>
              </div>
              <button
                onClick={() => setCancellingBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Are you sure you want to cancel booking <strong className="text-slate-900">#{cancellingBooking.id.slice(-6)}</strong> for <strong className="text-emerald-800">{cancellingBooking.itemName}</strong>?
              </p>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1">
                <p><strong>Scheduled Dates:</strong> {cancellingBooking.startDate} {cancellingBooking.endDate ? `to ${cancellingBooking.endDate}` : ''}</p>
                <p><strong>Total Amount:</strong> ₹{cancellingBooking.totalAmount || cancellingBooking.totalCost || 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for individual booking card
interface BookingCardProps {
  booking: Booking;
  currentUser: UserType | null;
  getStatusBadge: (status: BookingStatus) => { bg: string; dot: string; icon: React.ReactNode; label: string };
  onConfirm: () => void;
  onOpenDecline: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onSelect?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  currentUser,
  getStatusBadge,
  onConfirm,
  onOpenDecline,
  onCancel,
  onComplete,
  onSelect
}) => {
  const badge = getStatusBadge(booking.status);
  const isOwner = currentUser?.id && booking.ownerId === currentUser.id;
  const isRenter = currentUser?.id && booking.renterId === currentUser.id;

  return (
    <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200 hover:border-emerald-300 transition-all space-y-3 shadow-2xs">
      {/* Header with Type & Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
            booking.type === 'sahyogi' 
              ? 'bg-emerald-100 text-emerald-900 border-emerald-200' 
              : 'bg-amber-100 text-amber-900 border-amber-200'
          }`}>
            {booking.type === 'sahyogi' ? <User className="w-3 h-3 text-emerald-700" /> : <Tractor className="w-3 h-3 text-amber-700" />}
            <span>{booking.type === 'sahyogi' ? 'Sahyogi Labor' : 'Machinery'}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">#{booking.id.slice(-5)}</span>
        </div>

        <div className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Item info & Thumbnail */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {booking.itemImage ? (
            <img 
              src={booking.itemImage} 
              alt={booking.itemName} 
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600">
              {booking.type === 'sahyogi' ? <User className="w-5 h-5" /> : <Tractor className="w-5 h-5" />}
            </div>
          )}
          <div>
            <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">{booking.itemName}</h5>
            <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
              <CalendarIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="font-semibold">{booking.startDate} {booking.endDate && booking.endDate !== booking.startDate ? `→ ${booking.endDate}` : ''}</span>
              {booking.quantity && <span className="text-slate-500 font-bold">({booking.quantity} {booking.unit || 'days'})</span>}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
          <span className="text-xs sm:text-sm font-black text-emerald-800">
            ₹<AnimatedCounter value={booking.totalAmount || booking.totalCost || 0} />
          </span>
        </div>
      </div>

      {/* Renter & Owner metadata */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1.5 text-slate-600">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <User className="w-3 h-3 text-emerald-600" />
            <span>Farmer: <strong className="text-slate-800">{booking.renterName}</strong></span>
          </span>
          {booking.renterPhone && (
            <a href={`tel:${booking.renterPhone}`} className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
              <Phone className="w-2.5 h-2.5" /> {booking.renterPhone}
            </a>
          )}
        </div>

        {booking.ownerName && (
          <div className="flex items-center justify-between text-slate-500">
            <span>Provider: <strong className="text-slate-700">{booking.ownerName}</strong></span>
            {booking.ownerPhone && (
              <a href={`tel:${booking.ownerPhone}`} className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
                <Phone className="w-2.5 h-2.5" /> {booking.ownerPhone}
              </a>
            )}
          </div>
        )}

        {booking.location && (
          <p className="flex items-center gap-1 text-slate-500 truncate">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{booking.location}</span>
          </p>
        )}

        {booking.notes && (
          <p className="italic text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-[10px]">
            "{booking.notes}"
          </p>
        )}

        {booking.status === 'Declined' && booking.declineReason && (
          <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-800 font-medium text-[10px]">
            <strong>Decline Note:</strong> {booking.declineReason}
          </div>
        )}
      </div>

      {/* Action Buttons for Confirm / Decline / Cancel / Complete */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
        {/* Owner / Provider Actions */}
        {isOwner && booking.status === 'Pending' && (
          <>
            <button
              onClick={onOpenDecline}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-xl flex items-center gap-1 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" /> Decline
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-3 h-3" /> Confirm Booking
            </button>
          </>
        )}

        {/* Both Owner & Renter can mark as completed once confirmed */}
        {(isOwner || isRenter) && booking.status === 'Confirmed' && (
          <button
            onClick={onComplete}
            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[11px] rounded-xl flex items-center gap-1 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3" /> Mark Completed
          </button>
        )}

        {/* Renter can cancel if still pending or confirmed */}
        {isRenter && (booking.status === 'Pending' || booking.status === 'Confirmed') && (
          <button
            onClick={onCancel}
            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-[11px] rounded-xl transition-all cursor-pointer"
          >
            Cancel Booking
          </button>
        )}
      </div>
    </div>
  );
};
