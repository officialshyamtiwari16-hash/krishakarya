import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudSun, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  CloudFog, 
  CloudDrizzle, 
  Wind, 
  Droplets, 
  Compass, 
  RefreshCw, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Calendar,
  SunMedium,
  Crosshair,
  Search,
  Volume2,
  VolumeX,
  Gauge,
  Sunrise,
  Sunset,
  Clock,
  Radio,
  Eye,
  Check,
  X,
  Home,
  Bookmark,
  BookmarkCheck,
  MapPinned,
  BellRing,
  ShieldAlert,
  ChevronUp,
  FileText,
  Flame,
  Snowflake,
  AlertOctagon,
  Bug,
  HeartPulse
} from 'lucide-react';
import { 
  WeatherData, 
  fetchLiveWeather, 
  SevereWeatherAlert, 
  DistrictAgroAdvisory 
} from '../lib/weatherService';
import { 
  getDeviceLocation, 
  searchLocations, 
  resolveSavedLocationCoords,
  GeoLocationResult 
} from '../lib/locationService';
import { useLanguage } from '../context/LanguageContext';
import { User } from '../types';

interface LocalWeatherWidgetProps {
  currentUser?: User | null;
  onAskAiWithPrompt?: (prompt: string) => void;
}

export const LocalWeatherWidget: React.FC<LocalWeatherWidgetProps> = ({
  currentUser,
  onAskAiWithPrompt,
}) => {
  const { currentLanguage } = useLanguage();
  const isHindi = currentLanguage === 'hi';

  // Determine user's saved farm location (localStorage or currentUser)
  const getSavedFarmLocation = () => {
    try {
      const stored = localStorage.getItem('krishakarya_saved_farm_location');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.district || parsed.village)) {
          return parsed;
        }
      }
    } catch (e) {}

    return {
      village: currentUser?.village || 'Shivpur Rural',
      district: currentUser?.district || 'Varanasi',
      state: currentUser?.state || 'Uttar Pradesh',
      pincode: currentUser?.pincode || '221003',
    };
  };

  const [savedFarm, setSavedFarm] = useState(getSavedFarmLocation);
  const [locationMode, setLocationMode] = useState<'saved_farm' | 'gps' | 'custom'>('saved_farm');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoLocationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'district_bulletin' | 'hourly' | '7day' | 'advisory'>('overview');
  const [isAlertExpanded, setIsAlertExpanded] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Search & City Picker State
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
    displayName: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load weather for Saved Farm Location by default
  useEffect(() => {
    const currentSaved = getSavedFarmLocation();
    setSavedFarm(currentSaved);
    fetchWeatherForSavedFarm(currentSaved);
  }, [currentUser?.district, currentUser?.village, currentUser?.state]);

  // Fetch Weather for Saved Farm Location
  const fetchWeatherForSavedFarm = async (farm = savedFarm) => {
    setIsLoading(true);
    setLocationMode('saved_farm');

    try {
      let geo: GeoLocationResult;
      if (farm.latitude && farm.longitude) {
        geo = {
          latitude: farm.latitude,
          longitude: farm.longitude,
          accuracy: 50,
          source: 'saved_profile' as any,
          village: farm.village || 'Farm Field',
          district: farm.district || 'District',
          state: farm.state || 'State',
          country: 'India',
          address: [farm.village, farm.district, farm.state].filter(Boolean).join(', '),
          timestamp: Date.now(),
        };
      } else {
        geo = await resolveSavedLocationCoords({
          village: farm.village,
          district: farm.district,
          state: farm.state,
          pincode: farm.pincode,
        });
      }

      setCurrentLocation(geo);

      const weatherData = await fetchLiveWeather(geo.latitude, geo.longitude, {
        village: geo.village || farm.village || 'Local Farm Field',
        district: geo.district || farm.district || 'District',
        state: geo.state || farm.state || 'State',
        country: geo.country || 'India',
        source: 'saved_profile' as any,
        accuracy: geo.accuracy,
      });

      setWeather(weatherData);
    } catch (err) {
      console.warn('Saved farm weather fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsDetectingLocation(false);
    }
  };

  // Fetch Weather using Real Device GPS
  const fetchWeatherForDeviceGps = async () => {
    setIsLoading(true);
    setIsDetectingLocation(true);
    setLocationMode('gps');

    try {
      const geo = await getDeviceLocation({ forceFresh: true });
      setCurrentLocation(geo);

      const weatherData = await fetchLiveWeather(geo.latitude, geo.longitude, {
        village: geo.village || 'Field',
        district: geo.district || 'District',
        state: geo.state || 'State',
        country: geo.country || 'India',
        source: geo.source,
        accuracy: geo.accuracy,
      });

      setWeather(weatherData);
    } catch (err) {
      console.warn('GPS weather detect error:', err);
    } finally {
      setIsLoading(false);
      setIsDetectingLocation(false);
    }
  };

  // Save current active location as permanent saved farm location
  const handleSaveAsFarmLocation = (customLoc?: GeoLocationResult) => {
    const target = customLoc || currentLocation;
    if (!target) return;

    const newSaved = {
      village: target.village || '',
      district: target.district || '',
      state: target.state || '',
      latitude: target.latitude,
      longitude: target.longitude,
    };

    try {
      localStorage.setItem('krishakarya_saved_farm_location', JSON.stringify(newSaved));
    } catch (e) {}

    setSavedFarm(newSaved);
    setLocationMode('saved_farm');
    setSaveToast(isHindi ? `खेत लोकेशन "${newSaved.village || newSaved.district}" सहेजी गई!` : `Saved "${newSaved.village || newSaved.district}" as primary farm!`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Handle Location Search Input
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchLocations(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);
  };

  // Handle Selection of Searched Location
  const handleSelectLocation = async (item: {
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
    displayName: string;
  }) => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsLoading(true);

    try {
      const geoResult: GeoLocationResult = {
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: 100,
        source: 'search',
        village: item.name,
        district: item.admin1 || item.name,
        state: item.admin1 || 'State',
        country: item.country || 'India',
        address: item.displayName,
      };
      setCurrentLocation(geoResult);

      const weatherData = await fetchLiveWeather(item.latitude, item.longitude, {
        village: item.name,
        district: item.admin1 || item.name,
        state: item.admin1 || 'State',
        country: item.country || 'India',
        source: 'search',
      });

      setWeather(weatherData);
    } catch (e) {
      console.warn('Search weather fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Text-To-Speech (TTS) Voice Narration of Weather & Crop Advisory
  const handleToggleVoiceNarration = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported on this browser or environment.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!weather) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const alertNarration = weather.activeSevereAlert && weather.activeSevereAlert.severity !== 'normal'
      ? (isHindi
          ? `मौसम चेतावनी: ${weather.activeSevereAlert.headlineHi}। `
          : `Weather alert: ${weather.activeSevereAlert.headline}. `)
      : '';

    const textToSpeak = isHindi
      ? `स्थान ${weather.locationName}, ${weather.district}। ${alertNarration}वर्तमान तापमान ${weather.temperature} डिग्री सेल्सियस है और मौसम ${weather.conditionTextHi} है। हवा की गति ${weather.windSpeed} किलोमीटर प्रति घंटा है। कीटनाशक छिड़काव की सलाह: ${weather.advisories.spraying.textHi}। सिंचाई सलाह: ${weather.advisories.irrigation.textHi}।`
      : `Weather update for ${weather.locationName}, ${weather.district}. ${alertNarration}Temperature is ${weather.temperature} degrees Celsius with ${weather.conditionText}. Humidity is ${weather.humidity} percent, wind speed ${weather.windSpeed} kilometers per hour. Pesticide advisory: ${weather.advisories.spraying.text}. Irrigation advice: ${weather.advisories.irrigation.text}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Ask Krishak A.I with Contextual Weather & District Alerts
  const handleAskAiWithWeather = () => {
    if (!weather) return;
    const alertPart = weather.activeSevereAlert && weather.activeSevereAlert.severity !== 'normal'
      ? (isHindi 
          ? `\nमौसम चेतावनी: ${weather.activeSevereAlert.headlineHi}।` 
          : `\nActive Weather Warning: ${weather.activeSevereAlert.headline}.`)
      : '';

    const prompt = isHindi
      ? `मेरी वर्तमान लोकेशन (${weather.locationName}, ${weather.district}, ${weather.state}) में आज का तापमान ${weather.temperature}°C, मौसम "${weather.conditionTextHi}", आर्द्रता ${weather.humidity}%, बारिश की संभावना ${weather.dailyForecast[0]?.rainProb || 0}%, और हवा ${weather.windSpeed} km/h है।${alertPart} आज मेरी फसलों के लिए कीटनाशक छिड़काव, सिंचाई, कटाई व फसल सुरक्षा पर विस्तृत कृषि सलाह दें।`
      : `Farm location: ${weather.locationName}, ${weather.district}, ${weather.state}. Current temp ${weather.temperature}°C (${weather.conditionText}), humidity ${weather.humidity}%, rain prob ${weather.dailyForecast[0]?.rainProb || 0}%, wind ${weather.windSpeed} km/h.${alertPart} Please provide practical agronomy advice for standing crops, spraying, irrigation, and weather risk precautions.`;

    if (onAskAiWithPrompt) {
      onAskAiWithPrompt(prompt);
    }
  };

  // Helper for Alert Category Icons
  const renderAlertCategoryIcon = (category: string, className = "w-5 h-5") => {
    switch (category) {
      case 'heavy_rain':
        return <CloudRain className={className} />;
      case 'thunderstorm':
        return <CloudLightning className={className} />;
      case 'heatwave':
        return <Flame className={className} />;
      case 'coldwave':
      case 'frost':
        return <Snowflake className={className} />;
      case 'hailstorm':
        return <AlertOctagon className={className} />;
      case 'high_wind':
        return <Wind className={className} />;
      case 'fog':
        return <CloudFog className={className} />;
      case 'blight_humidity':
        return <Droplets className={className} />;
      case 'favorable':
      default:
        return <CheckCircle2 className={className} />;
    }
  };

  // Helper for Severity Card Styles
  const getAlertStyle = (severity: string, colorCode: string) => {
    switch (colorCode) {
      case 'red':
        return {
          bannerBg: 'bg-gradient-to-r from-red-950/90 via-rose-950/85 to-slate-950/90 border-red-500/40 text-red-100',
          badgeBg: 'bg-red-500 text-white font-black animate-pulse shadow-md shadow-red-500/30',
          accentText: 'text-red-400',
          cardBorder: 'border-red-500/40 bg-red-950/30',
          pillBg: 'bg-red-500/20 text-red-300 border-red-500/40',
          iconColor: 'text-red-400',
          label: isHindi ? 'उच्च चेतावनी (Warning)' : 'Severe Warning (Red Alert)',
        };
      case 'orange':
        return {
          bannerBg: 'bg-gradient-to-r from-orange-950/90 via-amber-950/85 to-slate-950/90 border-orange-500/40 text-orange-100',
          badgeBg: 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/30',
          accentText: 'text-orange-400',
          cardBorder: 'border-orange-500/40 bg-orange-950/30',
          pillBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          iconColor: 'text-orange-400',
          label: isHindi ? 'सतर्कता अलर्ट (Alert)' : 'Weather Alert (Orange)',
        };
      case 'yellow':
        return {
          bannerBg: 'bg-gradient-to-r from-amber-950/85 via-yellow-950/75 to-slate-950/90 border-amber-500/35 text-amber-100',
          badgeBg: 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20',
          accentText: 'text-amber-300',
          cardBorder: 'border-amber-500/30 bg-amber-950/20',
          pillBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconColor: 'text-amber-400',
          label: isHindi ? 'मौसम निगरानी (Watch)' : 'Weather Watch (Yellow)',
        };
      case 'green':
      default:
        return {
          bannerBg: 'bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-950/90 border-emerald-500/30 text-emerald-100',
          badgeBg: 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20',
          accentText: 'text-emerald-300',
          cardBorder: 'border-emerald-500/30 bg-emerald-950/20',
          pillBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          iconColor: 'text-emerald-400',
          label: isHindi ? 'मौसम अनुकूल (Normal)' : 'Normal / Favorable (Green)',
        };
    }
  };

  // Helper for Weather Condition Icons
  const renderWeatherIcon = (iconType: string, className = "w-8 h-8") => {
    switch (iconType) {
      case 'clear-day':
        return <Sun className={`${className} text-amber-400 animate-spin-slow`} />;
      case 'clear-night':
        return <SunMedium className={`${className} text-indigo-300`} />;
      case 'partly-cloudy-day':
      case 'partly-cloudy-night':
        return <CloudSun className={`${className} text-amber-300`} />;
      case 'cloudy':
        return <CloudSun className={`${className} text-slate-300`} />;
      case 'drizzle':
        return <CloudDrizzle className={`${className} text-teal-300`} />;
      case 'rain':
        return <CloudRain className={`${className} text-cyan-400`} />;
      case 'thunderstorm':
        return <CloudLightning className={`${className} text-amber-400 animate-pulse`} />;
      case 'fog':
        return <CloudFog className={`${className} text-slate-300`} />;
      default:
        return <CloudSun className={`${className} text-amber-300`} />;
    }
  };

  const getStatusBadge = (status: 'safe' | 'caution' | 'unsafe') => {
    switch (status) {
      case 'safe':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          label: isHindi ? 'अनुकूल' : 'Optimal',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'caution':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          label: isHindi ? 'सावधानी' : 'Caution',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'unsafe':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          label: isHindi ? 'टालें' : 'Avoid',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
        };
    }
  };

  if (isLoading && !weather) {
    return (
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-[#0a1a15] to-[#0c1317] border border-emerald-500/30 shadow-2xl flex flex-col items-center justify-center min-h-[260px] text-emerald-400 space-y-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center animate-pulse">
            <Home className="w-7 h-7 text-emerald-400 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="text-center space-y-1 max-w-md">
          <p className="text-sm font-black text-white">
            {locationMode === 'saved_farm'
              ? (isHindi 
                  ? `सहेजे गए खेत (${savedFarm.village ? savedFarm.village + ', ' : ''}${savedFarm.district || 'खेत'}) का मौसम लोड हो रहा है...` 
                  : `Loading Weather for Saved Farm (${savedFarm.village ? savedFarm.village + ', ' : ''}${savedFarm.district || 'Farm'})...`)
              : (isHindi ? 'मौसम उपग्रह से डेटा प्राप्त किया जा रहा है...' : 'Connecting to Open-Meteo Weather Radar...')}
          </p>
          <p className="text-xs text-slate-400">
            {isHindi ? 'फसल व कृषि सलाह के लिए वास्तविक समय का मौसम मॉडल' : 'Real-time agrometeorological insights for your farm fields'}
          </p>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="rounded-3xl overflow-hidden glass-dark-card border border-white/20 shadow-2xl relative text-white">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-xl flex items-center gap-2 animate-bounce border border-emerald-300">
          <BookmarkCheck className="w-4 h-4 text-slate-950" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Header Strip with Location Status, Quick Location Switcher & Action Buttons */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-900/70 backdrop-blur-2xl flex flex-col gap-3 relative z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
        
        {/* Main Title & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Location & Farm Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md border border-emerald-400/40 shrink-0">
              <CloudSun className="w-6 h-6 text-slate-950" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5 truncate">
                  {isHindi ? 'सटीक मौसम पूर्वानुमान व कृषि सलाह' : 'Localized Agricultural Weather Forecast'}
                </h3>
                
                {/* Location Source Tag */}
                <span className={`px-2.5 py-0.5 border text-[10px] font-black rounded-full uppercase flex items-center gap-1 ${
                  locationMode === 'saved_farm'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                    : locationMode === 'gps'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {locationMode === 'saved_farm' ? (
                    <>
                      <Home className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{isHindi ? 'सहेजा गया खेत' : 'Saved Farm Location'}</span>
                    </>
                  ) : locationMode === 'gps' ? (
                    <>
                      <Crosshair className="w-2.5 h-2.5 text-teal-400" />
                      <span>{isHindi ? 'डिवाइस जीपीएस' : 'Device GPS'}</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-2.5 h-2.5 text-amber-400" />
                      <span>{isHindi ? 'खोजा गया स्थान' : 'Searched Mandi'}</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1 font-bold text-emerald-300 truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{weather.locationName}, {weather.district}, {weather.state}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  • {isHindi ? `अपडेट: ${weather.lastUpdated}` : `Updated ${weather.lastUpdated}`}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: TTS, Ask AI */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Text-To-Speech Narration */}
            <button
              onClick={handleToggleVoiceNarration}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
              title="Listen to Weather Advisory Voice Narration"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Ask Krishak A.I Advisory */}
            <button
              onClick={handleAskAiWithWeather}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Get AI Advice Grounded in Real Weather Data"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span className="whitespace-nowrap">{isHindi ? 'ए.आई सलाह' : 'Ask AI Advice'}</span>
            </button>
          </div>
        </div>

        {/* Location Switcher Toolbar */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <MapPinned className="w-3.5 h-3.5 text-emerald-400" />
              {isHindi ? 'स्थान चुनें:' : 'Location:'}
            </span>

            {/* 1. Saved Farm Location Button */}
            <button
              onClick={() => fetchWeatherForSavedFarm()}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                locationMode === 'saved_farm'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                  : 'bg-slate-900/80 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/60'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>
                {isHindi ? 'सहेजा गया खेत' : 'Saved Farm'}: {savedFarm.village ? `${savedFarm.village}, ` : ''}{savedFarm.district || 'Farm'}
              </span>
            </button>

            {/* 2. Device GPS Button */}
            <button
              onClick={() => fetchWeatherForDeviceGps()}
              disabled={isDetectingLocation}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                locationMode === 'gps'
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md font-black'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-white/5'
              }`}
            >
              <Crosshair className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin text-amber-400' : ''}`} />
              <span>
                {isDetectingLocation 
                  ? (isHindi ? 'जीपीएस खोज...' : 'Locating GPS...') 
                  : (isHindi ? 'डिवाइस जीपीएस' : 'Device GPS')}
              </span>
            </button>

            {/* 3. Search Other Mandi Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                locationMode === 'custom'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-white/5'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>{isHindi ? 'अन्य मंडी / शहर' : 'Search Mandi/City'}</span>
            </button>
          </div>

          {/* If currently in GPS or Custom mode, show button to Set as My Saved Farm */}
          {locationMode !== 'saved_farm' && (
            <button
              onClick={() => handleSaveAsFarmLocation()}
              className="px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? '⭐ इसे अपना खेत बनाएं' : '⭐ Set as My Farm Location'}</span>
            </button>
          )}
        </div>

      </div>

      {/* Informative Sub-banner for Localized Agricultural Insights */}
      <div className="px-4 sm:px-6 py-2 bg-emerald-950/40 border-b border-emerald-500/15 flex items-center justify-between gap-2 flex-wrap text-[11px] text-emerald-300">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {isHindi 
              ? `आपके स्थान (${weather.locationName}, ${weather.district}) के लिए स्थानीय कृषि मौसम विज्ञान एवं कार्य योजना सक्रिय है।`
              : `Localized agricultural weather radar & field action deciders active for ${weather.locationName}, ${weather.district}.`}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold hidden md:inline">
          {isHindi ? 'स्रोत: Open-Meteo उच्च-सटीकता मौसम मॉडल' : 'Powered by Open-Meteo High-Resolution API'}
        </span>
      </div>

      {/* Prominent Severe Weather Alert & District Advisory Banner */}
      {weather.activeSevereAlert && (
        <div className={`px-4 sm:px-6 py-3 border-b transition-all ${
          weather.activeSevereAlert.severity === 'warning'
            ? 'bg-gradient-to-r from-red-950/90 via-rose-950/85 to-slate-950/90 border-red-500/40 text-red-100'
            : weather.activeSevereAlert.severity === 'alert'
            ? 'bg-gradient-to-r from-orange-950/90 via-amber-950/85 to-slate-950/90 border-orange-500/40 text-orange-100'
            : weather.activeSevereAlert.severity === 'watch'
            ? 'bg-gradient-to-r from-amber-950/85 via-yellow-950/75 to-slate-950/90 border-amber-500/35 text-amber-100'
            : 'bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-950/90 border-emerald-500/30 text-emerald-100'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              {/* Alert Category & Status Icon */}
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${
                weather.activeSevereAlert.severity === 'warning'
                  ? 'bg-red-500 text-white border-red-400 animate-pulse'
                  : weather.activeSevereAlert.severity === 'alert'
                  ? 'bg-orange-500 text-slate-950 border-orange-400 font-black'
                  : weather.activeSevereAlert.severity === 'watch'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
              }`}>
                {renderAlertCategoryIcon(weather.activeSevereAlert.category, "w-5 h-5")}
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Severity Badge */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border flex items-center gap-1 ${
                    weather.activeSevereAlert.severity === 'warning'
                      ? 'bg-red-500/30 text-red-200 border-red-500/50'
                      : weather.activeSevereAlert.severity === 'alert'
                      ? 'bg-orange-500/30 text-orange-200 border-orange-500/50'
                      : weather.activeSevereAlert.severity === 'watch'
                      ? 'bg-amber-500/30 text-amber-200 border-amber-500/50'
                      : 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50'
                  }`}>
                    <BellRing className="w-3 h-3" />
                    <span>
                      {weather.activeSevereAlert.severity === 'warning'
                        ? (isHindi ? 'मौसम चेतावनी' : 'Severe Warning')
                        : weather.activeSevereAlert.severity === 'alert'
                        ? (isHindi ? 'मौसम अलर्ट' : 'Weather Alert')
                        : weather.activeSevereAlert.severity === 'watch'
                        ? (isHindi ? 'मौसम निगरानी' : 'Weather Watch')
                        : (isHindi ? 'मौसम अनुकूल' : 'Normal / Favorable')}
                    </span>
                  </span>

                  <span className="text-[11px] font-bold text-slate-300">
                    {weather.district}, {weather.state}
                  </span>

                  <span className="text-[10px] opacity-75 font-medium">
                    • {isHindi ? 'वैधता:' : 'Valid until:'} {weather.activeSevereAlert.effectiveUntil}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-black tracking-tight leading-snug">
                  {isHindi ? weather.activeSevereAlert.headlineHi : weather.activeSevereAlert.headline}
                </p>
              </div>
            </div>

            {/* Quick Actions for the Alert */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {/* Toggle Precautions Drawer */}
              <button
                onClick={() => setIsAlertExpanded(!isAlertExpanded)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{isAlertExpanded ? (isHindi ? 'कम करें' : 'Hide Details') : (isHindi ? 'सावधानियां देखें' : 'Precautions')}</span>
                {isAlertExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Open Full District Bulletin Tab */}
              <button
                onClick={() => setActiveTab('district_bulletin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1 cursor-pointer ${
                  weather.activeSevereAlert.severity === 'warning'
                    ? 'bg-red-500 hover:bg-red-400 text-white'
                    : weather.activeSevereAlert.severity === 'alert'
                    ? 'bg-orange-500 hover:bg-orange-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                <span>{isHindi ? 'जिला बुलेटिन' : 'District Advisory'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expandable Precautions & Crop Impacts Drawer */}
          {isAlertExpanded && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-fadeIn">
              <p className="text-xs leading-relaxed opacity-90">
                {isHindi ? weather.activeSevereAlert.descriptionHi : weather.activeSevereAlert.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Farmer Precautions Checklist */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
                  <h6 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1 text-amber-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    {isHindi ? 'किसान तुरंत करें (Immediate Precautions)' : 'Farmer Action Protocol'}
                  </h6>
                  <ul className="space-y-1 text-xs text-slate-200">
                    {(isHindi ? weather.activeSevereAlert.precautionsHi : weather.activeSevereAlert.precautions).map((prec, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5 font-bold">•</span>
                        <span>{prec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specific Crop Impacts in District */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
                  <h6 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1 text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    {isHindi ? 'खेत में खड़ी फसलों पर प्रभाव व बचाव' : 'District Standing Crop Impacts'}
                  </h6>
                  <div className="space-y-1.5">
                    {weather.activeSevereAlert.cropImpacts.map((ci, cIdx) => (
                      <div key={cIdx} className="text-xs bg-white/5 p-2 rounded-lg border border-white/5 space-y-0.5">
                        <div className="flex items-center justify-between font-bold text-white">
                          <span>{isHindi ? ci.cropNameHi : ci.cropName}</span>
                          <span className="text-[10px] text-amber-300 font-semibold">{isHindi ? ci.impactHi : ci.impact}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          <b className="text-emerald-300">{isHindi ? 'सलाह:' : 'Action:'}</b> {isHindi ? ci.actionHi : ci.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Subtabs: Overview / District Advisory / 24h Hourly / 7-Day Outlook / Farming Advisory */}
      <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-emerald-500/10 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-10 bg-slate-950/40">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {isHindi ? '🌾 मुख्य मौसम' : 'Overview'}
        </button>

        {/* District Agromet Advisory & Severe Weather Alerts Tab */}
        <button
          onClick={() => setActiveTab('district_bulletin')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer relative ${
            activeTab === 'district_bulletin'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BellRing className="w-3.5 h-3.5 text-amber-400" />
          <span>{isHindi ? `जिला कृषि बुलेटिन व अलर्ट` : `District Advisory & Alerts`}</span>
          {weather.activeSevereAlert && weather.activeSevereAlert.severity !== 'normal' && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('hourly')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'hourly'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {isHindi ? '24-घंटे टाइमलाइन' : '24-Hour Timeline'}
        </button>

        <button
          onClick={() => setActiveTab('7day')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === '7day'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {isHindi ? '7-दिवसीय पूर्वानुमान' : '7-Day Extended'}
        </button>

        <button
          onClick={() => setActiveTab('advisory')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'advisory'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {isHindi ? 'कृषि कार्य निर्णय' : 'Farm Deciders'}
        </button>
      </div>

      {/* Body Content Area */}
      <div className="p-4 sm:p-6 space-y-6 relative z-10">
        
        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Primary Grid: Main Temperature & Environmental Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              
              {/* Temperature & Live Conditions Hero Card (5 Cols) */}
              <div className="md:col-span-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950/85 via-emerald-950/75 to-slate-900/85 border border-white/15 backdrop-blur-2xl flex flex-col justify-between gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.3)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        {weather.temperature}°C
                      </span>
                      <span className="text-xs text-emerald-300 font-semibold">
                        {isHindi ? `महसूस: ${weather.apparentTemperature}°C` : `Feels: ${weather.apparentTemperature}°C`}
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-amber-300">
                      {isHindi ? weather.conditionTextHi : weather.conditionText}
                    </p>
                    <p className="text-xs text-slate-300 font-medium">
                      {isHindi 
                        ? `आज अधिकतम ${weather.dailyForecast[0]?.maxTemp}° / न्यूनतम ${weather.dailyForecast[0]?.minTemp}°` 
                        : `High ${weather.dailyForecast[0]?.maxTemp}° / Low ${weather.dailyForecast[0]?.minTemp}° today`}
                    </p>
                  </div>

                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shrink-0">
                    {renderWeatherIcon(weather.iconType, "w-12 h-12 sm:w-14 sm:h-14")}
                  </div>
                </div>

                {/* Sunrise / Sunset Strip */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sunrise className="w-4 h-4 text-amber-400" />
                    <span>{isHindi ? 'सूर्योदय:' : 'Sunrise:'} <b>{weather.sunriseTime}</b></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sunset className="w-4 h-4 text-orange-400" />
                    <span>{isHindi ? 'सूर्यास्त:' : 'Sunset:'} <b>{weather.sunsetTime}</b></span>
                  </div>
                </div>
              </div>

              {/* Environmental Metrics (7 Cols) */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                
                {/* Humidity */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/20 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold">{isHindi ? 'नमी (आर्द्रता)' : 'Humidity'}</span>
                    <Droplets className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-lg sm:text-xl font-black text-white">{weather.humidity}%</span>
                    <p className="text-[10px] text-cyan-300 font-medium mt-0.5">
                      {weather.humidity > 70 ? (isHindi ? 'उच्च नमी' : 'High') : (isHindi ? 'सामान्य' : 'Normal')}
                    </p>
                  </div>
                </div>

                {/* Wind Speed & Compass Direction */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/20 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold">{isHindi ? 'हवा की गति' : 'Wind Speed'}</span>
                    <Wind className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-lg sm:text-xl font-black text-white">{weather.windSpeed} <span className="text-xs font-bold text-slate-400">km/h</span></span>
                    <p className="text-[10px] text-teal-300 font-semibold mt-0.5 truncate">
                      {isHindi ? weather.windDirectionCompassHi : weather.windDirectionCompass}
                    </p>
                  </div>
                </div>

                {/* Rain Chance */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/20 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold">{isHindi ? 'बारिश की संभावना' : 'Rain Chance'}</span>
                    <CloudRain className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-lg sm:text-xl font-black text-white">{weather.dailyForecast[0]?.rainProb || 0}%</span>
                    <p className="text-[10px] text-blue-300 font-medium mt-0.5">
                      {(weather.dailyForecast[0]?.rainProb || 0) < 25 ? (isHindi ? 'नगण्य' : 'Dry Day') : (isHindi ? 'वर्षा के आसार' : 'Rain Likely')}
                    </p>
                  </div>
                </div>

                {/* UV Index & Atmospheric Pressure */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/20 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold">{isHindi ? 'धूप व दबाव' : 'UV / Pressure'}</span>
                    <Sun className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-lg sm:text-xl font-black text-white">UV {weather.uvIndex}</span>
                    <p className="text-[10px] text-amber-300 font-medium mt-0.5">
                      {weather.pressure} hPa
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick 24h Hourly Strip Preview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {isHindi ? 'आज 24-घंटे का तापमान व बारिश टाइमलाइन' : '24-Hour Hourly Weather Curve'}
                </span>
                <button
                  onClick={() => setActiveTab('hourly')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isHindi ? 'पूरा देखें' : 'View Full'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 overflow-x-auto no-scrollbar">
                {weather.hourlyForecast.slice(0, 8).map((hour, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-2xl text-center border flex flex-col items-center justify-between gap-1.5 transition-all ${
                      idx === 0 
                        ? 'bg-emerald-950/70 border-emerald-500/40 shadow-sm' 
                        : 'bg-slate-900/60 border-emerald-500/15'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold text-slate-200">
                      {hour.hourLabel}
                    </span>
                    <div className="my-0.5">
                      {renderWeatherIcon(hour.iconType, "w-6 h-6")}
                    </div>
                    <span className="text-xs font-black text-white">
                      {hour.temperature}°
                    </span>
                    <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-0.5">
                      <Droplets className="w-2 h-2" /> {hour.rainProb}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* District Agro Advisory & Warning Highlight Card in Overview */}
            {weather.districtAdvisory && (
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md transition-all ${
                weather.activeSevereAlert?.severity === 'warning'
                  ? 'bg-red-950/40 border-red-500/40'
                  : weather.activeSevereAlert?.severity === 'alert'
                  ? 'bg-orange-950/40 border-orange-500/40'
                  : weather.activeSevereAlert?.severity === 'watch'
                  ? 'bg-amber-950/40 border-amber-500/35'
                  : 'bg-emerald-950/40 border-emerald-500/30'
              }`}>
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    weather.activeSevereAlert?.severity === 'warning'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : weather.activeSevereAlert?.severity === 'alert'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white">
                        {isHindi ? `${weather.district} जिला कृषि मौसम बुलेटिन` : `${weather.district} District Agromet Advisory`}
                      </span>
                      {weather.activeSevereAlert && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          weather.activeSevereAlert.severity === 'warning'
                            ? 'bg-red-500 text-white'
                            : weather.activeSevereAlert.severity === 'alert'
                            ? 'bg-orange-500 text-slate-950'
                            : weather.activeSevereAlert.severity === 'watch'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {weather.activeSevereAlert.severity === 'warning'
                            ? (isHindi ? 'चेतावनी' : 'Warning')
                            : weather.activeSevereAlert.severity === 'alert'
                            ? (isHindi ? 'अलर्ट' : 'Alert')
                            : weather.activeSevereAlert.severity === 'watch'
                            ? (isHindi ? 'निगरानी' : 'Watch')
                            : (isHindi ? 'अनुकूल' : 'Normal')}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {weather.districtAdvisory.agroClimaticZone}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">
                      {isHindi ? weather.districtAdvisory.overallSummaryHi : weather.districtAdvisory.overallSummary}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('district_bulletin')}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm self-start sm:self-center"
                >
                  <span>{isHindi ? 'विस्तृत जिला बुलेटिन देखें' : 'View District Bulletin'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 4 Core Agricultural Advisories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  {isHindi ? 'दैनिक कृषि कार्य योजना (Farmer Action Deciders)' : 'Daily Farm Work Deciders'}
                </h4>
                <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
                  {isHindi ? 'हवा व बारिश के अनुसार सटीक कार्य समय' : 'Grounded on wind speed & moisture radar'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Spraying */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-2 hover:border-emerald-400/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1">
                      🌿 {isHindi ? 'कीटनाशक व खाद स्प्रे' : 'Spraying'}
                    </span>
                    {(() => {
                      const badge = getStatusBadge(weather.advisories.spraying.status);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon} {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isHindi ? weather.advisories.spraying.textHi : weather.advisories.spraying.text}
                  </p>
                </div>

                {/* 2. Irrigation */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-2 hover:border-emerald-400/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1">
                      💧 {isHindi ? 'सिंचाई योजना' : 'Irrigation'}
                    </span>
                    {(() => {
                      const badge = getStatusBadge(weather.advisories.irrigation.status);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon} {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isHindi ? weather.advisories.irrigation.textHi : weather.advisories.irrigation.text}
                  </p>
                </div>

                {/* 3. Harvesting */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-2 hover:border-emerald-400/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1">
                      🌾 {isHindi ? 'कटाई व मड़ाई' : 'Harvesting'}
                    </span>
                    {(() => {
                      const badge = getStatusBadge(weather.advisories.harvesting.status);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon} {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isHindi ? weather.advisories.harvesting.textHi : weather.advisories.harvesting.text}
                  </p>
                </div>

                {/* 4. Labor */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-2 hover:border-emerald-400/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1">
                      👨‍🌾 {isHindi ? 'मजदूर व ट्रैक्टर शिफ्ट' : 'Labor Shift'}
                    </span>
                    {(() => {
                      const badge = getStatusBadge(weather.advisories.labor.status);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon} {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isHindi ? weather.advisories.labor.textHi : weather.advisories.labor.text}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab: District Agromet Advisory & Severe Weather Warnings */}
        {activeTab === 'district_bulletin' && (
          <div className="space-y-6">
            
            {/* 1. Official Agromet Weather Bulletin Masthead */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950/90 via-emerald-950/80 to-slate-900/90 border border-emerald-500/30 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2 flex-wrap">
                      <span>{isHindi ? 'जिला कृषि मौसम विज्ञान सलाहकार बुलेटिन' : 'District Agromet Advisory Service (AAS) Bulletin'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                        {weather.district}, {weather.state}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      {isHindi 
                        ? `${weather.districtAdvisory?.agroClimaticZoneHi || weather.districtAdvisory?.agroClimaticZone || weather.state + ' कृषि-जलवायु क्षेत्र'}`
                        : `${weather.districtAdvisory?.agroClimaticZone || weather.state + ' Agro-Climatic Zone'}`}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] text-slate-400 space-y-0.5 shrink-0">
                  <p><b className="text-slate-300">{isHindi ? 'बुलेटिन सं:' : 'Bulletin No:'}</b> {weather.districtAdvisory?.bulletinNumber || 'IMD/AAS/2026/03'}</p>
                  <p><b className="text-slate-300">{isHindi ? 'जारी दिनांक:' : 'Issued:'}</b> {weather.districtAdvisory?.bulletinDate || 'Today'}</p>
                </div>
              </div>

              {/* Overall Agromet Bulletin Summary */}
              <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {isHindi ? 'कृषि मौसम बुलेटिन मुख्य सारांश (Executive Summary):' : 'Executive Agromet Advisory Summary:'}
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {isHindi 
                    ? weather.districtAdvisory?.overallSummaryHi 
                    : weather.districtAdvisory?.overallSummary}
                </p>
              </div>
            </div>

            {/* 2. Severe Weather Alerts for the District */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h5 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{isHindi ? `जिले के लिए मौसम चेतावनी एवं सतर्कता अलर्ट` : `Severe Weather Warnings & Alerts (${weather.district})`}</span>
                </h5>
                <span className="text-xs text-slate-400 font-medium">
                  {weather.severeAlerts?.length || 0} {isHindi ? 'अलर्ट रिकॉर्ड' : 'advisories active'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {weather.severeAlerts && weather.severeAlerts.length > 0 ? (
                  weather.severeAlerts.map((alert) => {
                    const style = getAlertStyle(alert.severity, alert.colorCode);
                    return (
                      <div 
                        key={alert.id}
                        className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all shadow-md ${style.cardBorder}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/10 pb-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl border shrink-0 ${style.pillBg}`}>
                              {renderAlertCategoryIcon(alert.category, "w-6 h-6")}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${style.badgeBg}`}>
                                  {style.label}
                                </span>
                                <span className="text-xs font-bold text-slate-300">
                                  {alert.affectedArea}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  • {isHindi ? 'वैधता:' : 'Valid until:'} {alert.effectiveUntil}
                                </span>
                              </div>
                              <h6 className="text-sm sm:text-base font-black text-white">
                                {isHindi ? alert.headlineHi : alert.headline}
                              </h6>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <span className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                              {alert.source}
                            </span>
                            <button
                              onClick={handleAskAiWithWeather}
                              className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>{isHindi ? 'AI से पूछें' : 'Ask AI'}</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          {isHindi ? alert.descriptionHi : alert.description}
                        </p>

                        {/* Farmer Action Protocol */}
                        <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-2">
                          <span className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            {isHindi ? 'किसान तुरंत करें (अनुशंसित सुरक्षा कदम):' : 'Farmer Action Protocol (Recommended Steps):'}
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                            {(isHindi ? alert.precautionsHi : alert.precautions).map((prec, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-2 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                <span className="text-amber-400 font-bold mt-0.5">•</span>
                                <span className="leading-snug">{prec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Specific Crop Impacts in District */}
                        {alert.cropImpacts && alert.cropImpacts.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-black uppercase text-emerald-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              {isHindi ? 'जिले की खड़ी फसलों पर प्रभाव व त्वरित उपाय:' : 'Standing Crop Impact & Protective Interventions:'}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {alert.cropImpacts.map((c, cIdx) => (
                                <div key={cIdx} className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1.5">
                                  <div className="flex items-center justify-between font-extrabold text-xs text-white">
                                    <span>{isHindi ? c.cropNameHi : c.cropName}</span>
                                    <span className="text-[10px] text-amber-300 px-1.5 py-0.5 bg-amber-500/20 rounded font-semibold">
                                      {isHindi ? c.impactHi : c.impact}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 leading-snug">
                                    <b className="text-emerald-300">{isHindi ? 'सलाह:' : 'Action:'}</b> {isHindi ? c.actionHi : c.action}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 text-center text-xs text-slate-300">
                    {isHindi ? 'जिले में कोई गंभीर मौसम चेतावनी सक्रिय नहीं है।' : 'No severe weather alerts active for this district.'}
                  </div>
                )}
              </div>
            </div>

            {/* 3. District Seasonal Crop Advisories */}
            {weather.districtAdvisory?.seasonalCropAdvisories && weather.districtAdvisory.seasonalCropAdvisories.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h5 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Bug className="w-4 h-4 text-emerald-400" />
                    <span>{isHindi ? `जिले की प्रमुख मौसमी फसलों की कृषि सलाह` : `Seasonal Crop Agromet Advisories (${weather.district})`}</span>
                  </h5>
                  <span className="text-xs text-slate-400">
                    {isHindi ? 'वृद्धि अवस्था व कीट-रोग निगरानी' : 'Growth Stage & Pest Risk'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {weather.districtAdvisory.seasonalCropAdvisories.map((crop, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                        <div>
                          <h6 className="font-extrabold text-sm text-white">
                            {isHindi ? crop.cropHi : crop.crop}
                          </h6>
                          <span className="text-[11px] text-emerald-300 font-medium">
                            {isHindi ? crop.growthStageHi : crop.growthStage}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border shrink-0 ${
                          crop.pestRisk === 'high'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : crop.pestRisk === 'moderate'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {crop.pestRisk === 'high' ? (isHindi ? 'कीट: उच्च' : 'Pest: High') : crop.pestRisk === 'moderate' ? (isHindi ? 'कीट: मध्यम' : 'Pest: Mod') : (isHindi ? 'कीट: कम' : 'Pest: Low')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-snug">
                        {isHindi ? crop.advisoryHi : crop.advisory}
                      </p>

                      <div className="text-[11px] bg-black/30 p-2.5 rounded-xl border border-white/5 text-slate-300 space-y-0.5">
                        <p><b className="text-amber-300">{isHindi ? 'कीट निगरानी:' : 'Pest Surveillance:'}</b> {isHindi ? crop.pestRiskDetailsHi : crop.pestRiskDetails}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Soil Moisture & Livestock Advisory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Soil Moisture */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span>{isHindi ? 'मृदा नमी व सिंचाई योजना' : 'Soil Moisture & Evaporation Advisory'}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {isHindi 
                    ? weather.districtAdvisory?.soilMoistureAdvisory.hi 
                    : weather.districtAdvisory?.soilMoistureAdvisory.en}
                </p>
              </div>

              {/* Livestock Care */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>{isHindi ? 'पशुधन व दुधारू मवेशी सुरक्षा' : 'Livestock & Dairy Health Advisory'}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {isHindi 
                    ? weather.districtAdvisory?.livestockAdvisory.hi 
                    : weather.districtAdvisory?.livestockAdvisory.en}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Full 24-Hour Timeline */}
        {activeTab === 'hourly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  {isHindi ? '24-घंटे का विस्तृत प्रति-घंटे पूर्वानुमान' : '24-Hour Detailed Hourly Farm Forecast'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isHindi ? 'तापमान, वर्षा की संभावना व हवा की गति की समय-सारणी' : 'Hourly breakdown of temperature, rain probability and wind'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {weather.hourlyForecast.map((hour, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-center border flex flex-col items-center justify-between gap-2 transition-all ${
                    idx === 0
                      ? 'bg-emerald-950/80 border-emerald-500/40 shadow-md'
                      : 'bg-slate-900/70 border-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="text-xs font-black text-emerald-300">
                    {hour.hourLabel}
                  </span>

                  <div className="my-1">
                    {renderWeatherIcon(hour.iconType, "w-8 h-8")}
                  </div>

                  <span className="text-sm font-black text-white">
                    {hour.temperature}°C
                  </span>

                  <div className="w-full pt-2 border-t border-white/10 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between text-cyan-300 font-bold">
                      <span>{isHindi ? 'बारिश:' : 'Rain:'}</span>
                      <span>{hour.rainProb}%</span>
                    </div>
                    <div className="flex items-center justify-between text-teal-300 font-medium">
                      <span>{isHindi ? 'हवा:' : 'Wind:'}</span>
                      <span>{hour.windSpeed}k</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{isHindi ? 'नमी:' : 'Hum:'}</span>
                      <span>{hour.humidity}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: 7-Day Extended Forecast */}
        {activeTab === '7day' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-white">
                {isHindi ? 'आगामी 7 दिनों का विस्तृत कृषि मौसम पूर्वानुमान' : '7-Day Extended Agricultural Weather Outlook'}
              </h4>
              <p className="text-xs text-slate-400">
                {isHindi ? 'फसल बुवाई, निराई-गुड़ाई, सिंचाई व कटाई की लंबी योजना बनाएं' : 'Plan sowing, fertilizer scheduling, and harvesting days in advance'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {weather.dailyForecast.map((day, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-2xl text-center border transition-all flex flex-col items-center justify-between gap-2.5 ${
                    idx === 0 
                      ? 'bg-emerald-950/80 border-emerald-500/40 shadow-md' 
                      : 'bg-slate-900/60 border-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-white block">
                      {isHindi ? day.dayNameHi : day.dayName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {day.date.substring(5)}
                    </span>
                  </div>

                  <div className="my-1">
                    {renderWeatherIcon(day.iconType, "w-8 h-8")}
                  </div>

                  <p className="text-[11px] font-extrabold text-amber-300 truncate w-full">
                    {isHindi ? day.conditionTextHi : day.conditionText}
                  </p>

                  <div className="w-full space-y-1 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-black text-white">
                      <span>{day.maxTemp}°</span>
                      <span className="text-[11px] text-slate-400 font-medium">{day.minTemp}°</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-cyan-300">
                      <Droplets className="w-3 h-3" /> {day.rainProb}%
                      {day.rainSum > 0 && <span className="text-[10px] text-slate-400">({day.rainSum}mm)</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Farm Deciders Advisory Details */}
        {activeTab === 'advisory' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-white">
                {isHindi ? 'मौसम आधारित विस्तृत कृषि निर्णय मार्गदर्शिका' : 'Weather-Driven Farm Action Guide'}
              </h4>
              <p className="text-xs text-slate-400">
                {isHindi ? 'कीटनाशक प्रभावशीलता, भूजल संरक्षण और फसल सुरक्षा के लिए सिफारिशें' : 'Scientific guidelines to maximize chemical efficacy and conserve resources'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Detailed Spraying */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                    🌿 {isHindi ? 'कीटनाशक व फफूंदनाशक छिड़काव (Spraying)' : 'Pesticide & Fungicide Spraying'}
                  </h5>
                  {(() => {
                    const b = getStatusBadge(weather.advisories.spraying.status);
                    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${b.bg}`}>{b.icon} {b.label}</span>;
                  })()}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {isHindi ? weather.advisories.spraying.textHi : weather.advisories.spraying.text}
                </p>
                <div className="text-[11px] text-slate-400 bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <p>• <b>{isHindi ? 'हवा की स्थिति:' : 'Wind Status:'}</b> {weather.windSpeed} km/h (Gusts {weather.windGusts} km/h)</p>
                  <p>• <b>{isHindi ? 'पत्तियों की नमी:' : 'Leaf Moisture:'}</b> {weather.humidity}% {isHindi ? 'आर्द्रता' : 'Relative Humidity'}</p>
                </div>
              </div>

              {/* Detailed Irrigation */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                    💧 {isHindi ? 'खेत सिंचाई व जल प्रबंधन (Irrigation)' : 'Field Irrigation & Water Management'}
                  </h5>
                  {(() => {
                    const b = getStatusBadge(weather.advisories.irrigation.status);
                    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${b.bg}`}>{b.icon} {b.label}</span>;
                  })()}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {isHindi ? weather.advisories.irrigation.textHi : weather.advisories.irrigation.text}
                </p>
                <div className="text-[11px] text-slate-400 bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <p>• <b>{isHindi ? 'बारिश की संभावना:' : 'Rain Probability:'}</b> {weather.dailyForecast[0]?.rainProb || 0}%</p>
                  <p>• <b>{isHindi ? 'तापमान वाष्पीकरण:' : 'Heat Evaporation:'}</b> {weather.temperature}°C (Apparent {weather.apparentTemperature}°C)</p>
                </div>
              </div>

              {/* Detailed Harvesting */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                    🌾 {isHindi ? 'फसल कटाई व अनाज सुखाना (Harvesting)' : 'Crop Harvesting & Grain Sun-Drying'}
                  </h5>
                  {(() => {
                    const b = getStatusBadge(weather.advisories.harvesting.status);
                    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${b.bg}`}>{b.icon} {b.label}</span>;
                  })()}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {isHindi ? weather.advisories.harvesting.textHi : weather.advisories.harvesting.text}
                </p>
                <div className="text-[11px] text-slate-400 bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <p>• <b>{isHindi ? 'धूप की तीव्रता:' : 'UV Solar Power:'}</b> Index {weather.uvIndex} / 11</p>
                  <p>• <b>{isHindi ? 'बादल आवरण:' : 'Cloud Cover:'}</b> {weather.cloudCover}%</p>
                </div>
              </div>

              {/* Detailed Labor Shift */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                    👨‍🌾 {isHindi ? 'सहयोगी लेबर व मशीनरी शिफ्ट (Labor & Machinery)' : 'Labor Schedule & Tractor Shift'}
                  </h5>
                  {(() => {
                    const b = getStatusBadge(weather.advisories.labor.status);
                    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${b.bg}`}>{b.icon} {b.label}</span>;
                  })()}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {isHindi ? weather.advisories.labor.textHi : weather.advisories.labor.text}
                </p>
                <div className="text-[11px] text-slate-400 bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <p>• <b>{isHindi ? 'कार्य समय सिफारिश:' : 'Recommended Shift:'}</b> {weather.temperature >= 38 ? '06:00 AM – 11:00 AM & 04:00 PM – 07:00 PM' : 'Full Day 06:00 AM – 06:00 PM'}</p>
                </div>
              </div>

            </div>

            {/* Link to District Agromet Advisory & Alerts */}
            {weather.districtAdvisory && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-emerald-950/70 to-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>{isHindi ? `${weather.district} जिला कृषि मौसम विज्ञान बुलेटिन` : `${weather.district} District Agromet Bulletin`}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">
                        {weather.districtAdvisory.bulletinNumber}
                      </span>
                    </h5>
                    <p className="text-xs text-slate-300">
                      {isHindi ? 'विशिष्ट फसलों (गेहूं, सरसों, दलहन) की वृद्धि अवस्था, कीट जोखिम और पशुधन बुलेटिन देखें।' : 'View growth stage, pest surveillance, and livestock care for major district crops.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('district_bulletin')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm self-start sm:self-center"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'जिला बुलेटिन व अलर्ट खोलें' : 'Open District Bulletin & Alerts'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Location Search Modal Popover */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#111b21] border border-[#222d34] rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isHindi ? 'स्थान खोजें (भारत व विश्व)' : 'Search Location or Mandi'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isHindi ? 'तहसील, जिला, गाँव या कृषि मंडी का नाम लिखें' : 'Enter Tehsil, District, Village or Mandi'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={isHindi ? 'उदा. Barabanki, Lucknow, Varanasi, Karnal...' : 'e.g. Barabanki, Lucknow, Varanasi, Karnal...'}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-[#202c33] text-slate-100 placeholder-[#8696a0] rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884] border border-transparent focus:border-[#00a884]/40"
              />
            </div>

            {/* Quick Suggestions / Indian Farming Hubs */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400">
                {isHindi ? 'प्रमुख कृषि केंद्र / सुझाव:' : 'Popular Agricultural Hubs:'}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Barabanki', 'Lucknow', 'Varanasi', 'Karnal', 'Ludhiana', 'Indore', 'Nagpur'].map((city) => (
                  <button
                    key={city}
                    onClick={() => handleSearchChange(city)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium border border-white/10 cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results List */}
            <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-[#222d34]/60 pr-1">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>{isHindi ? 'स्थान खोजा जा रहा है...' : 'Searching location in India...'}</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 text-left hover:bg-[#202c33] rounded-xl transition-colors flex items-center justify-between gap-2 group"
                  >
                    <div 
                      onClick={() => handleSelectLocation(item)}
                      className="space-y-0.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.displayName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const geoResult: GeoLocationResult = {
                            latitude: item.latitude,
                            longitude: item.longitude,
                            accuracy: 100,
                            source: 'saved_profile' as any,
                            village: item.name,
                            district: item.admin1 || item.name,
                            state: item.admin1 || 'State',
                            country: item.country || 'India',
                            address: item.displayName,
                            timestamp: Date.now(),
                          };
                          handleSaveAsFarmLocation(geoResult);
                          handleSelectLocation(item);
                        }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title={isHindi ? 'सहेजे गए खेत के रूप में सुरक्षित करें' : 'Save as primary farm'}
                      >
                        <Bookmark className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">{isHindi ? 'खेत बनाएं' : 'Save as Farm'}</span>
                      </button>

                      <button
                        onClick={() => handleSelectLocation(item)}
                        className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isHindi ? 'कोई स्थान नहीं मिला। कृपया वर्तनी जांचें।' : 'No location found. Please check spelling.'}
                </div>
              ) : null}
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  fetchWeatherForSavedFarm();
                }}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Home className="w-4 h-4" />
                <span>{isHindi ? 'सहेजे गए खेत का मौसम' : 'My Saved Farm'}</span>
              </button>

              <button
                onClick={() => {
                  setShowSearchModal(false);
                  fetchWeatherForDeviceGps();
                }}
                className="py-2.5 bg-[#202c33] hover:bg-[#2a3942] text-slate-200 font-black text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Crosshair className="w-4 h-4 text-teal-400" />
                <span>{isHindi ? 'डिवाइस लाइव जीपीएस' : 'Live Device GPS'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
