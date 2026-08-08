import React, { useState } from 'react';
import { User, Sahyogi, Machinery, LedgerEntry, Booking } from '../types';
import { 
  Users, 
  Tractor, 
  PlusCircle, 
  Calculator, 
  User as UserIcon,
  ArrowRight, 
  Sparkles,
  Share2,
  Check,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { InboxModal } from './InboxModal';
import { SeedCalculatorModal } from './SeedCalculatorModal';
import { LedgerModal } from './LedgerModal';
import { KrishakaryaLogo } from './KrishakaryaLogo';

interface HomePageProps {
  currentUser: User | null;
  sahyogis: Sahyogi[];
  machineries: Machinery[];
  ledgerEntries?: LedgerEntry[];
  myBookings?: Booking[];
  onNavigate: (tab: 'home' | 'sahyogi' | 'machinery' | 'profile') => void;
  onOpenAddListing: () => void;
  onAddToLedger?: (entry: any) => void;
  onAddLedgerEntry?: (entry: LedgerEntry) => void;
  onDeleteLedgerEntry?: (id: string) => void;
  onSyncBookingsToLedger?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  sahyogis = [],
  machineries = [],
  ledgerEntries = [],
  myBookings = [],
  onNavigate,
  onOpenAddListing,
  onAddToLedger,
  onAddLedgerEntry,
  onDeleteLedgerEntry,
  onSyncBookingsToLedger,
}) => {
  const { t } = useLanguage();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Quick Tool Modals State
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  const handleShareApp = async () => {
    const shareData = {
      title: 'Krishakarya - Smart Agricultural Marketplace',
      text: 'Hire skilled Sahyogi farm labor workers & rent agricultural machinery near your village on Krishakarya!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      } catch (e) {
        alert(`Copy link to share: ${window.location.href}`);
      }
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-amber-950 text-white px-4 py-3.5 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-emerald-800/50">
        <div className="relative z-10 flex items-center gap-3">
          <KrishakaryaLogo size={44} />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-['Outfit',sans-serif] font-black text-2xl tracking-tight leading-none text-emerald-400">
                Krishakarya
              </span>
            </div>
            <p className="text-emerald-100/90 text-xs leading-tight max-w-xl">
              {t('heroSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
          <button
            onClick={() => onNavigate('sahyogi')}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1 min-h-[32px]"
          >
            <Users className="w-3.5 h-3.5" /> {t('hireSahyogi')}
          </button>

          <button
            onClick={() => onNavigate('machinery')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1 min-h-[32px]"
          >
            <Tractor className="w-3.5 h-3.5 text-amber-400" /> {t('rentMachinery')}
          </button>

          <button
            onClick={() => setIsInboxOpen(true)}
            className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs border border-emerald-400/30 backdrop-blur-sm transition-all flex items-center gap-1 min-h-[32px] shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-300" /> Inbox
          </button>
        </div>
      </div>

      {/* Quick Tools Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Quick Tools
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Instant access to agricultural utilities and quick booking tools
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Tool 1: Find Sahyogi */}
          <button
            onClick={() => onNavigate('sahyogi')}
            className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex items-start gap-3"
          >
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl group-hover:scale-105 transition-transform flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {t('hireSahyogi')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Search verified labor workers for harvesting & sowing.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                Browse {sahyogis.length} Sahyogis <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Tool 2: Rent Machinery */}
          <button
            onClick={() => onNavigate('machinery')}
            className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-500 transition-all text-left flex items-start gap-3"
          >
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-xl group-hover:scale-105 transition-transform flex-shrink-0">
              <Tractor className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                {t('rentMachinery')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Rent tractors, harvesters, spray drones & pumps.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 pt-0.5">
                Browse {machineries.length} Machines <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Tool 3: List Service / Machinery */}
          <button
            onClick={onOpenAddListing}
            className="group bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex items-start gap-3"
          >
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl group-hover:scale-105 transition-transform flex-shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors">
                {t('addListing')}
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Register labor profile or list machinery for income.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 pt-0.5">
                Publish Listing <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Tool 4: Kisan Bahi Khata (Digital Ledger) */}
          <button
            onClick={() => setIsLedgerOpen(true)}
            className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex items-start gap-3"
          >
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl group-hover:scale-105 transition-transform flex-shrink-0">
              <BookOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  Kisan Bahi Khata
                </h3>
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded-md uppercase">
                  Ledger
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Record farm income, labor costs, seed purchases & sync bookings.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                Manage Ledger ({ledgerEntries.length} Records) <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Tool 5: Land Acreage & Seed Calculator */}
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="group bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex items-start gap-3"
          >
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl group-hover:scale-105 transition-transform flex-shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors">
                Acre & Seed Calculator
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Convert Bigha/Katha to Acres, seed rates & fertilizer schedules.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 pt-0.5">
                Open Calculator <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Tool 6: User Profile & Details */}
          <button
            onClick={() => onNavigate('profile')}
            className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex items-start gap-3"
          >
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl group-hover:scale-105 transition-transform flex-shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {t('editProfile')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                View & update post, district, pincode & farm details.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                Open Profile <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Featured Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Sahyogis Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" /> {t('featuredSahyogis')}
            </h3>
            <button
              onClick={() => onNavigate('sahyogi')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              View All ({sahyogis.length})
            </button>
          </div>

          <div className="space-y-3">
            {sahyogis.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No Sahyogi labor workers registered yet.</p>
                <button
                  onClick={onOpenAddListing}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-xl text-[11px] shadow-xs"
                >
                  Register as Sahyogi
                </button>
              </div>
            ) : (
              sahyogis.slice(0, 2).map((s) => (
                <div key={s.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{s.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {s.village}, {s.district} • Rate: ₹{s.dailyRate}{t('perDay')}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('sahyogi')}
                    className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                  >
                    {t('bookNow')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Machinery Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Tractor className="w-5 h-5 text-amber-600 dark:text-amber-400" /> {t('featuredMachinery')}
            </h3>
            <button
              onClick={() => onNavigate('machinery')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              View All ({machineries.length})
            </button>
          </div>

          <div className="space-y-3">
            {machineries.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No machinery listed for rent yet.</p>
                <button
                  onClick={onOpenAddListing}
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-xl text-[11px] shadow-xs"
                >
                  List Machinery
                </button>
              </div>
            ) : (
              machineries.slice(0, 2).map((m) => (
                <div key={m.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold flex-shrink-0">
                    <Tractor className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{m.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {m.category} • Rent: ₹{m.ratePerDay}{t('perDay')}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('machinery')}
                    className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg text-[11px]"
                  >
                    Rent
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Seed & Acre Calculator Modal */}
      <SeedCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onAddToLedger={onAddToLedger}
      />

      {/* Kisan Bahi Khata Quick Ledger Modal */}
      <LedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        currentUser={currentUser}
        ledgerEntries={ledgerEntries}
        myBookings={myBookings}
        onAddLedgerEntry={onAddLedgerEntry}
        onDeleteLedgerEntry={onDeleteLedgerEntry}
        onSyncBookingsToLedger={onSyncBookingsToLedger}
      />

      {/* Message Inbox Modal */}
      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

