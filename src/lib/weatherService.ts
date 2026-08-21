export interface WeatherData {
  locationName: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  accuracySource: 'gps' | 'ip' | 'search' | 'cached' | 'fallback';
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
      hourlyForecast,
      dailyForecast,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err) {
    console.warn('Live weather fetch error, building resilient fallback forecast:', err);
    const fallbackCondition = getWeatherConditionInfo(1, true);
    return {
      locationName: locationLabel?.village || 'Barabanki Farm',
      district: locationLabel?.district || 'Barabanki',
      state: locationLabel?.state || 'Uttar Pradesh',
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
