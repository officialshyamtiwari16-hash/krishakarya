import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Bell, 
  Volume2, 
  VolumeX, 
  CloudSun, 
  Bot, 
  Eye, 
  Database, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Download, 
  Trash2, 
  ShieldCheck, 
  HelpCircle, 
  X, 
  Radio, 
  MapPin, 
  Sliders, 
  Sun, 
  Zap, 
  FileText, 
  ChevronRight,
  Maximize2,
  Smartphone,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  playNotificationChime, 
  requestBrowserNotificationPermission, 
  sendBrowserNotification,
  isNotificationPermissionGranted 
} from '../lib/notificationService';
import { User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onOpenTerms?: () => void;
  onOpenProfile?: () => void;
}

type SettingCategory = 
  | 'general' 
  | 'notifications' 
  | 'weather' 
  | 'ai' 
  | 'display' 
  | 'storage' 
  | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenTerms,
  onOpenProfile,
}) => {
  const { settings, updateSettings, resetSettings, clearLocalCache, exportAppData } = useSettings();
  const { currentLanguage, setLanguage, languages, t } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<SettingCategory>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleTogglePush = async () => {
    if (!settings.pushNotifications) {
      setIsRequestingPermission(true);
      const granted = await requestBrowserNotificationPermission();
      setIsRequestingPermission(false);
      if (granted) {
        updateSettings({ pushNotifications: true });
        showToast('Push Notifications enabled successfully! ✅');
      } else {
        updateSettings({ pushNotifications: false });
        showToast('Notification permission was blocked or denied in browser.');
      }
    } else {
      updateSettings({ pushNotifications: false });
      showToast('Push notifications turned off.');
    }
  };

  const handleTestSound = () => {
    if (!settings.soundEffects) {
      showToast('Sound effects are currently muted in settings.');
      return;
    }
    playNotificationChime('success');
    showToast('Played test agricultural notification chime 🔔');
  };

  const handleTestNotification = () => {
    playNotificationChime('success');
    sendBrowserNotification('Krishakarya Test Alert 🌾', {
      body: 'Your notification system is working perfectly for crop & booking updates!',
      soundType: 'success',
    });
    showToast('Sent test notification to your device!');
  };

  const handleTestSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('राम राम किसान भाई! कृषाकार्य ए.आई आपकी सेवा में हाज़िर है।');
      utterance.rate = settings.speechRate || 1.0;
      utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
      showToast(`Speaking test phrase at ${settings.speechRate}x speed 🗣️`);
    } else {
      showToast('Speech synthesis not supported in this browser.');
    }
  };

  const handleClearCache = () => {
    const res = clearLocalCache();
    showToast(`Cleared ${res.clearedEntries} temporary cache items successfully! 🧹`);
  };

  const handleExportData = () => {
    exportAppData();
    showToast('Downloaded application backup JSON file! 📥');
  };

  const handleReset = () => {
    if (window.confirm('Reset all Krishakarya settings back to initial defaults?')) {
      resetSettings();
      showToast('All app settings restored to default values.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl glass-modal rounded-3xl shadow-2xl border border-white/60 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-white/10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="settings-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                  App Settings & Preferences
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Krishakarya v2.4
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/80">
                Customize language, land units, alerts, voice, display, and rural connectivity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            title="Close Settings"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification Banner inside Modal */}
        {toastMessage && (
          <div className="bg-emerald-700 text-white text-xs font-bold px-4 py-2 flex items-center justify-between animate-fadeIn shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Body Layout: Left Category Navigation + Right Content Area */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden bg-slate-50/70">
          {/* Left Category Tabs (Horizontal Scroll on Mobile, Vertical on Tablet/Desktop) */}
          <div className="w-full md:w-64 bg-white/80 border-b md:border-b-0 md:border-r border-slate-200/80 p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0">
            <button
              onClick={() => setActiveCategory('general')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCategory === 'general'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-4 h-4" />
              <div className="flex-1">
                <div>Language & Region</div>
                <div className={`text-[10px] font-normal ${activeCategory === 'general' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  14 Indian Languages, Units
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveCategory('notifications')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCategory === 'notifications'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              <div className="flex-1">
                <div>Notifications & Audio</div>
                <div className={`text-[10px] font-normal ${activeCategory === 'notifications' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Chimes, Push Alerts
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveCategory('weather')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCategory === 'weather'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CloudSun className="w-4 h-4" />
              <div className="flex-1">
                <div>Weather & Climate</div>
                <div className={`text-[10px] font-normal ${activeCategory === 'weather' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Units (°C/°F), Auto-GPS
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveCategory('ai')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCategory === 'ai'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              <div className="flex-1">
                <div>Krishak A.I & Speech</div>
                <div className={`text-[10px] font-normal ${activeCategory === 'ai' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Voice Speed, Diagnosis
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveCategory('display')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCategory === 'display'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-4 h-4" />
              <div className="flex-1">
                <div>Display & Sunlight</div>
                <div className={`text-[10px] font-normal ${activeCategory === 'display' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Large Fonts, High Contrast
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveCategory('storage')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCategory === 'storage'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <div className="flex-1">
                <div>Data & Offline</div>
                <div className={`text-[10px] font-normal ${activeCategory === 'storage' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Data Saver, Backup Export
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveCategory('about')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCategory === 'about'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <div className="flex-1">
                <div>About & Security</div>
                <div className={`text-[10px] font-normal ${activeCategory === 'about' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Account, Support, Terms
                </div>
              </div>
            </button>
          </div>

          {/* Right Category Detail Panel */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            
            {/* 1. LANGUAGE & REGION */}
            {activeCategory === 'general' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" /> App Language / भाषा
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your preferred Indian regional language for all farming menus and notifications.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        updateSettings({ language: lang.code });
                        showToast(`Switched language to ${lang.name} (${lang.nativeName})`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        currentLanguage === lang.code
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{lang.flag}</span>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{lang.nativeName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{lang.name}</div>
                        </div>
                      </div>
                      {currentLanguage === lang.code && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Regional Land Measurement Unit */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Regional Land Measurement Unit (भूमि माप इकाई)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Standardizes crop calculation, seed calculator, and machinery rental acreages for your region.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'bigha_up', name: 'UP / Haryana Bigha', desc: '1 Bigha = 0.625 Acre' },
                      { id: 'bigha_bihar', name: 'Bihar Bigha', desc: '1 Bigha = 0.62 Acre' },
                      { id: 'bigha_bengal', name: 'Bengal Bigha', desc: '1 Bigha = 0.33 Acre' },
                      { id: 'acre', name: 'Standard Acre', desc: '1 Acre = 43,560 sq ft' },
                      { id: 'hectare', name: 'Hectare (हेक्टेयर)', desc: '1 Hectare = 2.47 Acres' },
                      { id: 'guntha', name: 'Guntha (गुंठा)', desc: 'Maharashtra & South' },
                      { id: 'biswa', name: 'Biswa (बिस्वा)', desc: '1/20 of Bigha' },
                      { id: 'kanal', name: 'Kanal / Marla', desc: 'Punjab & HP' },
                    ].map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => {
                          updateSettings({ landUnit: unit.id as any });
                          showToast(`Set default land unit to ${unit.name}`);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.landUnit === unit.id
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-black shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{unit.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{unit.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Display Format */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Currency & Number Formatting</h4>
                    <p className="text-xs text-slate-500">Display amounts in Indian Lakhs/Crores (₹ 1,50,000) or Standard.</p>
                  </div>
                  <select
                    value={settings.currencyFormat}
                    onChange={(e) => updateSettings({ currencyFormat: e.target.value as any })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="inr_lakhs">Indian (₹ 1,50,000 Lakhs)</option>
                    <option value="standard">Standard (₹ 150,000)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 2. NOTIFICATIONS & AUDIO */}
            {activeCategory === 'notifications' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600" /> Notifications & Sound Alerts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stay informed in the field when farmers request bookings or when weather warnings arise.
                  </p>
                </div>

                {/* Push Notifications Toggle */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">Browser & Mobile Push Notifications</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isNotificationPermissionGranted()
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isNotificationPermissionGranted() ? 'Permission Granted' : 'Requires Permission'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Receive instant alerts even when the browser tab is minimized or in your pocket.
                    </p>
                  </div>

                  <button
                    onClick={handleTogglePush}
                    disabled={isRequestingPermission}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      settings.pushNotifications ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle push notifications"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Audio Sound Effects */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">Audio Chimes & Sound Effects</span>
                      {settings.soundEffects ? (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Pleasant acoustic chime when bookings are accepted, messages arrive, or buttons are tapped.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const next = !settings.soundEffects;
                      updateSettings({ soundEffects: next });
                      if (next) playNotificationChime('success');
                      showToast(next ? 'Sound effects enabled 🔔' : 'Sound effects muted 🔕');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      settings.soundEffects ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle sound effects"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sub-toggles: Booking alerts, Weather alerts, AI tips */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Alert Categories</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Booking Status</div>
                        <div className="text-[10px] text-slate-400">Accepted / Declined alerts</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.bookingAlerts}
                        onChange={(e) => updateSettings({ bookingAlerts: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Weather Warnings</div>
                        <div className="text-[10px] text-slate-400">Rain & Frost alerts</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.weatherAlerts}
                        onChange={(e) => updateSettings({ weatherAlerts: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Krishak A.I Tips</div>
                        <div className="text-[10px] text-slate-400">Crop season reminders</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.aiAdvisoryAlerts}
                        onChange={(e) => updateSettings({ aiAdvisoryAlerts: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Action Buttons */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleTestSound}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Test Chime Sound
                  </button>
                  <button
                    onClick={handleTestNotification}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-emerald-600" /> Send Test Notification
                  </button>
                </div>
              </div>
            )}

            {/* 3. WEATHER & CLIMATE */}
            {activeCategory === 'weather' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-emerald-600" /> Weather & Meteorology Settings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure agricultural climate telemetry, temperature units, and location sensitivity.
                  </p>
                </div>

                {/* Temperature Unit */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Temperature Scale</h4>
                    <p className="text-xs text-slate-500">Select Celsius or Fahrenheit for live field temperature display.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => updateSettings({ tempUnit: 'celsius' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settings.tempUnit === 'celsius'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      °C Celsius
                    </button>
                    <button
                      onClick={() => updateSettings({ tempUnit: 'fahrenheit' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settings.tempUnit === 'fahrenheit'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      °F Fahrenheit
                    </button>
                  </div>
                </div>

                {/* Wind Speed Unit */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Wind Speed Unit</h4>
                    <p className="text-xs text-slate-500">Crucial for drone spraying and insecticide wind drift decisions.</p>
                  </div>
                  <select
                    value={settings.windSpeedUnit}
                    onChange={(e) => updateSettings({ windSpeedUnit: e.target.value as any })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kmh">km/h (Kilometers / hour)</option>
                    <option value="ms">m/s (Meters / second)</option>
                    <option value="mph">mph (Miles / hour)</option>
                  </select>
                </div>

                {/* Location Detection Mode */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Location Source Mode</h4>
                    <p className="text-xs text-slate-500">
                      Auto-detect live GPS satellite position or lock to saved Village/District from Profile.
                    </p>
                  </div>
                  <select
                    value={settings.locationMode}
                    onChange={(e) => updateSettings({ locationMode: e.target.value as any })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="auto_gps">🛰️ Auto GPS & Pin (Recommended)</option>
                    <option value="saved_profile">🏡 Saved Village / Profile Location</option>
                  </select>
                </div>

                {/* Refresh Interval */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Auto-Update Weather Frequency</h4>
                    <p className="text-xs text-slate-500">How frequently forecast data refreshes in the background.</p>
                  </div>
                  <select
                    value={settings.weatherRefreshInterval}
                    onChange={(e) => updateSettings({ weatherRefreshInterval: e.target.value as any })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="15m">Every 15 Minutes</option>
                    <option value="30m">Every 30 Minutes (Balanced)</option>
                    <option value="1h">Every 1 Hour (Data Saving)</option>
                    <option value="manual">Manual Refresh Only</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. KRISHAK A.I & VOICE */}
            {activeCategory === 'ai' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-600" /> Krishak A.I & Voice Assistant
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure agricultural intelligence, voice speeds, and leaf disease scanner precision.
                  </p>
                </div>

                {/* Auto-Speak AI Responses */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-900">Auto-Speak AI Farming Answers</span>
                    <p className="text-xs text-slate-500">
                      Automatically speaks responses aloud when you ask farming questions—convenient while working outdoors.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const next = !settings.autoSpeakAiResponse;
                      updateSettings({ autoSpeakAiResponse: next });
                      showToast(next ? 'Auto-speak enabled 🗣️' : 'Auto-speak disabled');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      settings.autoSpeakAiResponse ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle auto speak"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoSpeakAiResponse ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Speech Rate Slider / Options */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Voice Playback Speed</h4>
                      <p className="text-xs text-slate-500">Adjust the speaking pace for clearer comprehension in your dialect.</p>
                    </div>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {settings.speechRate}x Speed
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[
                      { rate: 0.8, label: '0.8x (Slow / स्पष्ट)' },
                      { rate: 1.0, label: '1.0x (Normal / सामान्य)' },
                      { rate: 1.2, label: '1.2x (Fast / त्वरित)' },
                    ].map((item) => (
                      <button
                        key={item.rate}
                        onClick={() => {
                          updateSettings({ speechRate: item.rate });
                          showToast(`Set speech speed to ${item.rate}x`);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          settings.speechRate === item.rate
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleTestSpeech}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Test Voice Audio
                    </button>
                  </div>
                </div>

                {/* Crop Health Diagnostic Detail */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Crop Health AI Scanner Mode</h4>
                    <p className="text-xs text-slate-500">
                      Choose Standard (fast analysis) or High Detail (includes comprehensive organic & chemical formulations).
                    </p>
                  </div>
                  <select
                    value={settings.cropDiagnosticDetail}
                    onChange={(e) => updateSettings({ cropDiagnosticDetail: e.target.value as any })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="standard">Standard (Fast Scan)</option>
                    <option value="high">High Detail & Dosage (Deep)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 5. DISPLAY & SUNLIGHT */}
            {activeCategory === 'display' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" /> Display & Outdoor Sunlight Accessibility
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Optimized for harsh glare in open agricultural fields and comfortable reading for all age groups.
                  </p>
                </div>

                {/* Font Size Scaling */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Text Size / अक्षरों का आकार</h4>
                    <p className="text-xs text-slate-500">Enlarge text across the entire interface for easy field reading without glasses.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'normal', label: 'Normal (100%)', desc: 'Standard compact' },
                      { id: 'large', label: 'Large (110%)', desc: 'Comfortable' },
                      { id: 'extralarge', label: 'Extra Large (120%)', desc: 'Maximum clarity' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          updateSettings({ fontSize: f.id as any });
                          showToast(`Font size set to ${f.label}`);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          settings.fontSize === f.id
                            ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{f.label}</div>
                        <div className={`text-[10px] mt-0.5 ${settings.fontSize === f.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {f.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Contrast Sunlight Mode */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">High Contrast Sunlight Mode</span>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Boosts contrast and card borders for high readability in direct bright outdoor sunlight.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const next = !settings.highContrast;
                      updateSettings({ highContrast: next });
                      showToast(next ? 'High Contrast Mode enabled ☀️' : 'High Contrast Mode disabled');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      settings.highContrast ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle high contrast"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Reduced Motion & Battery Saver */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-900">Reduce Motion & Save Battery</span>
                    <p className="text-xs text-slate-500">
                      Disables background mesh and pulse effects to preserve battery on low-cost farm smartphones.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const next = !settings.reducedMotion;
                      updateSettings({ reducedMotion: next });
                      showToast(next ? 'Animations minimized' : 'Animations restored');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      settings.reducedMotion ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle reduced motion"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* 6. DATA & OFFLINE STORAGE */}
            {activeCategory === 'storage' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" /> Rural Data & Storage Management
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage offline sync, data saver for weak 2G/3G network towers, and backup export.
                  </p>
                </div>

                {/* Rural Data Saver */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">Rural Data Saver Mode (2G / 3G)</span>
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Minimizes network payloads and caches imagery so the app works reliably in remote field zones.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const next = !settings.dataSaverMode;
                      updateSettings({ dataSaverMode: next });
                      showToast(next ? 'Data Saver active ⚡' : 'Data Saver off');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      settings.dataSaverMode ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle data saver"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.dataSaverMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Cache Management */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Local Offline Cache</h4>
                    <p className="text-xs text-slate-500">
                      Clears expired weather responses and temporary diagnostics without affecting your account.
                    </p>
                  </div>

                  <button
                    onClick={handleClearCache}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-600" /> Clear Local Cache
                  </button>
                </div>

                {/* Backup / Export App Data */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Export & Backup Khatabook & Bookings</h4>
                    <p className="text-xs text-slate-500">
                      Download a safe offline JSON backup file containing your bahi-khata ledger entries, bookings, and profile.
                    </p>
                  </div>

                  <button
                    onClick={handleExportData}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs border border-emerald-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" /> Download Backup (.json)
                  </button>
                </div>

                {/* Factory Reset Settings */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-950">Reset All Settings to Default</h4>
                    <p className="text-xs text-rose-700">
                      Restores all audio, weather, land units, and display options back to initial state.
                    </p>
                  </div>

                  <button
                    onClick={handleReset}
                    className="px-3.5 py-2 bg-white hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Reset Settings
                  </button>
                </div>
              </div>
            )}

            {/* 7. ABOUT & SECURITY */}
            {activeCategory === 'about' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" /> About Krishakarya & Security
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Platform identity, security certifications, and official farmer helpline details.
                  </p>
                </div>

                {/* Current Account Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Logged-in Account
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                      {currentUser ? 'Active Farmer Profile' : 'Guest Mode'}
                    </span>
                  </div>

                  {currentUser ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center font-black text-lg text-white ring-2 ring-emerald-400">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold truncate">{currentUser.name}</div>
                        <div className="text-xs text-emerald-200/80 truncate">
                          {currentUser.phone || currentUser.email || 'No phone set'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {currentUser.village ? `${currentUser.village}, ${currentUser.district}` : 'Village profile not set'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-300">
                      You are currently browsing as a guest. Sign in to save bookings, publish machinery, and manage Khatabook.
                    </div>
                  )}

                  {currentUser && onOpenProfile && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenProfile();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Manage Full Profile & Security <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Helpline & Support */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Official Agricultural Support Helpline
                  </h4>
                  <p className="text-xs text-slate-500">
                    Need help booking a tractor or reporting a Sahyogi service? Our community team is available.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                    <a
                      href="mailto:krishakarya@gmail.com"
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      Email: krishakarya@gmail.com
                    </a>
                  </div>
                </div>

                {/* Legal & Terms Link */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Terms of Service & Privacy Policy</h4>
                    <p className="text-xs text-slate-500">Fair pricing guidelines, safety rules, and privacy commitments.</p>
                  </div>
                  {onOpenTerms && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenTerms();
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Terms
                    </button>
                  )}
                </div>

                {/* Software Specifications */}
                <div className="text-center pt-2 text-[11px] text-slate-400 space-y-1">
                  <p>Krishakarya Agricultural Smart Ecosystem • Release v2.4.0-prod</p>
                  <p>Encrypted Cloud Storage & Local Offline Fallback Architecture</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-white/90 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Settings are automatically applied and saved in your device.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Done / सहेजें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
