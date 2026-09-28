import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings } from '../types';
import { isNotificationPermissionGranted } from '../lib/notificationService';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  landUnit: 'bigha_up',
  currencyFormat: 'inr_lakhs',

  pushNotifications: false,
  soundEffects: true,
  bookingAlerts: true,
  weatherAlerts: true,
  aiAdvisoryAlerts: true,

  tempUnit: 'celsius',
  windSpeedUnit: 'kmh',
  weatherRefreshInterval: '30m',
  locationMode: 'auto_gps',

  autoSpeakAiResponse: false,
  speechRate: 1.0,
  cropDiagnosticDetail: 'standard',

  fontSize: 'normal',
  highContrast: false,
  reducedMotion: false,

  dataSaverMode: false,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  clearLocalCache: () => { clearedEntries: number };
  exportAppData: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('krishakarya_app_settings');
      if (saved) {
        return {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(saved),
          language: localStorage.getItem('krishakarya_language') || DEFAULT_SETTINGS.language,
          pushNotifications: isNotificationPermissionGranted(),
        };
      }
    } catch (e) {
      console.warn('Failed to parse app settings from localStorage:', e);
    }
    return {
      ...DEFAULT_SETTINGS,
      language: (typeof window !== 'undefined' && localStorage.getItem('krishakarya_language')) || DEFAULT_SETTINGS.language,
      pushNotifications: typeof window !== 'undefined' ? isNotificationPermissionGranted() : false,
    };
  });

  // Persist settings changes
  useEffect(() => {
    try {
      localStorage.setItem('krishakarya_app_settings', JSON.stringify(settings));
      localStorage.setItem('krishakarya_sound_effects', String(settings.soundEffects));
      localStorage.setItem('krishakarya_temp_unit', settings.tempUnit);
      localStorage.setItem('krishakarya_land_unit', settings.landUnit);
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }

    // Apply Accessibility classes to html root
    const root = document.documentElement;

    // Font size
    root.classList.remove('font-size-large', 'font-size-extralarge');
    if (settings.fontSize === 'large') {
      root.classList.add('font-size-large');
    } else if (settings.fontSize === 'extralarge') {
      root.classList.add('font-size-extralarge');
    }

    // High Contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    // Reduced Motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  // Listen for language changes from LanguageContext
  useEffect(() => {
    const handleLangSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: string }>;
      if (customEvent.detail?.language) {
        setSettings((prev) => {
          if (prev.language === customEvent.detail.language) return prev;
          return { ...prev, language: customEvent.detail.language };
        });
      }
    };
    window.addEventListener('krishakarya_language_changed', handleLangSync);
    return () => window.removeEventListener('krishakarya_language_changed', handleLangSync);
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      // If language changed, sync with LanguageContext key
      if (updates.language && updates.language !== prev.language) {
        localStorage.setItem('krishakarya_language', updates.language);
        window.dispatchEvent(new CustomEvent('krishakarya_language_changed', { detail: { language: updates.language } }));
      }
      return next;
    });
  };

  const resetSettings = () => {
    const fresh: AppSettings = {
      ...DEFAULT_SETTINGS,
      language: localStorage.getItem('krishakarya_language') || 'en',
      pushNotifications: isNotificationPermissionGranted(),
    };
    setSettings(fresh);
    try {
      localStorage.setItem('krishakarya_app_settings', JSON.stringify(fresh));
      localStorage.setItem('krishakarya_sound_effects', 'true');
    } catch (e) {}
  };

  const clearLocalCache = () => {
    let clearedCount = 0;
    const cacheKeys = [
      'krishakarya_weather_cache',
      'krishakarya_weather_loc',
      'krishakarya_ai_history',
      'krishakarya_recent_searches',
    ];

    cacheKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    return { clearedEntries: clearedCount };
  };

  const exportAppData = () => {
    try {
      const exportObject = {
        exportedAt: new Date().toISOString(),
        app: 'Krishakarya',
        version: '2.4.0',
        user: localStorage.getItem('krishakarya_user') ? JSON.parse(localStorage.getItem('krishakarya_user')!) : null,
        bookings: localStorage.getItem('krishakarya_bookings') ? JSON.parse(localStorage.getItem('krishakarya_bookings')!) : [],
        ledger: localStorage.getItem('krishakarya_ledger') ? JSON.parse(localStorage.getItem('krishakarya_ledger')!) : [],
        settings,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `krishakarya_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isSettingsOpen,
        setIsSettingsOpen,
        clearLocalCache,
        exportAppData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
