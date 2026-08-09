import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Home, 
  Users, 
  Tractor, 
  User as UserIcon, 
  LogOut,
  Globe,
  ChevronDown,
  MessageSquare,
  Share2,
  Check,
  Download
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { InboxModal } from './InboxModal';
import { KrishakaryaLogo } from './KrishakaryaLogo';

interface HeaderProps {
  activeTab: 'home' | 'sahyogi' | 'machinery' | 'profile' | 'terms';
  setActiveTab: (tab: 'home' | 'sahyogi' | 'machinery' | 'profile' | 'terms') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenAddListing: () => void;
  onLogout: () => void;
  bookingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenAddListing,
  onLogout,
  bookingCount,
}) => {
  const { currentLanguage, setLanguage, languages, t, getLanguageInfo } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPwaPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    } else {
      alert('To install Krishakarya App:\n\n1. Open Chrome menu (3 dots) or Share menu\n2. Tap "Install App" or "Add to Home screen"\n3. Enjoy offline-ready access!');
    }
  };

  const selectedLang = getLanguageInfo(currentLanguage);

  const handleShareWebsite = async () => {
    const shareData = {
      title: 'Krishakarya - Smart Agricultural Marketplace',
      text: 'Hire skilled Sahyogi farm labor workers & rent agricultural machinery near your village on Krishakarya!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled or failed:', err);
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
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 space-y-2">
          {/* Top Row: Left Utilities | Top Center Krishakarya Heading | Right Controls */}
          <div className="flex items-center justify-between gap-2">
            {/* Left Utility Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Install App Button */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  title="Install Krishakarya App"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-[11px] sm:text-xs font-black shadow-xs border border-emerald-500/30 transition-all min-h-[36px] shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span>Install App</span>
                </button>
              )}

              {/* Share Website Button */}
              <button
                onClick={handleShareWebsite}
                title="Share Krishakarya Website"
                className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-[11px] sm:text-xs font-extrabold border border-emerald-200 transition-all min-h-[36px] shrink-0 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>
            </div>

            {/* TOP CENTER: Krishakarya Heading & Logo */}
            <div className="flex-1 flex justify-center text-center px-1 min-w-0">
              <button
                onClick={() => {
                  setActiveTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="focus:outline-none inline-flex items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer group py-0.5 min-w-0"
                title="Krishakarya Home"
              >
                <KrishakaryaLogo size={32} />
                <span className="font-['Outfit',sans-serif] font-black text-xl xs:text-2xl sm:text-3xl tracking-tight leading-none text-emerald-800 dark:text-emerald-400 group-hover:text-emerald-600 transition-colors truncate">
                  Krishakarya
                </span>
              </button>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Indian Languages Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] sm:text-xs font-bold border border-slate-200/80 transition-all min-h-[36px] cursor-pointer"
                  title="Select Indian Language / भाषा चुनें"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">{selectedLang.nativeName}</span>
                  <span className="sm:hidden font-extrabold uppercase text-[10px]">{selectedLang.code}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isLangOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsLangOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 sm:w-64 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-80 overflow-y-auto space-y-1">
                      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                        <span>Indian Languages</span>
                        <span>14 Available</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1 pt-1">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code);
                              setIsLangOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                              currentLanguage === lang.code
                                ? 'bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-500/30'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <div>
                                <span className="block font-bold">{lang.nativeName}</span>
                                <span className="text-[10px] text-slate-400">{lang.name}</span>
                              </div>
                            </div>
                            {currentLanguage === lang.code && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sign In / Sign Up Button (when logged out) */}
              {!currentUser && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs shadow-xs border border-emerald-500/30 transition-all min-h-[36px] shrink-0 cursor-pointer"
                  title="Sign In / Register"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="text-[11px] sm:text-xs font-bold">{t('signIn')}</span>
                </button>
              )}

              {/* User Profile & Sign Out Buttons (rendered when user is logged in) */}
              {currentUser && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-1.5 p-1 sm:p-1.5 pl-2 sm:pl-2.5 pr-2 rounded-xl border text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {currentUser.profileImage && currentUser.profileImage.trim().length > 0 ? (
                      <img
                        src={currentUser.profileImage}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ring-1 ring-emerald-500"
                      />
                    ) : (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-extrabold text-[10px] sm:text-[11px]">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="max-w-[70px] sm:max-w-[110px] truncate hidden xs:inline text-[11px] sm:text-xs">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    {bookingCount > 0 && (
                      <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                        {bookingCount}
                      </span>
                    )}
                  </button>

                  {/* Sign Out Button - Placed in position of listing button */}
                  <button
                    onClick={onLogout}
                    title={t('signOut')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold rounded-xl text-xs border border-red-200/80 transition-all min-h-[36px] shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span className="hidden sm:inline text-[11px] sm:text-xs">{t('signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Centered Navigation Tabs Placed BELOW Krishakarya Heading */}
          <div className="flex justify-center w-full pt-1">
            <nav className="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 bg-slate-100/80 p-1 rounded-2xl max-w-full overflow-x-auto no-scrollbar smooth-scroll touch-pan-x">
              <button
                onClick={() => {
                  setActiveTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap ${
                  activeTab === 'home'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-800 hover:bg-slate-200/60'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('navHome')}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sahyogi');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap ${
                  activeTab === 'sahyogi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-800 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t('navSahyogi')}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('machinery');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap ${
                  activeTab === 'machinery'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-800 hover:bg-slate-200/60'
                }`}
              >
                <Tractor className="w-4 h-4" />
                <span>{t('navMachinery')}</span>
              </button>

              <button
                onClick={() => setIsInboxOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap text-slate-700 hover:text-emerald-800 hover:bg-slate-200/60"
                title="Message Inbox"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Inbox</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-800 hover:bg-slate-200/60'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('navProfile')}</span>
                {bookingCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                    {bookingCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Message Inbox Modal */}
      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        currentUser={currentUser}
      />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-2xl px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all min-h-[48px] ${
              activeTab === 'home'
                ? 'bg-emerald-50 text-emerald-800 font-black'
                : 'text-slate-600 font-semibold hover:bg-slate-50'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{t('navHome')}</span>
          </button>

          <button
            onClick={() => setActiveTab('sahyogi')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all min-h-[48px] ${
              activeTab === 'sahyogi'
                ? 'bg-emerald-50 text-emerald-800 font-black'
                : 'text-slate-600 font-semibold hover:bg-slate-50'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'sahyogi' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{t('navSahyogi')}</span>
          </button>

          <button
            onClick={() => setActiveTab('machinery')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all min-h-[48px] ${
              activeTab === 'machinery'
                ? 'bg-emerald-50 text-emerald-800 font-black'
                : 'text-slate-600 font-semibold hover:bg-slate-50'
            }`}
          >
            <Tractor className={`w-5 h-5 ${activeTab === 'machinery' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{t('navMachinery')}</span>
          </button>

          {/* Inbox Option Right of Rent Machinery */}
          <button
            onClick={() => setIsInboxOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl transition-all min-h-[48px] text-slate-600 font-semibold hover:bg-slate-50 relative"
          >
            <MessageSquare className="w-5 h-5 text-emerald-700" />
            <span className="text-[10px] tracking-tight mt-0.5">Inbox</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all min-h-[48px] relative ${
              activeTab === 'profile'
                ? 'bg-emerald-50 text-emerald-800 font-black'
                : 'text-slate-600 font-semibold hover:bg-slate-50'
            }`}
          >
            <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{t('navProfile')}</span>
            {bookingCount > 0 && (
              <span className="absolute top-1 right-3 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {bookingCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};



