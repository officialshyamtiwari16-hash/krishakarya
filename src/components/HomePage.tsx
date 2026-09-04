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
  BookOpen,
  Bot,
  Camera,
  Leaf
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { InboxModal } from './InboxModal';
import { SeedCalculatorModal } from './SeedCalculatorModal';
import { LedgerModal } from './LedgerModal';
import { KrishakaryaLogo } from './KrishakaryaLogo';
import { AnimatedCounter } from './AnimatedCounter';
import { LocalWeatherWidget } from './LocalWeatherWidget';

interface HomePageProps {
  currentUser: User | null;
  sahyogis: Sahyogi[];
  machineries: Machinery[];
  ledgerEntries?: LedgerEntry[];
  myBookings?: Booking[];
  onNavigate: (tab: 'home' | 'sahyogi' | 'machinery' | 'profile' | 'modern-farming' | 'crop-health') => void;
  onOpenAddListing: () => void;
  onOpenInboxWithPrompt?: (prompt?: string) => void;
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
  onOpenInboxWithPrompt,
  onAddToLedger,
  onAddLedgerEntry,
  onDeleteLedgerEntry,
  onSyncBookingsToLedger,
}) => {
  const { t } = useLanguage();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [presetPrompt, setPresetPrompt] = useState<string | null>(null);

  const handleOpenAiInbox = (promptText?: string) => {
    if (onOpenInboxWithPrompt) {
      onOpenInboxWithPrompt(promptText);
    } else {
      if (promptText) setPresetPrompt(promptText);
      setIsInboxOpen(true);
    }
  };

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
        console.warn('Clipboard copy failed:', e);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Master Hero Block with Clean High-Performance Frosted Glass */}
      <div
        className="relative rounded-3xl overflow-hidden glass-dark-card border border-white/20 shadow-2xl min-h-[420px] animate-fadeIn"
      >
        {/* Ambient Glow Accents Behind Glass */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Card Content Container */}
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 text-white">
          
          {/* Top Welcome Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/15 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_32px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-3">
              <KrishakaryaLogo size={46} />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-['Outfit',sans-serif] font-black text-2xl sm:text-3xl tracking-tight leading-none bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                    Krishakarya
                  </span>
                </div>
                <p className="text-emerald-100/90 text-xs sm:text-sm leading-tight max-w-xl">
                  {t('heroSubtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => onNavigate('crop-health')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5 min-h-[38px] btn-futuristic pulse-glow-cta cursor-pointer ring-2 ring-emerald-400/40"
              >
                <Camera className="w-4 h-4 text-slate-950 icon-micro-rotate" />
                <span>Crop Health AI</span>
              </button>

              <button
                onClick={() => onNavigate('sahyogi')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 min-h-[38px] btn-futuristic cursor-pointer"
              >
                <Users className="w-4 h-4 icon-micro-rotate" /> {t('hireSahyogi')}
              </button>

              <button
                onClick={() => onNavigate('machinery')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 min-h-[38px] btn-futuristic cursor-pointer shadow-xs"
              >
                <Tractor className="w-4 h-4 text-amber-400 icon-micro-rotate" /> {t('rentMachinery')}
              </button>
            </div>
          </div>

          {/* Live Local Farm Weather Forecast & Activity Planning Widget (Positioned above Krishak A.I Inbox) */}
          <div className="w-full">
            <LocalWeatherWidget
              currentUser={currentUser}
              onAskAiWithPrompt={handleOpenAiInbox}
            />
          </div>

          {/* Compact & Good-Looking Krishak A.I Inbox Banner (Down in the line) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950/80 via-emerald-950/75 to-slate-900/80 border border-emerald-400/40 hover:border-emerald-300/60 backdrop-blur-2xl p-3.5 sm:p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_12px_36px_rgba(0,0,0,0.35)] transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              
              {/* Left: Compact Bot Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md border border-emerald-300/40">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 animate-pulse" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping opacity-75"></span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full"></span>
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 tracking-tight">
                      Krishak A.I Inbox <span className="text-emerald-400 text-xs font-semibold">(कृषक ए.आई)</span>
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black rounded-full uppercase tracking-wider backdrop-blur-xs">
                      24/7 Agro Advisory
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-0.5 truncate">
                    Ask pest diagnosis, fertilizer dose, seed rates, rental benchmarks & govt schemes.
                  </p>
                </div>
              </div>

              {/* Right: Quick Action Chips & Open Button */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { label: '🌾 Wheat Dosage', prompt: 'गेहूँ में नैनो यूरिया और डीएपी की सही खुराक व छिड़काव समय बताएं।' },
                    { label: '🐛 Pest Control', prompt: 'फसल में पत्ती लपेटक कीट और पीलापन का तुरंत उपचार बताएं।' },
                    { label: '🚜 Machinery Rates', prompt: 'ट्रैक्टर और कंबाइन हार्वेस्टर का प्रति एकड़ सही किराया क्या है?' },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOpenAiInbox(chip.prompt)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-emerald-500/25 text-emerald-200 hover:text-white border border-white/15 rounded-lg text-[11px] font-semibold backdrop-blur-md transition-all whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleOpenAiInbox()}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4 fill-slate-950/20" />
                  <span>Open Krishak A.I Inbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tools Header & Cards Layer */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Quick Tools
                </h2>
                <p className="text-[11px] text-emerald-100/70 mt-0.5 font-medium">
                  Instant access to agricultural utilities and quick booking tools
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Tool 0: AI Crop Health Assistant & Photo Diagnostic */}
              <button
                onClick={() => onNavigate('crop-health')}
                className="group p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer bg-gradient-to-br from-slate-950/80 via-emerald-950/70 to-slate-900/80 hover:from-slate-950/90 hover:to-emerald-950/85 backdrop-blur-2xl border border-emerald-400/50 hover:border-emerald-300 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_28px_rgba(0,0,0,0.3)] hover:-translate-y-1.5"
              >
                <div className="p-2.5 bg-emerald-500/25 text-emerald-200 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 shadow-xs border border-emerald-400/40 backdrop-blur-md">
                  <Camera className="w-5 h-5 text-emerald-300 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-emerald-300 text-xs sm:text-sm group-hover:text-emerald-200 transition-colors">
                      Crop Health Assistant
                    </h3>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded-md uppercase shadow-xs">
                      New AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Take/upload crop photo for instant AI disease diagnosis & dosages.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 pt-0.5">
                    Scan Crop Health <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* Tool 1: Find Sahyogi */}
              <button
                onClick={() => onNavigate('sahyogi')}
                className="group p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-2xl border border-white/15 hover:border-emerald-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 shadow-xs border border-emerald-500/30 backdrop-blur-md">
                  <Users className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                    {t('hireSahyogi')}
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Search verified labor workers for harvesting & sowing.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 pt-0.5">
                    Browse <AnimatedCounter value={sahyogis.length} /> Sahyogis <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* Tool 2: Rent Machinery */}
              <button
                onClick={() => onNavigate('machinery')}
                className="group p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-2xl border border-white/15 hover:border-amber-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 shadow-xs border border-amber-500/30 backdrop-blur-md">
                  <Tractor className="w-5 h-5 text-amber-300" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-amber-300 transition-colors">
                    {t('rentMachinery')}
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Rent tractors, harvesters, spray drones & pumps.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 pt-0.5">
                    Browse <AnimatedCounter value={machineries.length} /> Machines <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* Tool 3: List Service / Machinery */}
              <button
                onClick={onOpenAddListing}
                className="group p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-2xl border border-white/15 hover:border-emerald-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 shadow-xs border border-emerald-500/30 backdrop-blur-md">
                  <PlusCircle className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                    {t('addListing')}
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Register labor profile or list machinery for income.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 pt-0.5">
                    Publish Listing <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* Tool 4: Kisan Bahi Khata (Digital Ledger) */}
              <button
                onClick={() => setIsLedgerOpen(true)}
                className="group p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-2xl border border-white/15 hover:border-emerald-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 shadow-xs border border-emerald-500/30 backdrop-blur-md">
                  <BookOpen className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                      Kisan Bahi Khata
                    </h3>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded-md uppercase shadow-xs">
                      Ledger
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Record farm income, labor costs, seed purchases & sync bookings.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 pt-0.5">
                    Manage Ledger (<AnimatedCounter value={ledgerEntries.length} /> Records) <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* Tool 5: Land Acreage & Seed Calculator */}
              <button
                onClick={() => setIsCalculatorOpen(true)}
                className="group p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-2xl border border-white/15 hover:border-emerald-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 shadow-xs border border-emerald-500/30 backdrop-blur-md">
                  <Calculator className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                    Acre & Seed Calculator
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Convert Bigha/Katha to Acres, seed rates & fertilizer schedules.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 pt-0.5">
                    Open Calculator <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* Tool 6: Krishak A.I & Modern Farming */}
              <button
                onClick={() => onNavigate('modern-farming')}
                className="group p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer bg-gradient-to-br from-slate-950/80 via-emerald-950/70 to-slate-900/80 hover:from-slate-950/90 hover:to-emerald-950/85 backdrop-blur-2xl border border-amber-400/40 hover:border-amber-400 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-1.5"
              >
                <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 shadow-xs border border-amber-400/40 backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-amber-300 text-xs sm:text-sm group-hover:text-amber-200 transition-colors">
                      Modern Farming & AI
                    </h3>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded-md uppercase shadow-xs">
                      AI 24/7
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Instant AI pest diagnosis, crop questions & fertilizer dosage.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 pt-0.5">
                    Open Modern Farming Q&A <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* Tool 7: User Profile & Details */}
              <button
                onClick={() => onNavigate('profile')}
                className="group p-4 rounded-2xl text-left flex items-start gap-3.5 cursor-pointer bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-2xl border border-white/15 hover:border-emerald-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="p-2.5 bg-slate-800/80 text-slate-200 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 shadow-xs border border-slate-700 backdrop-blur-md">
                  <UserIcon className="w-5 h-5 text-slate-300" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                    {t('editProfile')}
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    View & update post, district, pincode & farm details.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 pt-0.5">
                    Open Profile <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Featured Overview Section */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn"
      >
        {/* Available Sahyogis Card */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700 icon-micro-rotate" /> {t('featuredSahyogis')}
            </h3>
            <button
              onClick={() => onNavigate('sahyogi')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
            >
              View All (<AnimatedCounter value={sahyogis.length} />)
            </button>
          </div>

          <div className="space-y-3">
            {sahyogis.length === 0 ? (
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">No Sahyogi labor workers registered yet.</p>
                <button
                  onClick={onOpenAddListing}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px] shadow-xs cursor-pointer btn-futuristic"
                >
                  Register as Sahyogi
                </button>
              </div>
            ) : (
              sahyogis.slice(0, 2).map((s) => (
                <div key={s.id} className="p-3.5 glass-card rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                    <Users className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate">{s.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {s.village}, {s.district} • Rate: ₹<AnimatedCounter value={s.dailyRate} />{t('perDay')}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('sahyogi')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px] cursor-pointer transition-all btn-futuristic"
                  >
                    {t('bookNow')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Machinery Card */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Tractor className="w-5 h-5 text-amber-600 icon-micro-rotate" /> {t('featuredMachinery')}
            </h3>
            <button
              onClick={() => onNavigate('machinery')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer transition-colors"
            >
              View All (<AnimatedCounter value={machineries.length} />)
            </button>
          </div>

          <div className="space-y-3">
            {machineries.length === 0 ? (
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">No machinery listed for rent yet.</p>
                <button
                  onClick={onOpenAddListing}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] shadow-xs cursor-pointer btn-futuristic"
                >
                  List Machinery
                </button>
              </div>
            ) : (
              machineries.slice(0, 2).map((m) => (
                <div key={m.id} className="p-3.5 glass-card rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                    <Tractor className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate">{m.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {m.category} • Rent: ₹<AnimatedCounter value={m.ratePerDay} />{t('perDay')}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('machinery')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] cursor-pointer transition-all btn-futuristic"
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
        onClose={() => {
          setIsInboxOpen(false);
          setPresetPrompt(null);
        }}
        currentUser={currentUser}
        presetPrompt={presetPrompt}
      />
    </div>
  );
};

