import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { GeoLocationResult, getDeviceLocation, getIpLocation } from '../lib/locationService';
import { MandiRateResponse } from '../types';

interface LocationContextType {
  location: GeoLocationResult | null;
  isDetectingLocation: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  detectedDistrict: string;
  detectedState: string;
  detectedVillage: string;
  mandiRates: MandiRateResponse | null;
  isLoadingMandi: boolean;
  mandiError: string | null;
  detectLocationAutomatically: (forceFresh?: boolean) => Promise<GeoLocationResult | null>;
  fetchMandiRatesAutomatically: (district?: string, state?: string) => Promise<MandiRateResponse | null>;
  setCustomMandiLocation: (district: string, state: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<GeoLocationResult | null>(() => {
    try {
      const saved = localStorage.getItem('krishakarya_last_geo');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  
  const [detectedDistrict, setDetectedDistrict] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('krishakarya_auto_district');
      if (saved) return saved;
      const savedGeo = localStorage.getItem('krishakarya_last_geo');
      if (savedGeo) {
        const parsed = JSON.parse(savedGeo);
        if (parsed.district) return parsed.district;
      }
    } catch (e) {}
    return 'Varanasi';
  });

  const [detectedState, setDetectedState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('krishakarya_auto_state');
      if (saved) return saved;
      const savedGeo = localStorage.getItem('krishakarya_last_geo');
      if (savedGeo) {
        const parsed = JSON.parse(savedGeo);
        if (parsed.state) return parsed.state;
      }
    } catch (e) {}
    return 'Uttar Pradesh';
  });

  const [detectedVillage, setDetectedVillage] = useState<string>(() => {
    try {
      const savedGeo = localStorage.getItem('krishakarya_last_geo');
      if (savedGeo) {
        const parsed = JSON.parse(savedGeo);
        if (parsed.village) return parsed.village;
      }
    } catch (e) {}
    return 'Local Area';
  });

  const [mandiRates, setMandiRates] = useState<MandiRateResponse | null>(() => {
    try {
      const saved = localStorage.getItem('krishakarya_cached_mandi_rates');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [isLoadingMandi, setIsLoadingMandi] = useState<boolean>(false);
  const [mandiError, setMandiError] = useState<string | null>(null);

  const hasAutoRequestedRef = useRef(false);

  // Fetch Mandi Rates automatically for target district and state
  const fetchMandiRatesAutomatically = useCallback(async (district?: string, state?: string): Promise<MandiRateResponse | null> => {
    const targetDistrict = district || detectedDistrict || 'Varanasi';
    const targetState = state || detectedState || 'Uttar Pradesh';

    setIsLoadingMandi(true);
    setMandiError(null);

    try {
      const res = await fetch(`/api/mandi-rates?district=${encodeURIComponent(targetDistrict)}&state=${encodeURIComponent(targetState)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch Mandi rates (HTTP ${res.status})`);
      }
      const data: MandiRateResponse = await res.json();
      setMandiRates(data);
      try {
        localStorage.setItem('krishakarya_cached_mandi_rates', JSON.stringify(data));
      } catch (e) {}
      return data;
    } catch (err: any) {
      console.warn('Mandi rates auto-fetch note:', err?.message || err);
      setMandiError('Live APMC connection momentarily slow, showing benchmark rates.');
      return null;
    } finally {
      setIsLoadingMandi(false);
    }
  }, [detectedDistrict, detectedState]);

  // Automatic Location Detection Function
  const detectLocationAutomatically = useCallback(async (forceFresh: boolean = false): Promise<GeoLocationResult | null> => {
    setIsDetectingLocation(true);

    try {
      // Check permission state if supported
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setPermissionStatus(perm.state as any);
          perm.onchange = () => {
            setPermissionStatus(perm.state as any);
          };
        } catch (e) {}
      }

      // Automatically trigger device GPS request
      const geo = await getDeviceLocation({ forceFresh });
      if (geo) {
        setLocation(geo);
        setPermissionStatus(geo.source === 'gps' ? 'granted' : 'unknown');

        if (geo.district) {
          setDetectedDistrict(geo.district);
          localStorage.setItem('krishakarya_auto_district', geo.district);
        }
        if (geo.state) {
          setDetectedState(geo.state);
          localStorage.setItem('krishakarya_auto_state', geo.state);
        }
        if (geo.village) {
          setDetectedVillage(geo.village);
        }

        // Save into farm location preference for weather sync
        try {
          localStorage.setItem(
            'krishakarya_saved_farm_location',
            JSON.stringify({
              village: geo.village || 'Farm Field',
              district: geo.district || 'District',
              state: geo.state || 'State',
              latitude: geo.latitude,
              longitude: geo.longitude,
            })
          );
        } catch (e) {}

        // Automatically fetch live Mandi rates for this detected district & state
        fetchMandiRatesAutomatically(geo.district, geo.state);
        return geo;
      }
    } catch (err) {
      console.warn('Auto location detection error:', err);
    } finally {
      setIsDetectingLocation(false);
    }

    return null;
  }, [fetchMandiRatesAutomatically]);

  // Set custom location manually if user selects different district
  const setCustomMandiLocation = useCallback((district: string, state: string) => {
    setDetectedDistrict(district);
    setDetectedState(state);
    localStorage.setItem('krishakarya_auto_district', district);
    localStorage.setItem('krishakarya_auto_state', state);
    fetchMandiRatesAutomatically(district, state);
  }, [fetchMandiRatesAutomatically]);

  // TRIGGER ON APP STARTUP: Completely automatic execution on mount
  useEffect(() => {
    if (hasAutoRequestedRef.current) return;
    hasAutoRequestedRef.current = true;

    // 1. Immediately request browser location permission & resolve GPS/IP coordinates
    detectLocationAutomatically(true);

    // 2. Fetch initial Mandi rates immediately so rates are ready without delay
    fetchMandiRatesAutomatically();
  }, [detectLocationAutomatically, fetchMandiRatesAutomatically]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isDetectingLocation,
        permissionStatus,
        detectedDistrict,
        detectedState,
        detectedVillage,
        mandiRates,
        isLoadingMandi,
        mandiError,
        detectLocationAutomatically,
        fetchMandiRatesAutomatically,
        setCustomMandiLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useAutoLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useAutoLocation must be used within a LocationProvider');
  }
  return context;
};
