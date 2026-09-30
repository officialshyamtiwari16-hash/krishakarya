import React, { useState } from 'react';
import { User } from '../types';
import { 
  Home, 
  Users, 
  Tractor, 
  User as UserIcon, 
  LogOut, 
  MessageSquare, 
  Share2, 
  Check, 
  Bell,
  Sparkles,
  Camera,
  Settings,
  ShoppingBag
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { InboxModal } from './InboxModal';
import { NotificationModal } from './NotificationModal';
import { KrishakaryaLogo } from './KrishakaryaLogo';

interface HeaderProps {
  activeTab: 'home' | 'sahyogi' | 'machinery' | 'marketplace' | 'profile' | 'terms' | 'modern-farming' | 'crop-health';
  setActiveTab: (tab: 'home' | 'sahyogi' | 'machinery' | 'marketplace' | 'profile' | 'terms' | 'modern-farming' | 'crop-health') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenAddListing: () => void;
  onOpenInbox?: () => void;
  onOpenSettings?: () => void;
  onLogout: () => void;
  bookingCount: number;
}


export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenAddListing,
  onOpenInbox,
  onOpenSettings,
  onLogout,
  bookingCount,
}) => {
  const { t } = useLanguage();
  const { setIsSettingsOpen } = useSettings();
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  const handleOpenSettingsModal = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setIsSettingsOpen(true);
    }
  };
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleTriggerInbox = () => {
    if (onOpenInbox) {
      onOpenInbox();
    } else {
      setIsInboxOpen(true);
    }
  };

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
        console.warn('Clipboard write failed:', e);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-2xl border-b border-white/80 shadow-[0_4px_24px_-2px_rgba(4,120,87,0.07),inset_0_1px_1px_rgba(255,255,255,0.95)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 space-y-2">
          {/* Top Row: Left Utilities | Top Center Krishakarya Heading | Right Controls */}
          <div className="flex items-center justify-between gap-2">
            {/* Left Utility Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Share Website Button */}
              <button
                onClick={handleShareWebsite}
                title="Share Krishakarya Website"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/70 hover:bg-emerald-50/90 text-emerald-950 rounded-xl text-[11px] sm:text-xs font-extrabold border border-white/90 hover:border-emerald-300/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all min-h-[36px] shrink-0 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline font-black text-emerald-700">{t('copied')}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">{t('share')}</span>
                  </>
                )}
              </button>

              {/* Notification Alerts Center Button */}
              <button
                onClick={() => setIsNotifOpen(true)}
                title={t('notifications')}
                aria-label={t('notifications')}
                className="relative flex items-center justify-center p-2 bg-white/70 hover:bg-emerald-50/90 text-slate-800 hover:text-emerald-900 rounded-xl border border-white/90 hover:border-emerald-300/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all min-h-[36px] min-w-[36px] shrink-0 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-emerald-700" />
              </button>

              {/* Mobile Direct Inbox Button */}
              <button
                onClick={handleTriggerInbox}
                title={t('navInbox')}
                aria-label={t('navInbox')}
                className="md:hidden relative flex items-center justify-center p-2 bg-white/70 hover:bg-emerald-50/90 text-slate-800 hover:text-emerald-900 rounded-xl border border-white/90 hover:border-emerald-300/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all min-h-[36px] min-w-[36px] shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
              </button>

              {/* App Settings Button (Always Visible) */}
              <button
                onClick={handleOpenSettingsModal}
                title={t('appSettings')}
                aria-label={t('appSettings')}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-white/70 hover:bg-emerald-50/90 text-emerald-950 rounded-xl text-[11px] sm:text-xs font-extrabold border border-white/90 hover:border-emerald-300/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all min-h-[36px] shrink-0 cursor-pointer group"
              >
                <Settings className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-700 group-hover:rotate-45 transition-transform duration-300" />
                <span className="hidden sm:inline font-bold text-slate-800 group-hover:text-emerald-900">{t('navSettings')}</span>
              </button>
            </div>

            {/* TOP CENTER: Krishakarya Heading & Logo */}
            <div className="flex-1 flex justify-center text-center px-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    setActiveTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="focus:outline-none inline-flex items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer group py-0.5 min-w-0"
                  title="Krishakarya Home"
                >
                  <KrishakaryaLogo size={32} />
                  <span className="font-['Outfit',sans-serif] font-black text-xl xs:text-2xl sm:text-3xl tracking-tight leading-none gradient-heading group-hover:scale-105 transition-transform truncate">
                    Krishakarya
                  </span>
                </button>
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Sign In / Sign Up Button (when logged out) */}
              {!currentUser && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-[0_4px_14px_rgba(4,120,87,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-emerald-400/30 transition-all min-h-[36px] shrink-0 cursor-pointer btn-futuristic"
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
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white/70 border-white/90 text-slate-800 hover:bg-white/95 shadow-xs'
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

                  {/* Sign Out Button */}
                  <button
                    onClick={onLogout}
                    title={t('signOut')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50/80 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl text-xs border border-rose-200/80 shadow-xs backdrop-blur-md transition-all min-h-[36px] shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline text-[11px] sm:text-xs">{t('signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Centered Navigation Tabs Placed BELOW Krishakarya Heading */}
          <div className="flex justify-center w-full pt-1">
            <nav className="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 bg-white/60 backdrop-blur-xl border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_4px_16px_rgba(4,120,87,0.06)] p-1 rounded-2xl max-w-full overflow-x-auto no-scrollbar smooth-scroll touch-pan-x">
              <button
                onClick={() => {
                  setActiveTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-[0_4px_12px_rgba(4,120,87,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-white/70'
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
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'sahyogi'
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-[0_4px_12px_rgba(4,120,87,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-white/70'
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
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'machinery'
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-[0_4px_12px_rgba(4,120,87,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-white/70'
                }`}
              >
                <Tractor className="w-4 h-4" />
                <span>{t('navMachinery')}</span>
              </button>

              {/* Krishi Marketplace Tab */}
              <button
                onClick={() => {
                  setActiveTab('marketplace');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'marketplace'
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-[0_4px_12px_rgba(4,120,87,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-white/70'
                }`}
                title="Krishi Bazaar - Buy & Sell Crops, Vegetables, Fish, Eggs & Live Mandi Rates"
              >
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>{t('navMarketplace')}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('crop-health');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'crop-health'
                    ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-amber-300 shadow-[0_4px_14px_rgba(13,148,136,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-amber-400/40'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-white/70'
                }`}
                title="Crop Health Assistant - Photo & Camera AI Diagnosis"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>{t('navCropHealth')}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('modern-farming');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap cursor-pointer ${
                  activeTab === 'modern-farming'
                    ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-300 shadow-[0_4px_14px_rgba(13,148,136,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-amber-400/40'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-white/70'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>{t('navModernFarming')}</span>
              </button>

              <button
                onClick={handleTriggerInbox}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap text-slate-700 hover:text-emerald-900 hover:bg-white/70 cursor-pointer"
                title={t('krishakAiTitle')}
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>{t('navInbox')}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all min-h-[36px] whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-[0_4px_12px_rgba(4,120,87,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-white/70'
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

      {/* Message Inbox Modal (Fallback if not mounted at root) */}
      {!onOpenInbox && (
        <InboxModal
          isOpen={isInboxOpen}
          onClose={() => setIsInboxOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
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

          {/* Marketplace / Krishi Bazaar Option */}
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all min-h-[48px] ${
              activeTab === 'marketplace'
                ? 'bg-emerald-50 text-emerald-800 font-black'
                : 'text-slate-600 font-semibold hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className={`w-5 h-5 ${activeTab === 'marketplace' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{t('navMarketplace')}</span>
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



