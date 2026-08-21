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
  X
} from 'lucide-react';
import { WeatherData, fetchLiveWeather } from '../lib/weatherService';
import { getDeviceLocation, searchLocations, GeoLocationResult } from '../lib/locationService';
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

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoLocationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'hourly' | '7day' | 'advisory'>('overview');

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

  // Auto-detect location & load live weather on component mount
  useEffect(() => {
    autoDetectAndFetchWeather();
  }, []);

  const autoDetectAndFetchWeather = async (forceFreshGps = false) => {
    setIsLoading(true);
    if (forceFreshGps) {
      setIsDetectingLocation(true);
    }

    try {
      // 1. Detect Real Device Location (GPS with automatic IP fallback)
      const geo = await getDeviceLocation({ forceFresh: forceFreshGps });
      setCurrentLocation(geo);

      // 2. Fetch Accurate Meteorological Data
      const weatherData = await fetchLiveWeather(geo.latitude, geo.longitude, {
        village: geo.village || (currentUser?.village ?? 'Local Farm Field'),
        district: geo.district || (currentUser?.district ?? 'Barabanki'),
        state: geo.state || (currentUser?.state ?? 'Uttar Pradesh'),
        country: geo.country || 'India',
        source: geo.source,
        accuracy: geo.accuracy,
      });

      setWeather(weatherData);
    } catch (err) {
      console.warn('Weather auto-detect error:', err);
    } finally {
      setIsLoading(false);
      setIsDetectingLocation(false);
    }
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

    const textToSpeak = isHindi
      ? `स्थान ${weather.locationName}, ${weather.district}। वर्तमान तापमान ${weather.temperature} डिग्री सेल्सियस है और मौसम ${weather.conditionTextHi} है। हवा की गति ${weather.windSpeed} किलोमीटर प्रति घंटा है। कीटनाशक छिड़काव की सलाह: ${weather.advisories.spraying.textHi}। सिंचाई सलाह: ${weather.advisories.irrigation.textHi}।`
      : `Weather update for ${weather.locationName}, ${weather.district}. Temperature is ${weather.temperature} degrees Celsius with ${weather.conditionText}. Humidity is ${weather.humidity} percent, wind speed ${weather.windSpeed} kilometers per hour. Pesticide advisory: ${weather.advisories.spraying.text}. Irrigation advice: ${weather.advisories.irrigation.text}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Ask Krishak A.I with Contextual Weather
  const handleAskAiWithWeather = () => {
    if (!weather) return;
    const prompt = isHindi
      ? `मेरी वर्तमान लोकेशन (${weather.locationName}, ${weather.district}) में आज का तापमान ${weather.temperature}°C, मौसम "${weather.conditionTextHi}", आर्द्रता ${weather.humidity}%, बारिश की संभावना ${weather.dailyForecast[0]?.rainProb || 0}%, और हवा ${weather.windSpeed} km/h है। आज कीटनाशक छिड़काव, सिंचाई व मजदूरी के लिए विस्तृत कृषि सलाह दें।`
      : `Farm location: ${weather.locationName}, ${weather.district}. Current temp ${weather.temperature}°C (${weather.conditionText}), humidity ${weather.humidity}%, rain prob ${weather.dailyForecast[0]?.rainProb || 0}%, wind ${weather.windSpeed} km/h. Please provide practical agronomy advice for spraying, irrigation and labor planning.`;

    if (onAskAiWithPrompt) {
      onAskAiWithPrompt(prompt);
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
            <Radio className="w-7 h-7 text-emerald-400 animate-spin-slow" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-black text-white">
            {isHindi ? 'डिवाइस लोकेशन स्वतः पहचानी जा रही है...' : 'Auto-Detecting Device Geolocation...'}
          </p>
          <p className="text-xs text-slate-400">
            {isHindi ? 'मौसम उपग्रह से 7-दिवसीय सटीक पूर्वानुमान डाउनलोड हो रहा है' : 'Connecting to Open-Meteo Doppler Satellite Radar'}
          </p>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-gradient-to-br from-slate-950 via-[#0a1a15] to-[#0c1317] relative text-white">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Strip with GPS Status, Search & Action Buttons */}
      <div className="p-4 sm:p-5 border-b border-emerald-500/20 bg-slate-900/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 relative z-10">
        
        {/* Location & GPS Indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md border border-emerald-400/40 shrink-0">
            <CloudSun className="w-6 h-6 text-slate-950" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5 truncate">
                {isHindi ? 'सटीक मौसम पूर्वानुमान व कृषि सलाह' : 'Live Precision Weather & Crop Advisory'}
              </h3>
              
              {/* Location Source Tag */}
              <span className={`px-2 py-0.5 border text-[10px] font-black rounded-full uppercase flex items-center gap-1 ${
                weather.accuracySource === 'gps'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
              }`}>
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                {weather.accuracySource === 'gps' 
                  ? (isHindi ? 'जीपीएस ऑटो-डिटेक्ट' : 'Device GPS Auto') 
                  : (isHindi ? 'नेटवर्क लोकेशन' : 'Auto Network IP')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-emerald-300 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{weather.locationName}, {weather.district}, {weather.state}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                • {isHindi ? `अपडेट: ${weather.lastUpdated}` : `Updated ${weather.lastUpdated}`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: GPS Refresh, City Search, TTS, Ask AI */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          {/* GPS Auto-Detect Button */}
          <button
            onClick={() => autoDetectAndFetchWeather(true)}
            disabled={isDetectingLocation}
            className="px-3 py-1.5 bg-[#182a22] hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Auto-Detect Exact Device GPS Coordinates"
          >
            <Crosshair className={`w-3.5 h-3.5 text-emerald-400 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isDetectingLocation 
                ? (isHindi ? 'लोकेशन ट्रैक...' : 'Detecting GPS...') 
                : (isHindi ? 'जीपीएस रिफ्रेश' : 'GPS Auto-Detect')}
            </span>
          </button>

          {/* Search Other Cities / Mandis */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Search Other Indian Villages or Mandis"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{isHindi ? 'शहर / मंडी बदलें' : 'Search City'}</span>
          </button>

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

      {/* Navigation Subtabs: Overview / 24h Hourly / 7-Day Outlook / Farming Advisory */}
      <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-emerald-500/10 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-10 bg-slate-950/40">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {isHindi ? '🌾 मुख्य मौसम अवलोकन' : 'Overview'}
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
          {isHindi ? '24-घंटे का टाइमलाइन' : '24-Hour Timeline'}
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
          {isHindi ? 'कृषि कार्य निर्णय (Advisory)' : 'Farm Deciders'}
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
              <div className="md:col-span-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-slate-900/90 to-teal-950/90 border border-emerald-500/30 flex flex-col justify-between gap-4 shadow-xl">
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
            <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-[#222d34]/60">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>{isHindi ? 'स्थान खोजा जा रहा है...' : 'Searching...'}</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectLocation(item)}
                    className="p-3 text-left hover:bg-[#202c33] rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.displayName}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isHindi ? 'कोई स्थान नहीं मिला। वर्तनी जांचें।' : 'No location found. Please check spelling.'}
                </div>
              ) : null}
            </div>

            {/* Reset to Device GPS Button */}
            <button
              onClick={() => {
                setShowSearchModal(false);
                autoDetectAndFetchWeather(true);
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Crosshair className="w-4 h-4" />
              <span>{isHindi ? 'वर्तमान डिवाइस जीपीएस का उपयोग करें' : 'Reset to Device Live GPS'}</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
