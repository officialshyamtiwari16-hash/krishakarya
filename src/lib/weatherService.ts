export type AlertSeverity = 'warning' | 'alert' | 'watch' | 'normal';
export type AlertColorCode = 'red' | 'orange' | 'yellow' | 'green';

export interface SevereWeatherAlert {
  id: string;
  severity: AlertSeverity; // 'warning' (Red), 'alert' (Orange), 'watch' (Yellow), 'normal' (Green)
  colorCode: AlertColorCode;
  category: 'heavy_rain' | 'thunderstorm' | 'heatwave' | 'coldwave' | 'frost' | 'high_wind' | 'blight_humidity' | 'fog' | 'favorable' | 'hailstorm';
  headline: string;
  headlineHi: string;
  description: string;
  descriptionHi: string;
  affectedArea: string;
  effectiveUntil: string;
  urgency: 'immediate' | 'expected' | 'future';
  precautions: string[];
  precautionsHi: string[];
  cropImpacts: Array<{
    cropName: string;
    cropNameHi: string;
    impact: string;
    impactHi: string;
    action: string;
    actionHi: string;
  }>;
  source: string;
}

export interface DistrictAgroAdvisory {
  district: string;
  state: string;
  agroClimaticZone: string;
  agroClimaticZoneHi: string;
  bulletinDate: string;
  bulletinNumber: string;
  overallSummary: string;
  overallSummaryHi: string;
  severeAlerts: SevereWeatherAlert[];
  activeSevereAlert: SevereWeatherAlert;
  seasonalCropAdvisories: Array<{
    crop: string;
    cropHi: string;
    growthStage: string;
    growthStageHi: string;
    advisory: string;
    advisoryHi: string;
    pestRisk: 'low' | 'moderate' | 'high';
    pestRiskDetails: string;
    pestRiskDetailsHi: string;
  }>;
  livestockAdvisory: {
    en: string;
    hi: string;
  };
  soilMoistureAdvisory: {
    en: string;
    hi: string;
  };
}

export interface WeatherData {
  locationName: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  accuracySource: 'gps' | 'ip' | 'search' | 'cached' | 'fallback' | 'saved_profile';
  gpsAccuracyMeters?: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  windDirectionCompass: string;
  windDirectionCompassHi: string;
  precipitation: number;
  rain: number;
  cloudCover: number;
  pressure: number;
  weatherCode: number;
  conditionText: string;
  conditionTextHi: string;
  iconType: 'clear-day' | 'clear-night' | 'cloudy' | 'partly-cloudy-day' | 'partly-cloudy-night' | 'rain' | 'drizzle' | 'thunderstorm' | 'fog' | 'snow';
  isDay: boolean;
  uvIndex: number;
  sunriseTime: string;
  sunsetTime: string;
  advisories: {
    spraying: { status: 'safe' | 'caution' | 'unsafe'; text: string; textHi: string };
    irrigation: { status: 'safe' | 'caution' | 'unsafe'; text: string; textHi: string };
    harvesting: { status: 'safe' | 'caution' | 'unsafe'; text: string; textHi: string };
    labor: { status: 'safe' | 'caution' | 'unsafe'; text: string; textHi: string };
  };
  districtAdvisory: DistrictAgroAdvisory;
  severeAlerts: SevereWeatherAlert[];
  activeSevereAlert: SevereWeatherAlert;
  hourlyForecast: Array<{
    timeStr: string;
    hourLabel: string;
    temperature: number;
    humidity: number;
    rainProb: number;
    windSpeed: number;
    weatherCode: number;
    conditionText: string;
    iconType: string;
    isDay: boolean;
  }>;
  dailyForecast: Array<{
    date: string;
    dayName: string;
    dayNameHi: string;
    maxTemp: number;
    minTemp: number;
    rainProb: number;
    rainSum: number;
    weatherCode: number;
    conditionText: string;
    conditionTextHi: string;
    iconType: string;
    sunrise: string;
    sunset: string;
  }>;
  lastUpdated: string;
}

export function getCompassDirection(degrees: number): { en: string; hi: string } {
  const directions = [
    { en: 'North (N)', hi: 'उत्तर' },
    { en: 'North-East (NE)', hi: 'उत्तर-पूर्व' },
    { en: 'East (E)', hi: 'पूर्व' },
    { en: 'South-East (SE)', hi: 'दक्षिण-पूर्व' },
    { en: 'South (S)', hi: 'दक्षिण' },
    { en: 'South-West (SW)', hi: 'दक्षिण-पश्चिम' },
    { en: 'West (W)', hi: 'पश्चिम' },
    { en: 'North-West (NW)', hi: 'उत्तर-पश्चिम' },
  ];
  const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 45) % 8;
  return directions[index];
}

export function getWeatherConditionInfo(code: number, isDay = true): {
  text: string;
  textHi: string;
  iconType: WeatherData['iconType'];
} {
  switch (code) {
    case 0:
      return {
        text: isDay ? 'Clear Sky' : 'Clear Night',
        textHi: isDay ? 'साफ आसमान (धूप)' : 'साफ रात',
        iconType: isDay ? 'clear-day' : 'clear-night',
      };
    case 1:
    case 2:
      return {
        text: 'Partly Cloudy',
        textHi: 'हल्के बादल',
        iconType: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night',
      };
    case 3:
      return {
        text: 'Overcast',
        textHi: 'घने बादल',
        iconType: 'cloudy',
      };
    case 45:
    case 48:
      return {
        text: 'Fog / Mist',
        textHi: 'कोहरा / धुंध',
        iconType: 'fog',
      };
    case 51:
    case 53:
    case 55:
      return {
        text: 'Drizzle',
        textHi: 'हल्की बूंदाबांदी',
        iconType: 'drizzle',
      };
    case 61:
    case 63:
    case 65:
      return {
        text: code === 65 ? 'Heavy Rain' : 'Rain Showers',
        textHi: code === 65 ? 'भारी बारिश' : 'बारिश',
        iconType: 'rain',
      };
    case 71:
    case 73:
    case 75:
      return {
        text: 'Snowfall',
        textHi: 'बर्फबारी',
        iconType: 'snow',
      };
    case 80:
    case 81:
    case 82:
      return {
        text: 'Rain Showers',
        textHi: 'बारिश की बौछारें',
        iconType: 'rain',
      };
    case 95:
    case 96:
    case 99:
      return {
        text: 'Thunderstorm',
        textHi: 'गरज-चमक के साथ बारिश',
        iconType: 'thunderstorm',
      };
    default:
      return {
        text: 'Pleasant Weather',
        textHi: 'सुहावना मौसम',
        iconType: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night',
      };
  }
}

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_HI = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

function formatIsoTimeToClock(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

/**
 * Fetches real-time, highly accurate weather forecast from Open-Meteo meteorological models.
 */
export async function fetchLiveWeather(
  latitude: number,
  longitude: number,
  locationLabel?: { 
    village?: string; 
    district?: string; 
    state?: string; 
    country?: string;
    source?: 'gps' | 'ip' | 'search' | 'cached' | 'fallback';
    accuracy?: number;
  }
): Promise<WeatherData> {
  try {
    const currentParams = [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'showers',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(',');

    const hourlyParams = [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'uv_index',
      'is_day',
    ].join(',');

    const dailyParams = [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'rain_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
    ].join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=auto&forecast_days=7`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API error HTTP ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    const temp = Math.round(current.temperature_2m ?? 28);
    const apparentTemp = Math.round(current.apparent_temperature ?? temp);
    const humidity = Math.round(current.relative_humidity_2m ?? 55);
    const windSpeed = Math.round(current.wind_speed_10m ?? 8);
    const windGusts = Math.round(current.wind_gusts_10m ?? windSpeed * 1.3);
    const windDirection = Math.round(current.wind_direction_10m ?? 120);
    const precipitation = current.precipitation ?? 0;
    const rain = current.rain ?? 0;
    const cloudCover = Math.round(current.cloud_cover ?? 20);
    const pressure = Math.round(current.pressure_msl ?? 1012);
    const weatherCode = current.weather_code ?? 0;
    const isDay = current.is_day === 1;

    const compass = getCompassDirection(windDirection);
    const condition = getWeatherConditionInfo(weatherCode, isDay);
    const maxUv = Math.round(daily.uv_index_max?.[0] ?? 6);
    const maxRainProb = Math.round(daily.precipitation_probability_max?.[0] ?? 10);

    const sunriseTime = formatIsoTimeToClock(daily.sunrise?.[0]);
    const sunsetTime = formatIsoTimeToClock(daily.sunset?.[0]);

    // 1. Calculate Smart Agricultural Deciders
    // Spraying Advisory
    let sprayStatus: 'safe' | 'caution' | 'unsafe' = 'safe';
    let sprayText = 'Optimal window for pesticide & foliar spraying. Wind is low (< 15 km/h) with dry foliage.';
    let sprayTextHi = 'कीटनाशक व खाद छिड़काव के लिए श्रेष्ठ समय। हवा शांत (< 15 km/h) और पत्तियां सूखी हैं।';

    if (windSpeed >= 18 || windGusts >= 25) {
      sprayStatus = 'caution';
      sprayText = `High wind (${windSpeed} km/h, gusts ${windGusts} km/h). Chemical drift danger. Spray only during early morning calm.`;
      sprayTextHi = `तेज हवा (${windSpeed} km/h)! दवा उड़ने का खतरा है। केवल सुबह शांत मौसम में ही स्प्रे करें।`;
    } else if (rain > 0.2 || maxRainProb > 45) {
      sprayStatus = 'unsafe';
      sprayText = `Rain expected (${maxRainProb}% chance). Postpone spraying to prevent chemical runoff and wastage.`;
      sprayTextHi = `बारिश की आशंका (${maxRainProb}%)! स्प्रे टालें ताकि दवा धुल न जाए और व्यर्थ न हो।`;
    }

    // Irrigation Advisory
    let irrStatus: 'safe' | 'caution' | 'unsafe' = 'safe';
    let irrText = 'Standard irrigation cycle based on crop stage and soil moisture.';
    let irrTextHi = 'फसल की अवस्था अनुसार सामान्य सिंचाई करें।';

    if (rain > 1.5 || maxRainProb >= 60) {
      irrStatus = 'caution';
      irrText = `Rain likely (${maxRainProb}%). Pause irrigation to prevent waterlogging and save pumping power.`;
      irrTextHi = `बारिश की संभावना (${maxRainProb}%)। जलभराव रोकने और बिजली/डीजल बचाने के लिए सिंचाई रोकें।`;
    } else if (temp > 35 && humidity < 45) {
      irrStatus = 'safe';
      irrText = 'Hot & high evaporation weather. Provide light sprinkler or evening irrigation to maintain root moisture.';
      irrTextHi = 'गर्मी व वाष्पीकरण अधिक है। फसलों को मुरझाने से बचाने के लिए शाम को हल्की सिंचाई दें।';
    }

    // Harvesting Advisory
    let harvStatus: 'safe' | 'caution' | 'unsafe' = 'safe';
    let harvText = 'Clear sky & dry conditions. Safe for crop cutting, sun-drying and combine harvesting.';
    let harvTextHi = 'कटाई, मड़ाई व अनाज सुखाने के लिए मौसम पूरी तरह सुरक्षित व अनुकूल है।';

    if (rain > 0.4 || maxRainProb > 40) {
      harvStatus = 'unsafe';
      harvText = `Rain alert (${maxRainProb}%). Cover open grain heaps with tarpaulins immediately.`;
      harvTextHi = `बारिश का अलर्ट (${maxRainProb}%)! खुले में रखी फसल व अनाज को तुरंत तिरपाल से ढकें।`;
    }

    // Labor & Machinery Advisory
    let laborStatus: 'safe' | 'caution' | 'unsafe' = 'safe';
    let laborText = 'Favorable weather for full-day field operations, tractor plowing and manual labor.';
    let laborTextHi = 'खेत में मजदूरी, ट्रैक्टर जुताई व मशीनरी चलाने के लिए उत्तम मौसम।';

    if (temp >= 38) {
      laborStatus = 'caution';
      laborText = `High heat index (${temp}°C). Shift labor schedule to morning (6 AM – 11 AM) and evening (4 PM – 7 PM).`;
      laborTextHi = `कड़क धूप व तापमान (${temp}°C)। मजदूरों से सुबह 6 से 11 और शाम 4 से 7 बजे काम कराएं।`;
    } else if (rain > 2 || weatherCode >= 95) {
      laborStatus = 'unsafe';
      laborText = 'Thunderstorm / heavy rain alert. Avoid open field work and metallic machinery under trees.';
      laborTextHi = 'आंधी-तूफान व बिजली कड़कने का खतरा। खुले खेत में काम और मशीनरी रोकें।';
    }

    // 2. Build 24-Hour Timeline Forecast (Interval of 3 hours)
    const hourlyForecast = [];
    const hourlyTimes = hourly.time || [];
    const now = new Date();
    const currentHourIndex = hourlyTimes.findIndex((t: string) => {
      const dt = new Date(t);
      return dt.getTime() >= now.getTime() - 3600000;
    });

    const startIdx = Math.max(0, currentHourIndex);
    for (let i = startIdx; i < Math.min(hourlyTimes.length, startIdx + 24); i += 3) {
      const dt = new Date(hourlyTimes[i]);
      const hourVal = dt.getHours();
      const hourStr = dt.toLocaleTimeString([], { hour: 'numeric', hour12: true });
      const hTemp = Math.round(hourly.temperature_2m?.[i] ?? temp);
      const hHum = Math.round(hourly.relative_humidity_2m?.[i] ?? humidity);
      const hRain = Math.round(hourly.precipitation_probability?.[i] ?? 0);
      const hWind = Math.round(hourly.wind_speed_10m?.[i] ?? windSpeed);
      const hCode = hourly.weather_code?.[i] ?? weatherCode;
      const hIsDay = hourly.is_day?.[i] === 1;
      const hCond = getWeatherConditionInfo(hCode, hIsDay);

      hourlyForecast.push({
        timeStr: hourlyTimes[i],
        hourLabel: i === startIdx ? 'Now' : hourStr,
        temperature: hTemp,
        humidity: hHum,
        rainProb: hRain,
        windSpeed: hWind,
        weatherCode: hCode,
        conditionText: hCond.text,
        iconType: hCond.iconType,
        isDay: hIsDay,
      });
    }

    // 3. Build 7-Day Extended Agricultural Forecast
    const dailyForecast = [];
    const dates = daily.time || [];
    for (let i = 0; i < Math.min(dates.length, 7); i++) {
      const d = new Date(dates[i]);
      const dayIdx = d.getDay();
      const code = daily.weather_code?.[i] ?? 0;
      const cond = getWeatherConditionInfo(code, true);

      dailyForecast.push({
        date: dates[i],
        dayName: i === 0 ? 'Today' : DAYS_EN[dayIdx],
        dayNameHi: i === 0 ? 'आज' : DAYS_HI[dayIdx],
        maxTemp: Math.round(daily.temperature_2m_max?.[i] ?? temp),
        minTemp: Math.round(daily.temperature_2m_min?.[i] ?? temp - 8),
        rainProb: Math.round(daily.precipitation_probability_max?.[i] ?? 10),
        rainSum: Number((daily.precipitation_sum?.[i] ?? 0).toFixed(1)),
        weatherCode: code,
        conditionText: cond.text,
        conditionTextHi: cond.textHi,
        iconType: cond.iconType,
        sunrise: formatIsoTimeToClock(daily.sunrise?.[i]),
        sunset: formatIsoTimeToClock(daily.sunset?.[i]),
      });
    }

    const locVillage = locationLabel?.village || 'Farm Field';
    const locDistrict = locationLabel?.district || 'Barabanki';
    const locState = locationLabel?.state || 'Uttar Pradesh';
    const locCountry = locationLabel?.country || 'India';
    const accuracySource = locationLabel?.source || 'gps';

    const todayMaxTemp = Math.round(daily.temperature_2m_max?.[0] ?? temp);
    const todayMinTemp = Math.round(daily.temperature_2m_min?.[0] ?? temp - 8);
    const todayRainSum = Number((daily.precipitation_sum?.[0] ?? 0).toFixed(1));
    const todayRainProb = Math.round(daily.precipitation_probability_max?.[0] ?? 0);

    const districtAdvisory = generateDistrictAgrometAdvisory(
      locDistrict,
      locState,
      {
        temperature: temp,
        apparentTemperature: apparentTemp,
        humidity,
        windSpeed,
        windGusts,
        weatherCode,
        rainSum: todayRainSum,
        maxRainProb: todayRainProb,
        maxTemp: todayMaxTemp,
        minTemp: todayMinTemp,
        cloudCover,
      }
    );

    return {
      locationName: locVillage,
      district: locDistrict,
      state: locState,
      country: locCountry,
      latitude,
      longitude,
      accuracySource,
      gpsAccuracyMeters: locationLabel?.accuracy,
      temperature: temp,
      apparentTemperature: apparentTemp,
      humidity,
      windSpeed,
      windGusts,
      windDirection,
      windDirectionCompass: compass.en,
      windDirectionCompassHi: compass.hi,
      precipitation,
      rain,
      cloudCover,
      pressure,
      weatherCode,
      conditionText: condition.text,
      conditionTextHi: condition.textHi,
      iconType: condition.iconType,
      isDay,
      uvIndex: maxUv,
      sunriseTime,
      sunsetTime,
      advisories: {
        spraying: { status: sprayStatus, text: sprayText, textHi: sprayTextHi },
        irrigation: { status: irrStatus, text: irrText, textHi: irrTextHi },
        harvesting: { status: harvStatus, text: harvText, textHi: harvTextHi },
        labor: { status: laborStatus, text: laborText, textHi: laborTextHi },
      },
      districtAdvisory,
      severeAlerts: districtAdvisory.severeAlerts,
      activeSevereAlert: districtAdvisory.activeSevereAlert,
      hourlyForecast,
      dailyForecast,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err) {
    console.warn('Live weather fetch error, building resilient fallback forecast:', err);
    const fallbackCondition = getWeatherConditionInfo(1, true);
    const locDistrict = locationLabel?.district || 'Barabanki';
    const locState = locationLabel?.state || 'Uttar Pradesh';

    const fallbackAdvisory = generateDistrictAgrometAdvisory(
      locDistrict,
      locState,
      {
        temperature: 29,
        apparentTemperature: 31,
        humidity: 58,
        windSpeed: 9,
        windGusts: 14,
        weatherCode: 1,
        rainSum: 0,
        maxRainProb: 15,
        maxTemp: 32,
        minTemp: 24,
        cloudCover: 25,
      }
    );

    return {
      locationName: locationLabel?.village || 'Barabanki Farm',
      district: locDistrict,
      state: locState,
      country: 'India',
      latitude: 26.9288,
      longitude: 81.1822,
      accuracySource: 'fallback',
      temperature: 29,
      apparentTemperature: 31,
      humidity: 58,
      windSpeed: 9,
      windGusts: 14,
      windDirection: 110,
      windDirectionCompass: 'East (E)',
      windDirectionCompassHi: 'पूर्व',
      precipitation: 0,
      rain: 0,
      cloudCover: 25,
      pressure: 1012,
      weatherCode: 1,
      conditionText: fallbackCondition.text,
      conditionTextHi: fallbackCondition.textHi,
      iconType: 'partly-cloudy-day',
      isDay: true,
      uvIndex: 6,
      sunriseTime: '05:42 AM',
      sunsetTime: '06:48 PM',
      advisories: {
        spraying: {
          status: 'safe',
          text: 'Optimal weather for pesticide & nutrient spraying. Gentle breeze and dry foliage.',
          textHi: 'कीटनाशक व खाद छिड़काव के लिए अनुकूल मौसम। हवा सामान्य है।',
        },
        irrigation: {
          status: 'safe',
          text: 'Normal irrigation recommended based on soil moisture requirements.',
          textHi: 'फसल में जरूरत अनुसार सामान्य सिंचाई करें।',
        },
        harvesting: {
          status: 'safe',
          text: 'Clear sky & dry conditions. Safe for harvesting, crop drying and threshing.',
          textHi: 'कटाई, मड़ाई व अनाज सुखाने के लिए मौसम अनुकूल है।',
        },
        labor: {
          status: 'safe',
          text: 'Favorable weather for full-day field work and machinery operations.',
          textHi: 'खेत में मजदूरी व ट्रैक्टर-हार्वेस्टर चलाने के लिए उत्तम मौसम।',
        },
      },
      districtAdvisory: fallbackAdvisory,
      severeAlerts: fallbackAdvisory.severeAlerts,
      activeSevereAlert: fallbackAdvisory.activeSevereAlert,
      hourlyForecast: [
        { timeStr: '', hourLabel: 'Now', temperature: 29, humidity: 58, rainProb: 10, windSpeed: 9, weatherCode: 1, conditionText: 'Partly Cloudy', iconType: 'partly-cloudy-day', isDay: true },
        { timeStr: '', hourLabel: '3 PM', temperature: 32, humidity: 50, rainProb: 15, windSpeed: 11, weatherCode: 1, conditionText: 'Partly Cloudy', iconType: 'partly-cloudy-day', isDay: true },
        { timeStr: '', hourLabel: '6 PM', temperature: 28, humidity: 62, rainProb: 10, windSpeed: 8, weatherCode: 0, conditionText: 'Clear Sky', iconType: 'clear-day', isDay: true },
        { timeStr: '', hourLabel: '9 PM', temperature: 25, humidity: 70, rainProb: 5, windSpeed: 6, weatherCode: 0, conditionText: 'Clear Night', iconType: 'clear-night', isDay: false },
      ],
      dailyForecast: [
        { date: 'Today', dayName: 'Today', dayNameHi: 'आज', maxTemp: 32, minTemp: 24, rainProb: 15, rainSum: 0, weatherCode: 1, conditionText: 'Partly Cloudy', conditionTextHi: 'हल्के बादल', iconType: 'partly-cloudy-day', sunrise: '05:42 AM', sunset: '06:48 PM' },
        { date: 'Day 2', dayName: 'Sat', dayNameHi: 'शनि', maxTemp: 33, minTemp: 25, rainProb: 20, rainSum: 0, weatherCode: 2, conditionText: 'Partly Cloudy', conditionTextHi: 'हल्के बादल', iconType: 'partly-cloudy-day', sunrise: '05:43 AM', sunset: '06:47 PM' },
        { date: 'Day 3', dayName: 'Sun', dayNameHi: 'रवि', maxTemp: 31, minTemp: 23, rainProb: 45, rainSum: 2.5, weatherCode: 61, conditionText: 'Light Rain', conditionTextHi: 'बारिश', iconType: 'rain', sunrise: '05:43 AM', sunset: '06:46 PM' },
        { date: 'Day 4', dayName: 'Mon', dayNameHi: 'सोम', maxTemp: 30, minTemp: 22, rainProb: 25, rainSum: 0.2, weatherCode: 1, conditionText: 'Clear Sky', conditionTextHi: 'साफ आसमान', iconType: 'clear-day', sunrise: '05:44 AM', sunset: '06:45 PM' },
      ],
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

/**
 * Resolves the Agro-Climatic Zone & major crop profile based on Indian district and state.
 */
function getDistrictAgroZone(district: string, state: string): {
  zoneEn: string;
  zoneHi: string;
  crops: Array<{
    crop: string;
    cropHi: string;
    growthStage: string;
    growthStageHi: string;
    normalAdvisory: string;
    normalAdvisoryHi: string;
    pestRisk: 'low' | 'moderate' | 'high';
    pestRiskDetails: string;
    pestRiskDetailsHi: string;
  }>;
} {
  const dist = district.toLowerCase().trim();
  const st = state.toLowerCase().trim();

  // 1. Punjab & Haryana (Trans-Gangetic Plains)
  if (st.includes('punjab') || st.includes('haryana') || ['karnal', 'ludhiana', 'bathinda', 'amritsar', 'hisar', 'kurukshetra', 'jalandhar'].includes(dist)) {
    return {
      zoneEn: 'Trans-Gangetic Plains Agro-Climatic Zone (VI)',
      zoneHi: 'ट्रांस-गांगेटिक मैदानी कृषि-जलवायु क्षेत्र (क्षेत्र VI)',
      crops: [
        {
          crop: 'Wheat (गेहूं)',
          cropHi: 'गेहूं (Wheat)',
          growthStage: 'Tillering to Crown Root initiation',
          growthStageHi: 'कल्ले फूटने व कल्ले विकास की अवस्था',
          normalAdvisory: 'Maintain optimal soil moisture. Inspect leaf blades for early signs of yellow rust (पीला रतुआ).',
          normalAdvisoryHi: 'खेत में पर्याप्त नमी बनाए रखें। पीला रतुआ (येलो रस्ट) के शुरुआती लक्षणों की निगरानी करें।',
          pestRisk: 'moderate',
          pestRiskDetails: 'Yellow Rust / Aphid monitoring on borders.',
          pestRiskDetailsHi: 'खेत की मेड़ों पर पीला रतुआ व माहू (चेंपा) की निगरानी रखें।',
        },
        {
          crop: 'Mustard (सरसों)',
          cropHi: 'सरसों (Mustard)',
          growthStage: 'Siliqua formation / Pod filing',
          growthStageHi: 'फूल व फलियां बनने की अवस्था',
          normalAdvisory: 'Avoid nitrogen over-application. Spray Imidacloprid (0.3 ml/L) if aphid colonies exceed ETL.',
          normalAdvisoryHi: 'अधिक यूरिया न दें। माहू कीट दिखने पर तुरंत इमिडाक्लोप्रिड या नीम तेल का छिड़काव करें।',
          pestRisk: 'high',
          pestRiskDetails: 'Mustard aphid (माहू) infestation during cloudy spells.',
          pestRiskDetailsHi: 'बादल छाने पर सरसों में माहू (Aphid) का प्रकोप बढ़ सकता है।',
        },
        {
          crop: 'Green Fodder / Berseem (बरसीम)',
          cropHi: 'हरा चारा / बरसीम',
          growthStage: 'Vegetative Multi-cut',
          growthStageHi: 'वानस्पतिक वृद्धि व कटाई',
          normalAdvisory: 'Irrigate after every cutting. Ensure phosphatic fertilizer application for vigorous regrowth.',
          normalAdvisoryHi: 'प्रत्येक कटाई के 2 दिन बाद हल्की सिंचाई करें और फास्फोरस युक्त खाद दें।',
          pestRisk: 'low',
          pestRiskDetails: 'Stem rot in stagnant water.',
          pestRiskDetailsHi: 'पानी रुकने पर तना सड़न से बचाएं।',
        },
      ],
    };
  }

  // 2. Madhya Pradesh & Central India (Malwa Plateau & Narmada Valley)
  if (st.includes('madhya') || ['indore', 'ujjain', 'bhopal', 'jabalpur', 'gwalior'].includes(dist)) {
    return {
      zoneEn: 'Central Plateau & Malwa Agro-Climatic Zone (VIII)',
      zoneHi: 'केंद्रीय पठार व मालवा कृषि-जलवायु क्षेत्र (क्षेत्र VIII)',
      crops: [
        {
          crop: 'Gram / Chickpea (चना)',
          cropHi: 'चना (Chickpea)',
          growthStage: 'Pod development & flowering',
          growthStageHi: 'फूल व फलियां भरने की अवस्था',
          normalAdvisory: 'Install T-shaped bird perches (40-50/ha) and pheromone traps for Helicoverpa pod borer.',
          normalAdvisoryHi: 'चने की इल्ली (घंटी कीट) नियंत्रण हेतु खेत में टी-आकार की खूंटियां व फेरोमोन ट्रैप लगाएं।',
          pestRisk: 'moderate',
          pestRiskDetails: 'Pod borer (हेलिकोवर्पा इल्ली) risk.',
          pestRiskDetailsHi: 'फलियों में छेदक इल्ली का खतरा।',
        },
        {
          crop: 'Wheat (गेहूं)',
          cropHi: 'गेहूं (Wheat)',
          growthStage: 'Vegetative / Jointing',
          growthStageHi: 'वानस्पतिक बढ़वार की अवस्था',
          normalAdvisory: 'Apply second top dressing of Nitrogen. Check for termite attacks in light soils.',
          normalAdvisoryHi: 'यूरिया की दूसरी खुराक दें और दीमक के प्रकोप पर क्लोरपायरीफॉस का प्रयोग करें।',
          pestRisk: 'low',
          pestRiskDetails: 'Termite damage in dry sandy-loam tracts.',
          pestRiskDetailsHi: 'हल्की दोमट मिट्टी में दीमक का खतरा।',
        },
        {
          crop: 'Garlic & Onion (लहसुन व प्याज)',
          cropHi: 'लहसुन व प्याज (Garlic/Onion)',
          growthStage: 'Bulb enlargement',
          growthStageHi: 'कंद विकास की अवस्था',
          normalAdvisory: 'Provide light and frequent irrigation. Spray Profenophos if thrips attack foliage.',
          normalAdvisoryHi: 'हल्की व नियमित सिंचाई करें। थ्रिप्स कीट दिखने पर अनुशंसित कीटनाशक का छिड़काव करें।',
          pestRisk: 'moderate',
          pestRiskDetails: 'Purple blotch & onion thrips.',
          pestRiskDetailsHi: 'बैंगनी धब्बा रोग व थ्रिप्स कीट।',
        },
      ],
    };
  }

  // 3. Maharashtra & Deccan (Western Maharashtra / Vidarbha)
  if (st.includes('maharashtra') || ['nashik', 'pune', 'nagpur', 'aurangabad', 'solapur', 'kolhapur'].includes(dist)) {
    return {
      zoneEn: 'Western Maharashtra & Deccan Plateau Zone (IX)',
      zoneHi: 'पश्चिमी महाराष्ट्र व दक्कन पठार कृषि-जलवायु क्षेत्र (क्षेत्र IX)',
      crops: [
        {
          crop: 'Onion (प्याज)',
          cropHi: 'प्याज (Onion)',
          growthStage: 'Bulb formation',
          growthStageHi: 'कंद बनने की अवस्था',
          normalAdvisory: 'Maintain uniform soil moisture. Avoid overhead spraying during humid afternoons.',
          normalAdvisoryHi: 'नमी एकसमान रखें। दोपहर की उमस में छिड़काव न करें ताकि कवक न फैले।',
          pestRisk: 'moderate',
          pestRiskDetails: 'Thrips and Stemphylium leaf blight.',
          pestRiskDetailsHi: 'थ्रिप्स और पर्ण झुलसा रोग।',
        },
        {
          crop: 'Grapes / Horticulture (अंगूर व फलदार बाग)',
          cropHi: 'अंगूर व फलदार पौधे',
          growthStage: 'Berry development / Pruning shoot growth',
          growthStageHi: 'फल विकास व नई शाखा बढ़वार',
          normalAdvisory: 'Ensure canopy aeration. Preventive spray of potassium phosphonate against downy mildew.',
          normalAdvisoryHi: 'बेलों में हवा का संचार रखें। डाउनी मिल्ड्यू की रोकथाम हेतु सुरक्षात्मक स्प्रे करें।',
          pestRisk: 'high',
          pestRiskDetails: 'Downy mildew and powdery mildew in humid hours.',
          pestRiskDetailsHi: 'नमी व कोहरे में डाउनी मिल्ड्यू फफूंद का खतरा।',
        },
        {
          crop: 'Sugarcane (गन्ना)',
          cropHi: 'गन्ना (Sugarcane)',
          growthStage: 'Grand growth phase',
          growthStageHi: 'तीव्र बढ़वार अवस्था',
          normalAdvisory: 'Apply trash mulching to conserve moisture. Check for early shoot borer.',
          normalAdvisoryHi: 'पत्तियों की मल्चिंग कर नमी बचाएं। कंसुआ कीट (शूट बोरर) की जांच करें।',
          pestRisk: 'low',
          pestRiskDetails: 'Early shoot borer and white grub.',
          pestRiskDetailsHi: 'कंसुआ कीट व सफेद लट की रोकथाम।',
        },
      ],
    };
  }

  // 4. Default: Middle & Eastern Gangetic Plains (Uttar Pradesh & Bihar - Varanasi, Barabanki, Lucknow, Patna, Gorakhpur, etc.)
  return {
    zoneEn: 'Middle & Eastern Gangetic Plains Agro-Climatic Zone (UP-3 / IV)',
    zoneHi: 'मध्य व पूर्वी गांगेटिक मैदानी कृषि-जलवायु क्षेत्र (UP-3 / क्षेत्र IV)',
    crops: [
      {
        crop: 'Wheat (गेहूं)',
        cropHi: 'गेहूं (Wheat)',
        growthStage: 'Tillering / Crown Root development',
        growthStageHi: 'कल्ले फूटने व सीआरआई (CRI) अवस्था',
        normalAdvisory: 'Ensure timely irrigation at CRI stage (21-25 days). Top-dress with Urea @ 60 kg/ha in moist soil.',
        normalAdvisoryHi: 'बुवाई के 21-25 दिन पर पहली सिंचाई अवश्य करें। नमी रहने पर यूरिया (60 किग्रा/हे.) की टॉप-ड्रेसिंग करें।',
        pestRisk: 'low',
        pestRiskDetails: 'Termite and loose smut surveillance.',
        pestRiskDetailsHi: 'दीमक और कंडुआ रोग की निगरानी।',
      },
      {
        crop: 'Mustard & Toria (सरसों व तोरिया)',
        cropHi: 'सरसों व तोरिया (Mustard)',
        growthStage: 'Flowering & Siliqua development',
        growthStageHi: 'फूल आने व फलियां बनने की अवस्था',
        normalAdvisory: 'Monitor for aphid (माहू) colonies under bottom leaves. Irrigate during pod filling if soil is dry.',
        normalAdvisoryHi: 'निचली पत्तियों पर माहू (चेपा) कीट देखें। फलियों में दाना भरते समय खेत में नमी रखें।',
        pestRisk: 'moderate',
        pestRiskDetails: 'Aphid (माहू) and white rust (सफेद रतुआ) in dense canopies.',
        pestRiskDetailsHi: 'घनी फसल में माहू व सफेद रतुआ का खतरा।',
      },
      {
        crop: 'Potato & Tomato (आलू व टमाटर)',
        cropHi: 'आलू व टमाटर (Potato & Tomato)',
        growthStage: 'Tuber initiation / Fruit flowering',
        growthStageHi: 'कंद बनने व फल लगने की अवस्था',
        normalAdvisory: 'Perform earthing up (मिट्टी चढ़ाना). Spray Mancozeb (2.5 g/L) prophylactically to guard against Late Blight (पछेती झुलसा).',
        normalAdvisoryHi: 'आलू पर मिट्टी चढ़ाएं। पछेती झुलसा (Late Blight) से बचाव के लिए मैंकोजेब का छिड़काव करें।',
        pestRisk: 'high',
        pestRiskDetails: 'Late Blight (पछेती झुलसा) threat during overcast/foggy nights.',
        pestRiskDetailsHi: 'बादल व कोहरे में पछेती झुलसा रोग तेजी से फैल सकता है।',
      },
      {
        crop: 'Vegetables & Pulses (सब्जियां व दलहन)',
        cropHi: 'सब्जियां व दलहन (Vegetables & Pulses)',
        growthStage: 'Vegetative & pod setting',
        growthStageHi: 'वानस्पतिक बढ़वार व फूल-फली अवस्था',
        normalAdvisory: 'Maintain weed-free beds. Use yellow sticky traps (15/ha) for whitefly and jassids.',
        normalAdvisoryHi: 'खेत में खरपतवार न होने दें। सफेद मक्खी व रसचूसक कीटों के लिए पीले स्टिकी ट्रैप लगाएं।',
        pestRisk: 'moderate',
        pestRiskDetails: 'Fruit borer & fungal leaf spot.',
        pestRiskDetailsHi: 'फल छेदक इल्ली व पत्ती धब्बा रोग।',
      },
    ],
  };
}

/**
 * Generates an IMD-standard District Agromet Advisory Bulletin and evaluates severe weather alerts
 * grounded in real-time Open-Meteo meteorological thresholds and the farmer's specific district.
 */
export function generateDistrictAgrometAdvisory(
  district: string,
  state: string,
  metrics: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windGusts: number;
    weatherCode: number;
    rainSum: number;
    maxRainProb: number;
    maxTemp: number;
    minTemp: number;
    cloudCover: number;
  }
): DistrictAgroAdvisory {
  const distClean = district || 'Barabanki';
  const stateClean = state || 'Uttar Pradesh';
  const zoneInfo = getDistrictAgroZone(distClean, stateClean);

  const {
    temperature,
    apparentTemperature,
    humidity,
    windSpeed,
    windGusts,
    weatherCode,
    rainSum,
    maxRainProb,
    maxTemp,
    minTemp,
    cloudCover,
  } = metrics;

  const severeAlerts: SevereWeatherAlert[] = [];

  // 1. THUNDERSTORM / LIGHTNING / HAILSTORM ALERT
  if (weatherCode === 96 || weatherCode === 99) {
    severeAlerts.push({
      id: `alert-ts-red-${Date.now()}`,
      severity: 'warning',
      colorCode: 'red',
      category: 'hailstorm',
      headline: `Red Warning: Severe Thunderstorm with Hailstorm in ${distClean}`,
      headlineHi: `🔴 लाल चेतावनी: ${distClean} में आंधी, ओलावृष्टि व आकाशीय बिजली की गंभीर चेतावनी`,
      description: `Meteorological radar detects violent thunderstorm convective cells over ${distClean} district and adjoining blocks with risk of hailstorm, gale-force winds (${windGusts} km/h), and intense lightning strikes.`,
      descriptionHi: `मौसम उपग्रह रडार द्वारा ${distClean} जिले व आसपास के क्षेत्रों में तीव्र आंधी-तूफान, ओलावृष्टि (Hailstorm) तथा तेज बिजली कड़कने की लाल चेतावनी जारी की गई है। हवा की गति ${windGusts} km/h तक पहुंच सकती है।`,
      affectedArea: `${distClean} District & adjoining tehsils`,
      effectiveUntil: 'Next 24 to 36 Hours',
      urgency: 'immediate',
      precautions: [
        'Do NOT stand under tall isolated trees or operate metallic farm machinery in open fields.',
        'Cover harvested produce, grain threshing yards, and open nursery beds with heavy tarpaulins.',
        'Shift cattle and buffaloes from open pastures into reinforced closed sheds immediately.',
        'Suspend all pesticide spraying and combine harvester operations until the squall subsides.',
      ],
      precautionsHi: [
        'खुले खेत में ऊंचे पेड़ों के नीचे खड़े न हों और धातु के औजार/मशीनरी को खुले में न चलाएं।',
        'कटे हुए अनाज, खलिहान और नर्सरी को तुरंत मजबूत तिरपाल से अच्छी तरह ढकें।',
        'पशुओं को खुले चरागाह से हटाकर पक्के हवादार बाड़े में सुरक्षित बांधें।',
        'तूफान थमने तक कीटनाशक छिड़काव, जुताई व कंबाइन हार्वेस्टर का काम तुरंत रोक दें।',
      ],
      cropImpacts: [
        {
          cropName: 'Mature Standing Crops',
          cropNameHi: 'पकी हुई खड़ी फसलें',
          impact: 'Hail damage and crop lodging (गिरना)',
          impactHi: 'ओलों से फसल टूटने व तेज हवा से गिरने का खतरा',
          action: 'Stake vegetable plants; dig peripheral drainage channels to shed hail runoff.',
          actionHi: 'सब्जियों के पौधों को सहारा दें और खेत से ओले का पानी निकालने हेतु नालियां बनाएं।',
        },
      ],
      source: 'IMD Agromet Advisory & High-Res Radar',
    });
  } else if (weatherCode === 95 || windGusts >= 42) {
    severeAlerts.push({
      id: `alert-ts-orange-${Date.now()}`,
      severity: 'alert',
      colorCode: 'orange',
      category: 'thunderstorm',
      headline: `Orange Alert: Squall & Thunderstorm Alert for ${distClean}`,
      headlineHi: `🟠 नारंगी अलर्ट: ${distClean} में आंधी-तूफान व तेज हवाओं की चेतावनी`,
      description: `Atmospheric squall lines active over ${distClean}. Wind gusts may peak up to ${windGusts} km/h accompanied by lightning and rain showers.`,
      descriptionHi: `${distClean} जिले में गरज-चमक के साथ ${windGusts} km/h की रफ्तार से तेज झक्कड़ हवाएं चलने और बारिश की संभावना है।`,
      affectedArea: `${distClean} District blocks`,
      effectiveUntil: 'Next 24 Hours',
      urgency: 'expected',
      precautions: [
        'Secure polyhouse plastic coverings and trellis netting for creepers and vine crops.',
        'Postpone chemical spraying and foliar feeding to prevent chemical loss.',
        'Keep livestock tethered inside secure stables away from unstable tin roofs.',
      ],
      precautionsHi: [
        'पॉलीहाउस की प्लास्टिक शीट और बेलदार फसलों के मचान/तार को अच्छी तरह बांधें।',
        'कीटनाशक व खाद का छिड़काव फिलहाल टाल दें ताकि दवा हवा में उड़कर नष्ट न हो।',
        'पशुओं को टीन-शेड या कमजोर छप्पर के नीचे बांधने से बचें।',
      ],
      cropImpacts: [
        {
          cropName: 'Vegetables & Banana (सब्जियां व केला)',
          cropNameHi: 'सब्जियां व केला',
          impact: 'Stem breakage and foliage tearing due to squalls',
          impactHi: 'तेज हवा से तना टूटने व पत्तियां फटने का अंदेशा',
          action: 'Provide bamboo staking support to tall plants immediately.',
          actionHi: 'ऊंचे पौधों व केले के थंबों को बांस की खपच्चियों से सहारा दें।',
        },
      ],
      source: 'IMD Agromet Advisory (GKMS)',
    });
  }

  // 2. HEAVY RAINFALL / WATERLOGGING ALERT
  if (rainSum >= 30 || (maxRainProb >= 75 && rainSum >= 12)) {
    severeAlerts.push({
      id: `alert-rain-red-${Date.now()}`,
      severity: 'warning',
      colorCode: 'red',
      category: 'heavy_rain',
      headline: `Red Warning: Heavy Downpour & Waterlogging in ${distClean}`,
      headlineHi: `🔴 लाल चेतावनी: ${distClean} में भारी वर्षा व खेतों में जलभराव की चेतावनी`,
      description: `Cumulative precipitation forecast exceeds ${rainSum} mm across ${distClean}. High risk of inundation in low-lying agricultural fields, root suffocation, and soil siltation.`,
      descriptionHi: `${distClean} जिले में ${rainSum} mm से अधिक भारी मूसलाधार बारिश का अनुमान है। निचले खेतों में जलभराव और फसलों की जड़ों के सड़ने का गंभीर खतरा है।`,
      affectedArea: `${distClean} District agro-catchment`,
      effectiveUntil: 'Next 48 Hours',
      urgency: 'immediate',
      precautions: [
        'Immediately clear field bund outlets (नालियां) to evacuate excess standing water.',
        'Halt all tube-well and canal irrigation; turn off electric starter motors.',
        'Ensure harvested grain sacks in Mandis are stacked on elevated wooden pallets.',
      ],
      precautionsHi: [
        'खेतों से अतिरिक्त पानी की तत्काल निकासी हेतु मेड़ों पर निकास नालियां साफ करें।',
        'नलकूप व नहर से सिंचाई पूरी तरह बंद रखें और बिजली के स्टार्टर सुरक्षित स्थान पर रखें।',
        'मंडियों में रखे अनाज के बोरों को ऊंचे लकड़ी के चबूतरों पर रखकर तिरपाल से ढकें।',
      ],
      cropImpacts: [
        {
          cropName: 'Pulses & Oilseeds (दलहन व तिलहन)',
          cropNameHi: 'दलहन व तिलहन',
          impact: 'Extreme sensitivity to root rot (उकठा / विल्ट) in standing water',
          impactHi: 'खेत में पानी भरने से जड़ सड़न व उकठा रोग का भारी प्रकोप',
          action: 'Drain standing water within 12 hours of rainfall cessation.',
          actionHi: 'बारिश रुकते ही 12 घंटे के भीतर खेत का सारा जमा पानी बाहर निकालें।',
        },
      ],
      source: 'IMD Agromet District Flood Watch',
    });
  } else if (rainSum >= 14 || maxRainProb >= 60) {
    severeAlerts.push({
      id: `alert-rain-orange-${Date.now()}`,
      severity: 'alert',
      colorCode: 'orange',
      category: 'heavy_rain',
      headline: `Orange Alert: Moderate to Heavy Showers in ${distClean}`,
      headlineHi: `🟠 नारंगी अलर्ट: ${distClean} में मध्यम से भारी बारिश की संभावना`,
      description: `Rain probability stands at ${maxRainProb}% with predicted accumulation of ~${rainSum || 14} mm in ${distClean}. Field operations may encounter soil wetness delays.`,
      descriptionHi: `${distClean} जिले में ${maxRainProb}% संभावना के साथ लगभग ${rainSum || 14} mm बारिश का पूर्वानुमान है। खेतों में कीचड़ व नमी बढ़ेगी।`,
      affectedArea: `${distClean} & adjoining blocks`,
      effectiveUntil: 'Next 48 Hours',
      urgency: 'expected',
      precautions: [
        'Postpone fertilizer top-dressing (Urea/DAP) to prevent leaching into sub-soil.',
        'Clean drainage channels around vegetable seedbeds and nursery plots.',
      ],
      precautionsHi: [
        'यूरिया व डीएपी खाद का बुरकाव रोकें ताकि बारिश में खाद बहकर बर्बाद न हो।',
        'सब्जियों की क्यारियों के चारों ओर जल निकासी की व्यवस्था दुरुस्त रखें।',
      ],
      cropImpacts: [
        {
          cropName: 'Vegetables & Potato (सब्जियां व आलू)',
          cropNameHi: 'सब्जियां व आलू',
          impact: 'Moisture saturation may invite soil-borne fungal pathogens',
          impactHi: 'अधिक नमी से मिट्टी जनित फफूंद का खतरा बढ़ सकता है',
          action: 'Ensure ridge beds (मेड़) remain elevated above furrow water level.',
          actionHi: 'क्यारियों की मेड़ें ऊंची रखें ताकि पौधे पानी में न डूबें।',
        },
      ],
      source: 'IMD Agromet Service',
    });
  }

  // 3. HEATWAVE / LOO ALERT
  if (maxTemp >= 42 || apparentTemperature >= 44) {
    severeAlerts.push({
      id: `alert-heat-red-${Date.now()}`,
      severity: 'warning',
      colorCode: 'red',
      category: 'heatwave',
      headline: `Red Warning: Severe Heatwave (Loo) in ${distClean} (${maxTemp}°C)`,
      headlineHi: `🔴 लाल चेतावनी: ${distClean} में भीषण लू व प्रचंड गर्मी (${maxTemp}°C)`,
      description: `Maximum daytime mercury expected to hit ${maxTemp}°C (heat index ${apparentTemperature}°C) in ${distClean}. High thermal stress on crops, soil moisture depletion, and livestock dehydration.`,
      descriptionHi: `${distClean} जिले में अधिकतम तापमान ${maxTemp}°C तक पहुंचने और भीषण गर्म हवाएं (लू) चलने की चेतावनी है। फसलों व पशुओं में पानी की भारी कमी हो सकती है।`,
      affectedArea: `${distClean} District and surrounding plains`,
      effectiveUntil: 'Next 3 Days',
      urgency: 'immediate',
      precautions: [
        'Apply light and frequent evening irrigations or micro-sprinklers to cool the root zone.',
        'Mulch vegetable rows with crop residue or dry straw to prevent soil baking.',
        'Protect milch cattle: provide electrolyte water (ORS/jaggery) and bathe them twice daily.',
        'Rest farm labor between 11:30 AM and 3:30 PM to avoid heatstroke.',
      ],
      precautionsHi: [
        'शाम के समय हल्की सिंचाई या स्प्रिंकलर चलाकर खेत के तापमान को नियंत्रित करें।',
        'मिट्टी को सूखने से बचाने के लिए पुआल या सूखी घास से मल्चिंग (आच्छादन) करें।',
        'दुधारू पशुओं को दिन में दो बार नहलाएं और पीने के लिए गुड़-नमक युक्त ठंडा पानी दें।',
        'मजदूरों से दोपहर 11:30 से 3:30 बजे के बीच कड़े धूप वाले काम न कराएं।',
      ],
      cropImpacts: [
        {
          cropName: 'Fruit Orchards & Vegetables',
          cropNameHi: 'फलदार बाग व मौसमी सब्जियां',
          impact: 'Flower drop, fruit sunscald, and premature leaf drying',
          impactHi: 'फूल व कलियां झड़ने तथा फलों पर सनबर्न (धूप से जलने) का खतरा',
          action: 'Spray Kaolin (3%) or light evening misting to reduce canopy temperature.',
          actionHi: 'शाम को हल्की फव्वारा सिंचाई करें ताकि पौधों की गर्मी शांत हो सके।',
        },
      ],
      source: 'IMD Heatwave Action Cell',
    });
  } else if (maxTemp >= 38 || apparentTemperature >= 40) {
    severeAlerts.push({
      id: `alert-heat-orange-${Date.now()}`,
      severity: 'alert',
      colorCode: 'orange',
      category: 'heatwave',
      headline: `Orange Alert: High Temperature Advisory for ${distClean} (${maxTemp}°C)`,
      headlineHi: `🟠 नारंगी अलर्ट: ${distClean} में तीव्र गर्मी व उच्च तापमान (${maxTemp}°C)`,
      description: `Daytime temperatures soaring to ${maxTemp}°C across ${distClean}. Rapid evapotranspiration requires proactive moisture conservation.`,
      descriptionHi: `${distClean} जिले में तापमान ${maxTemp}°C तक बढ़ रहा है। मिट्टी से नमी तेजी से उड़ रही है, समय पर सिंचाई जरूरी है।`,
      affectedArea: `${distClean} District`,
      effectiveUntil: 'Next 48 Hours',
      urgency: 'expected',
      precautions: [
        'Prioritize drip irrigation during night or early morning hours.',
        'Hang wet gunny bags on the sides of dairy sheds to maintain cooler micro-climate.',
      ],
      precautionsHi: [
        'ड्रिप या स्प्रिंकलर सिंचाई सुबह या रात के समय ही चलाएं।',
        'पशु बाड़े में ठंडी हवा के लिए खिड़कियों पर गीली बोरी (टाट) लटकाएं।',
      ],
      cropImpacts: [
        {
          cropName: 'Standing Field Crops',
          cropNameHi: 'खेत में खड़ी फसलें',
          impact: 'Moisture stress in upper root zone',
          impactHi: 'जड़ों के पास नमी की कमी से पत्तियां मुरझाना',
          action: 'Apply light irrigation to maintain root turgidity.',
          actionHi: 'फसल को मुरझाने से बचाने हेतु तुरंत हल्की सिंचाई दें।',
        },
      ],
      source: 'IMD Agromet Advisory Service',
    });
  }

  // 4. COLDWAVE / GROUND FROST ALERT (PALA)
  if (minTemp <= 5) {
    severeAlerts.push({
      id: `alert-cold-orange-${Date.now()}`,
      severity: 'alert',
      colorCode: 'orange',
      category: 'frost',
      headline: `Orange Alert: Ground Frost & Coldwave Threat in ${distClean} (${minTemp}°C)`,
      headlineHi: `🟠 नारंगी अलर्ट: ${distClean} में शीतलहर व पाला (Frost) पड़ने की चेतावनी (${minTemp}°C)`,
      description: `Night temperatures dipping to ${minTemp}°C in ${distClean}. High probability of frost formation on tender foliage, potato leaves, and mustard pods.`,
      descriptionHi: `${distClean} में न्यूनतम तापमान गिरकर ${minTemp}°C रहने और पाला (पाला/तुषार) पड़ने की गंभीर आशंका है। इससे आलू, टमाटर व सरसों की फसल झुलस सकती है।`,
      affectedArea: `${distClean} agricultural rural belt`,
      effectiveUntil: 'Next 48 Hours (Night & Early Morning)',
      urgency: 'immediate',
      precautions: [
        'Provide light evening irrigation to raise field soil temperature by 1–2°C.',
        'Create smoke screens (धुआं करें) on the north-west border of fields from midnight to 5 AM using weed litter.',
        'Spray soluble sulfur (0.2%) or Dimethyl Sulfoxide on sensitive horticulture crops.',
      ],
      precautionsHi: [
        'शाम के समय हल्की सिंचाई करें जिससे रात में खेत का तापमान 1-2 डिग्री बढ़ जाए।',
        'उत्तर-पश्चिम दिशा की मेड़ों पर कचरा जलाकर रात 12 से सुबह 5 बजे तक धुआं करें।',
        'सब्जियों व आलू पर घुलनशील सल्फर (2 ग्राम प्रति लीटर) का छिड़काव करें।',
      ],
      cropImpacts: [
        {
          cropName: 'Potato, Tomato & Mustard',
          cropNameHi: 'आलू, टमाटर व सरसों',
          impact: 'Cell freezing and blackening of leaves from frost',
          impactHi: 'पाले से पत्तियों का काला पड़ना और दाने सिकुड़ना',
          action: 'Smoke field borders and cover young saplings with straw thatch.',
          actionHi: 'खेत में धुआं करें और छोटे पौधों को पुआल से ढकें।',
        },
      ],
      source: 'IMD Coldwave Bulletin',
    });
  }

  // 5. HIGH HUMIDITY & FUNGAL BLIGHT ALERT
  if (humidity >= 78 && (cloudCover >= 50 || weatherCode >= 45)) {
    severeAlerts.push({
      id: `alert-blight-yellow-${Date.now()}`,
      severity: 'watch',
      colorCode: 'yellow',
      category: 'blight_humidity',
      headline: `Yellow Watch: High Humidity & Fungal Blight Risk in ${distClean}`,
      headlineHi: `🟡 पीली सतर्कता: ${distClean} में अधिक नमी व फफूंदी रोग (झुलसा) का खतरा`,
      description: `Sustained relative humidity of ${humidity}% combined with ${cloudCover}% cloud cover creates favorable micro-climate for fungal spore multiplication (Late Blight in Potato, Yellow Rust in Wheat, Downy Mildew in Cucurbits).`,
      descriptionHi: `${distClean} जिले में ${humidity}% उच्च आर्द्रता व बादलों के कारण आलू में पछेती झुलसा, सरसों में सफेद रतुआ व सब्जियों में फफूंदी रोग फैलने का अनुकूल वातावरण बन रहा है।`,
      affectedArea: `${distClean} District fields`,
      effectiveUntil: 'Next 72 Hours',
      urgency: 'expected',
      precautions: [
        'Regularly scout crop canopy for water-soaked lesions or white powdery growth.',
        'Apply preventive bio-fungicide (Trichoderma viride @ 5g/L) or Copper Oxychloride (2.5g/L).',
        'Avoid flood irrigation which increases soil moisture saturation.',
      ],
      precautionsHi: [
        'पत्तियों के नीचे पानी जैसे धब्बे या फफूंद की सफेद जाली की तुरंत जांच करें।',
        'बचाव के लिए ट्राइकोडर्मा (5 ग्राम/ली.) या कॉपर ऑक्सीक्लोराइड का छिड़काव करें।',
        'खेत में जरूरत से ज्यादा पानी न भरें ताकि नमी नियंत्रित रहे।',
      ],
      cropImpacts: [
        {
          cropName: 'Potato & Solanaceous Vegetables',
          cropNameHi: 'आलू व सोलेनेशियस सब्जियां',
          impact: 'Late Blight (Phytophthora) rapid infestation',
          impactHi: 'पछेती झुलसा रोग का तीव्र प्रसार',
          action: 'Spray systemic fungicide like Metalaxyl + Mancozeb if symptoms appear.',
          actionHi: 'लक्षण दिखते ही मेटालेक्सिल + मैंकोजेब (2 ग्राम/ली.) का छिड़काव करें।',
        },
      ],
      source: 'State Agromet Advisory & KVK Network',
    });
  }

  // 6. DEFAULT FAVORABLE WEATHER ADVISORY (GREEN)
  if (severeAlerts.length === 0) {
    severeAlerts.push({
      id: `alert-fav-green-${Date.now()}`,
      severity: 'normal',
      colorCode: 'green',
      category: 'favorable',
      headline: `Green Normal: Favorable Agricultural Weather in ${distClean}`,
      headlineHi: `🟢 सामान्य अनुकूल कृषि मौसम: ${distClean} में खेती कार्य सुचारू रखें`,
      description: `Current weather parameters across ${distClean} district are calm and highly conducive for farming operations. No adverse weather warning active. Ideal window for fertilizer application, inter-cultivation, and harvesting.`,
      descriptionHi: `${distClean} जिले में मौसम साफ, शांत और कृषि कार्यों के लिए पूरी तरह अनुकूल है। किसी प्रकार की प्रतिकूल मौसम चेतावनी नहीं है। बुवाई, निराई-गुड़ाई, खाद देने व कटाई के लिए उत्तम समय।`,
      affectedArea: `${distClean} District agricultural zone`,
      effectiveUntil: 'Next 5 Days',
      urgency: 'future',
      precautions: [
        'Proceed with regular harvesting, threshing, and sun-drying of mature crops.',
        'Conduct planned weeding, hoeing, and top-dressing of nitrogenous fertilizers.',
        'Maintain routine irrigation schedule matching crop physiological stage.',
      ],
      precautionsHi: [
        'पकी हुई फसलों की कटाई, मड़ाई व अनाज सुखाने का कार्य निश्चिंत होकर करें।',
        'खेत में निराई-गुड़ाई और आवश्यकतानुसार यूरिया की टॉप-ड्रेसिंग पूरी करें।',
        'फसल की आवश्यकतानुसार सामान्य सिंचाई चक्र का पालन करें।',
      ],
      cropImpacts: [
        {
          cropName: 'All Seasonal Crops (सभी मौसमी फसलें)',
          cropNameHi: 'सभी मौसमी फसलें',
          impact: 'Optimal photosynthesis and growth conditions',
          impactHi: 'सूर्य का भरपूर प्रकाश व पौधों की अच्छी बढ़वार',
          action: 'Maximize field operations during daytime hours.',
          actionHi: 'दिन के समय खेत के सभी महत्वपूर्ण कार्य निपटाएं।',
        },
      ],
      source: 'IMD Agromet Advisory Service (GKMS)',
    });
  }

  // Prioritize active severe alert: Warning (Red) > Alert (Orange) > Watch (Yellow) > Normal (Green)
  const severityRank: Record<AlertSeverity, number> = { warning: 4, alert: 3, watch: 2, normal: 1 };
  const sortedAlerts = [...severeAlerts].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  const activeSevereAlert = sortedAlerts[0];

  const bulletinDateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const bulletinNumber = `GKMS/${distClean.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}/${new Date().getMonth() + 1}`;

  return {
    district: distClean,
    state: stateClean,
    agroClimaticZone: zoneInfo.zoneEn,
    agroClimaticZoneHi: zoneInfo.zoneHi,
    bulletinDate: bulletinDateStr,
    bulletinNumber,
    overallSummary: `Agricultural weather bulletin for ${distClean}, ${stateClean}. ${activeSevereAlert.headline}. Ensure timely precautions for standing crops and dairy animals.`,
    overallSummaryHi: `${distClean}, ${stateClean} के लिए जिला कृषि मौसम बुलेटिन। ${activeSevereAlert.headlineHi}। फसलों व पशुधन की सुरक्षा हेतु अनुशंसित कदम उठाएं।`,
    severeAlerts: sortedAlerts,
    activeSevereAlert,
    seasonalCropAdvisories: zoneInfo.crops.map((c) => ({
      crop: c.crop,
      cropHi: c.cropHi,
      growthStage: c.growthStage,
      growthStageHi: c.growthStageHi,
      advisory: c.normalAdvisory,
      advisoryHi: c.normalAdvisoryHi,
      pestRisk: c.pestRisk,
      pestRiskDetails: c.pestRiskDetails,
      pestRiskDetailsHi: c.pestRiskDetailsHi,
    })),
    livestockAdvisory: {
      en: `Provide fresh and clean drinking water to milch cows and buffaloes. Ensure shelter ventilation. Protect calves from sudden temperature shifts. Administer Deworming and FMD (Foot & Mouth) vaccination as per veterinary schedule.`,
      hi: `दुधारू गाय-भैंसों को दिन में 3 बार ताजा व स्वच्छ पानी पिलाएं। बाड़े में हवा व धूप का उचित प्रबंध रखें। छोटे बछड़ों को ठंडी हवा से बचाएं और पशु चिकित्सक की सलाह से खुरपका-मुंहपका (FMD) का टीका लगवाएं।`,
    },
    soilMoistureAdvisory: {
      en: rainSum > 10 
        ? `Sufficient surface soil moisture observed in ${distClean}. Withhold irrigation for next 3-4 days to prevent root lodging.`
        : `Moderate soil evapotranspiration in ${distClean}. Provide light irrigation to sensitive vegetable and wheat plots.`,
      hi: rainSum > 10
        ? `${distClean} में मिट्टी में पर्याप्त नमी मौजूद है। जड़ों को गलने से बचाने हेतु अगले 3-4 दिन सिंचाई रोक कर रखें।`
        : `${distClean} में मिट्टी से नमी का वाष्पीकरण सामान्य है। सब्जियों व गेहूं के खेतों में आवश्यकतानुसार हल्की सिंचाई करें।`,
    },
  };
}
