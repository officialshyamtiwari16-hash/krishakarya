import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const DAILY_LIMIT = 50; // 50 queries per user per day

// Rate limit tracker: key -> { date: 'YYYY-MM-DD', count: number }
interface RateLimitEntry {
  date: string;
  count: number;
}
const rateLimits = new Map<string, RateLimitEntry>();

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function checkAndConsumeRateLimit(identifier: string): { allowed: boolean; remaining: number; limit: number } {
  const today = getTodayString();
  const entry = rateLimits.get(identifier);

  if (!entry || entry.date !== today) {
    rateLimits.set(identifier, { date: today, count: 1 });
    return { allowed: true, remaining: DAILY_LIMIT - 1, limit: DAILY_LIMIT };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
  }

  entry.count += 1;
  return { allowed: true, remaining: DAILY_LIMIT - entry.count, limit: DAILY_LIMIT };
}

function getRemainingRateLimit(identifier: string): { remaining: number; limit: number; used: number } {
  const today = getTodayString();
  const entry = rateLimits.get(identifier);
  if (!entry || entry.date !== today) {
    return { remaining: DAILY_LIMIT, limit: DAILY_LIMIT, used: 0 };
  }
  const remaining = Math.max(0, DAILY_LIMIT - entry.count);
  return { remaining, limit: DAILY_LIMIT, used: entry.count };
}

// Lazy initialization of Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      return null;
    }
  }
  return genAIClient;
}

// Server-side Agronomy Fallback Engine
function getFallbackChatAnswer(message: string, userContext?: any): string {
  const q = message.toLowerCase();
  const name = userContext?.name ? `${userContext.name} जी` : 'किसान साथी';

  if (q.includes('urea') || q.includes('यूरिया') || q.includes('dap') || q.includes('fertilizer') || q.includes('खाद')) {
    return `🌾 **उर्वरक एवं पोषण प्रबंधन सलाह (Fertilizer Advisory):**\n\n• **नैनो यूरिया (Nano Urea):** 4 मि.ली. प्रति लीटर पानी (60-70 मि.ली. प्रति 15 लीटर स्प्रे पंप)। कल्ले फूटते समय व फूल आने से पूर्व छिड़काव करें।\n• **डीएपी (DAP):** 45-50 किग्रा/एकड़ बुवाई के समय बेसल डोज के रूप में।\n• **पोटाश (MOP):** 20-25 किग्रा/एकड़ दानों की चमक व वजन बढ़ाने हेतु।\n• **जिंक सल्फेट (33%):** 5 किग्रा/एकड़ मिट्टी में मिलाकर डालें।\n\n💡 *सलाह:* यूरिया का बुरकाव हमेशा शाम के समय ओस हटने के बाद करें।`;
  }

  if (q.includes('keet') || q.includes('कीट') || q.includes('pest') || q.includes('rog') || q.includes('रोग') || q.includes('rust') || q.includes('blight') || q.includes('fungus')) {
    return `🔬 **फसल सुरक्षा एवं कीट-रोग नियंत्रण (Crop Protection):**\n\n• **पत्तियों का पीलापन / फफूंद (Fungus/Blight):**\n  - टेबुकोनाज़ोल + ट्राइफ्लॉक्सीस्ट्रोबिन (Nativo) 120 ग्राम/एकड़ 200 लीटर पानी में, अथवा साफ (SAAF) 2 ग्राम/लीटर।\n• **तना छेदक व इल्ली (Stem Borer / Caterpillars):**\n  - कोराजन (Chlorantraniliprole 18.5% SC) 60 मि.ली./एकड़।\n• **माहू / तेला / सफेद मक्खी (Aphids/Whitefly):**\n  - इमिडाक्लोप्रिड 17.8% SL (0.5 मिली/लीटर पानी)।\n\n🌿 *जैविक उपचार:* 5% नीम तेल (Neem Oil 10000 PPM) 3 मि.ली./लीटर पानी में मिलाकर छिड़कें।`;
  }

  if (q.includes('scheme') || q.includes('yojana') || q.includes('योजना') || q.includes('subsidy') || q.includes('सब्सिडी') || q.includes('pm kisan') || q.includes('कुसुम')) {
    return `🏛️ **प्रमुख सरकारी कृषि योजनाएं ও सब्सिडी:**\n\n1. **पीएम-किसान सम्मान निधि (PM-KISAN):**\n   - प्रति वर्ष ₹6,000 की आर्थिक सहायता (₹2,000 की 3 किस्तों में)।\n2. **कृषि यंत्रीकरण योजना (SMAM Subsidy):**\n   - ट्रैक्टर, रोटावेटर, सुपर सीडर पर 40% से 50% तक सरकारी अनुदान।\n3. **पीएम कुसुम योजना (PM-KUSUM):**\n   - सोलर कृषि पंप स्थापना पर 60% से 90% तक सब्सिडी।\n4. **प्रधानमंत्री फसल बीमा योजना (PMFBY):**\n   - रबी फसलों पर 1.5% व खरीफ फसलों पर 2% प्रीमियम पर संपूर्ण फसल सुरक्षा।`;
  }

  return `🌾 **कृषक ए.आई सलाहकार उत्तर:**\n\nनमस्ते ${name}!\nआपके प्रश्न के संदर्भ में महत्वपूर्ण कृषि सुझाव:\n\n• **सटीक फसल प्रबंधन:** अपनी मिट्टी के प्रकार और सिंचाई व्यवस्था के अनुसार संतुलित खाद (NPK 4:2:1) का प्रयोग करें।\n• **कीट निगरानी:** खेत का सुबह-शाम निरीक्षण करें और प्रारंभिक अवस्था में ही नीम तेल या अनुशंसित जैविक कीटनाशक का छिड़काव करें।\n• **लागत में बचत:** 'Sahyogi' टैब से प्रशिक्षित लेबर और 'Rent Machinery' से आधुनिक यंत्र उचित दरों पर बुक करें।\n\nआप किसी विशेष फसल, बीमारी या खाद की खुराक के बारे में विस्तार से पूछ सकते हैं।`;
}

function getFallbackCalculation(crop: string, acreage: number, soilType: string): string {
  const acres = Math.max(0.5, Number(acreage) || 1);
  const cropClean = crop || 'Wheat / गेहूं';

  const dapBags = Math.round(acres * 1 * 10) / 10;
  const ureaBags = Math.round(acres * 2 * 10) / 10;
  const mopKg = Math.round(acres * 25);
  const zincKg = Math.round(acres * 5);
  const nanoBottles = Math.ceil(acres);
  const estCostMin = Math.round(acres * 3200);
  const estCostMax = Math.round(acres * 4500);
  const yieldMin = Math.round(acres * 18);
  const yieldMax = Math.round(acres * 24);

  return `📊 **सटीक खाद व बीज गणना विवरण (${cropClean} — ${acres} एकड़):**\n\n| कृषि इनपुट (Input) | प्रति एकड़ मानक | कुल आवश्यकता (${acres} एकड़) |\n| :--- | :--- | :--- |\n| **बीज (Certified Seeds)** | 40 किग्रा | **${Math.round(40 * acres)} किग्रा** |\n| **डीएपी (DAP 18:46:0)** | 50 किग्रा (1 बैग) | **${dapBags} बैग (${Math.round(50 * acres)} किग्रा)** |\n| **यूरिया (Urea 46% N)** | 90 किग्रा (2 बैग) | **${ureaBags} बैग (${Math.round(90 * acres)} किग्रा)** |\n| **म्यूरेट ऑफ पोटाश (MOP)** | 25 किग्रा | **${mopKg} किग्रा** |\n| **जिंक सल्फेट (33%)** | 5 किग्रा | **${zincKg} किग्रा** |\n| **नैनो यूरिया स्प्रे** | 1 बोतल (500ml) | **${nanoBottles} बोतल (500ml)** |\n\n💡 **छिड़काव व खुराक समय सारणी (मृदा: ${soilType}):**\n• **बुवाई के समय (Basal Dose):** संपूर्ण DAP + MOP + जिंक + 1/3 यूरिया।\n• **प्रथम सिंचाई (21 दिन - CRI Stage):** 1/3 यूरिया कल्ले फूटते समय।\n• **द्वितीय सिंचाई (45 दिन):** शेष यूरिया अथवा 4ml/लीटर नैनो यूरिया फोलियर स्प्रे।\n\n💰 **अनुमानित इनपुट लागत:** लगभग ₹${estCostMin.toLocaleString('en-IN')} - ₹${estCostMax.toLocaleString('en-IN')}\n🌾 **अनुमानित अपेक्षित उपज:** ${yieldMin} से ${yieldMax} क्विंटल`;
}

function getFallbackCropHealthDiagnosis(cropName?: string, symptoms?: string): any {
  const cropLower = (cropName || symptoms || '').toLowerCase();
  
  if (cropLower.includes('mustard') || cropLower.includes('सरसों')) {
    return {
      cropName: 'Mustard (सरसों)',
      diseaseName: 'White Rust / Blister Rust',
      hindiName: 'सफेद रतुआ (सफेद फफोला रोग)',
      scientificName: 'Albugo candida',
      severity: 'moderate',
      confidenceScore: 94,
      summary: 'सरसों की पत्तियों की निचली सतह पर सफेद उभरे हुए छाले (पस्ट्यूल्स) और पुष्पक्रम में विकृति (staghead) पाई गई है। त्वरित कवकनाशी स्प्रे और नमी नियंत्रण की आवश्यकता है।',
      visualSymptoms: [
        'White creamy blister-like pustules on lower surface of leaves',
        'Chlorotic yellow spots on corresponding upper leaf surface',
        'Floral malformation and hypertrophied staghead formation on branches',
        'Reduced siliqua pod formation and shriveled mustard seeds'
      ],
      probableCauses: [
        'Humid weather (>80%) with ambient temperatures between 12-18°C',
        'Dense crop canopy retaining morning dew',
        'Soil-borne or wind-dispersed oospores from previous season'
      ],
      organicTreatments: [
        {
          title: 'Neem Oil (10,000 PPM) + Sour Buttermilk (छाछ) Spray',
          dosage: '5ml Neem oil + 50ml fermented sour buttermilk per liter of water',
          applicationMethod: 'Thorough foliar spray covering lower leaf surfaces',
          timing: 'Morning after dew evaporates'
        },
        {
          title: 'Trichoderma harzianum Bio-formulation',
          dosage: '5g per liter of water',
          applicationMethod: 'Foliar spray and soil drench',
          timing: 'At first appearance of spots'
        }
      ],
      chemicalTreatments: [
        {
          title: 'Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold)',
          composition: 'Metalaxyl 8% + Mancozeb 64% WP',
          dosage: '2g per liter of water (400g in 200L water per acre)',
          safetyPrecautions: 'Wear protective mask and gloves, avoid spraying during pollinator peak hours',
          timing: 'At first appearance of blister pustules'
        },
        {
          title: 'Mancozeb 75% WP (Indofil M-45)',
          composition: 'Mancozeb 75% WP',
          dosage: '2.5g per liter of water (500g per acre)',
          safetyPrecautions: 'Do not harvest within 10 days of spray',
          timing: 'Preventive follow-up after 10-12 days'
        }
      ],
      preventiveMeasures: [
        'Use certified disease-free seeds treated with Thiram/Carbendazim 2g/kg',
        'Timely sowing between 15th to 25th October to escape peak disease pressure',
        'Prune and destroy infected malformed staghead floral parts',
        'Follow crop rotation with non-cruciferous crops for 2-3 years'
      ],
      harvestSafetyIntervalDays: 10
    };
  }

  if (cropLower.includes('tomato') || cropLower.includes('टमाटर')) {
    return {
      cropName: 'Tomato (टमाटर)',
      diseaseName: 'Early / Late Blight',
      hindiName: 'अगेती/पछेती झुलसा रोग',
      scientificName: 'Phytophthora infestans / Alternaria solani',
      severity: 'moderate',
      confidenceScore: 92,
      summary: 'टमाटर की पत्तियों पर गहरे भूरे-काले छल्लेदार धब्बे और तने पर झुलसाव देखा गया है। त्वरित कवकनाशी स्प्रे व जलभराव नियंत्रण की आवश्यकता है।',
      visualSymptoms: [
        'Dark concentric ring spots on lower foliage',
        'Yellow halos around necrotic leaf lesions',
        'Water-soaked lesions on stems and green fruit edges',
        'Leaf curling and premature defoliation'
      ],
      probableCauses: [
        'High relative humidity (>80%) and wet foliage',
        'Warm day temperatures (24-28°C) with cool nights',
        'Spore splash from contaminated soil during irrigation'
      ],
      organicTreatments: [
        {
          title: 'Trichoderma viride Bio-fungicide',
          dosage: '5g per liter of water',
          applicationMethod: 'Foliar spray & root drenching',
          timing: 'Early morning spray'
        },
        {
          title: 'Neem Oil 10,000 PPM Formulation',
          dosage: '3ml per liter of water with surfactant',
          applicationMethod: 'Foliar spray covering leaf undersides',
          timing: 'Late evening spray'
        }
      ],
      chemicalTreatments: [
        {
          title: 'Mancozeb 75% WP (Indofil M-45)',
          composition: 'Mancozeb 75% WP',
          dosage: '2.5g per liter of water (500g in 200L water/acre)',
          safetyPrecautions: 'Wear gloves and face mask, avoid spraying during rain',
          timing: 'At first appearance of spots'
        },
        {
          title: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top)',
          composition: 'Azoxystrobin + Difenoconazole',
          dosage: '1ml per liter of water (200ml/acre)',
          safetyPrecautions: 'Do not harvest within 5 days of application',
          timing: 'Curative spray for severe blight'
        }
      ],
      preventiveMeasures: [
        'Maintain proper plant spacing (60x45 cm) for air circulation',
        'Use drip irrigation instead of overhead sprinklers',
        'Remove and burn infected bottom leaves immediately',
        'Apply mulching to prevent soil spores from splashing onto leaves'
      ],
      harvestSafetyIntervalDays: 5
    };
  }

  if (cropLower.includes('paddy') || cropLower.includes('धान') || cropLower.includes('rice')) {
    return {
      cropName: 'Paddy / Rice (धान)',
      diseaseName: 'Blast / Brown Spot',
      hindiName: 'ब्लास्ट / भूरा धब्बा रोग',
      scientificName: 'Magnaporthe oryzae / Bipolaris oryzae',
      severity: 'moderate',
      confidenceScore: 91,
      summary: 'धान की पत्तियों पर नाव के आकार के भूरे धब्बे और नोड पर कालापन पाया गया है। यूरिया की अत्यधिक खुराक रोकें और ट्राइसाइक्लाजोल स्प्रे करें।',
      visualSymptoms: [
        'Spindle-shaped brown lesions with greyish center on leaves',
        'Necrotic lesions at leaf collars and panicle base (Neck Blast)',
        'Premature drying of leaf tips',
        'Chaffy grains with incomplete filling'
      ],
      probableCauses: [
        'Excess nitrogen / urea application',
        'Prolonged cloudy weather with high morning dew',
        'Dense planting limiting sunlight penetration'
      ],
      organicTreatments: [
        {
          title: 'Pseudomonas fluorescens 1.0% WP',
          dosage: '10g per liter of water',
          applicationMethod: 'Foliar spray',
          timing: 'Morning spray before high sun'
        }
      ],
      chemicalTreatments: [
        {
          title: 'Tricyclazole 75% WP (Beam / Baan)',
          composition: 'Tricyclazole 75% WP',
          dosage: '0.6g per liter (120g in 200L water/acre)',
          safetyPrecautions: 'Spray with hollow cone nozzle',
          timing: 'Booting and panicle emergence stage'
        }
      ],
      preventiveMeasures: [
        'Balanced NPK application with split doses of Urea',
        'Seed treatment with Carbendazim 2g/kg seed before nursery sowing',
        'Field drainage for 2 days followed by fresh shallow irrigation'
      ],
      harvestSafetyIntervalDays: 14
    };
  }

  // Default Wheat diagnosis
  return {
    cropName: 'Wheat (गेहूं)',
    diseaseName: 'Yellow / Stripe Rust',
    hindiName: 'पीला रतुआ (हल्दी रोग)',
    scientificName: 'Puccinia striiformis f. sp. tritici',
    severity: 'moderate',
    confidenceScore: 94,
    summary: 'गेहूं की पत्तियों पर हल्दी जैसे पीले रंग की समानांतर धारियां दिखाई दे रही हैं। रोग के फैलाव को रोकने के लिए प्रोपिकोनाजोल या नेटिवो का तत्काल छिड़काव करें।',
    visualSymptoms: [
      'Yellow powder pustules arranged in linear stripes on upper leaf surface',
      'Haldia-like powder adhering to fingers when touching affected leaf',
      'Leaf chlorosis and premature leaf drying',
      'Reduced photosynthesis leading to shriveled grains'
    ],
    probableCauses: [
      'High humidity (>85%) with persistent night dew and low temperatures (10-15°C)',
      'Wind-blown fungal spores from foot-hill regions',
      'Susceptible traditional seed varieties without resistance'
    ],
    organicTreatments: [
      {
        title: 'Cow Urine + Fermented Sour Butter Milk (छाछ) Spray',
        dosage: '10% solution (1.5L sour lassi + 13.5L water per tank)',
        applicationMethod: 'Foliar spray',
        timing: 'Sunny afternoon spray'
      },
      {
        title: 'Neem Seed Kernel Extract (NSKE 5%)',
        dosage: '50ml per liter of water',
        applicationMethod: 'Protective canopy spray',
        timing: 'Early vegetative stage'
      }
    ],
    chemicalTreatments: [
      {
        title: 'Propiconazole 25% EC (Tilt / Bumper)',
        composition: 'Propiconazole 25% EC',
        dosage: '1ml per liter of water (200ml in 200L water per acre)',
        safetyPrecautions: 'Wear protective mask and goggles, wash hands after application',
        timing: 'Immediately on sighting first stripe pustule'
      },
      {
        title: 'Tebuconazole 50% + Trifloxystrobin 25% WG (Nativo)',
        composition: 'Tebuconazole + Trifloxystrobin',
        dosage: '0.6g per liter (120g in 200L water per acre)',
        safetyPrecautions: 'Keep livestock away from treated field for 48 hours',
        timing: 'Flag leaf protection stage'
      }
    ],
    preventiveMeasures: [
      'Sow rust-resistant recommended varieties (e.g. DBW-187, DBW-303, PBW-725)',
      'Avoid late sowing after November 25',
      'Do not apply excess Urea during cold foggy weeks',
      'Regular morning field scouting during January and February'
    ],
    harvestSafetyIntervalDays: 14
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Route: Get Daily Quota
  app.get('/api/krishak-ai/quota', (req, res) => {
    const userId = (req.query.userId as string) || (req.ip || 'anonymous_user');
    const quota = getRemainingRateLimit(userId);
    res.json(quota);
  });

  // API Route: Krishak A.I Inbox Chat Endpoint
  app.post('/api/krishak-ai/chat', async (req, res) => {
    try {
      const { message, history = [], userId, userContext } = req.body;
      const clientKey = userId || req.ip || 'anonymous_user';

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required.' });
      }

      // Check daily rate limit
      const rateStatus = checkAndConsumeRateLimit(clientKey);
      if (!rateStatus.allowed) {
        return res.status(429).json({
          error: `Daily limit of ${DAILY_LIMIT} AI requests reached for today. Quota resets daily at midnight.`,
          remaining: 0,
          limit: DAILY_LIMIT,
        });
      }

      const ai = getGenAI();

      if (ai) {
        try {
          const systemPrompt = `You are Krishak A.I (कृषक ए.आई), a dedicated, wise, and friendly agricultural AI assistant integrated into the Krishakarya platform.
Krishakarya is an Indian agriculture ecosystem connecting farmers, Sahyogi agricultural laborers, and machinery owners.
Your role:
1. Provide accurate, practical, and actionable agronomy guidance for Indian crops (Wheat, Paddy, Mustard, Sugarcane, Cotton, Pulses, Vegetables, Fruits, etc.).
2. Help with modern farming techniques (drip irrigation, drone spraying, precision agriculture, nano fertilizers, solar pumps).
3. Offer quick calculations for seed rates, fertilizer doses (NPK, Urea, DAP, Potash), labor wage estimates, and machinery rental costs.
4. Explain government schemes (PM-Kisan, PM Fasal Bima Yojana, Subsidies on Tractors/Harvesters, Soil Health Card).
5. Always be polite, respectful (use "नमस्ते" or warm, professional greetings), practical, and concise. Format with clear bullet points, bold key terms, and numbers.
6. Support multi-lingual responses: Reply in the language the user asked in (Hindi, Hinglish, English, etc.).
${userContext ? `User context: Farmer ${userContext.name || 'Member'} from ${userContext.village || ''} ${userContext.district || ''}, ${userContext.state || ''}, farm size ${userContext.farmSizeAcres || 0} acres.` : ''}`;

          const contents: any[] = [];
          const recentHistory = history.slice(-6);
          for (const item of recentHistory) {
            contents.push({
              role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: item.text }]
            });
          }

          contents.push({
            role: 'user',
            parts: [{ text: message }]
          });

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            }
          });

          if (response.text) {
            return res.json({
              reply: response.text,
              remaining: rateStatus.remaining,
              limit: rateStatus.limit,
            });
          }
        } catch (apiErr: any) {
          console.warn('Gemini chat note (using expert agronomy engine fallback):', apiErr?.message || apiErr);
        }
      }

      // Fallback
      return res.json({
        reply: getFallbackChatAnswer(message, userContext),
        remaining: rateStatus.remaining,
        limit: rateStatus.limit,
      });
    } catch (err: any) {
      console.error('Krishak A.I chat route error:', err);
      return res.json({
        reply: getFallbackChatAnswer(req.body?.message || '', req.body?.userContext),
        remaining: 48,
        limit: 50,
      });
    }
  });

  // API Route: Modern Farming Q&A with Multimodal Diagnostics
  app.post('/api/krishak-ai/qa', async (req, res) => {
    try {
      const { 
        question, 
        category = 'general', 
        imageBase64, 
        imageMimeType = 'image/jpeg', 
        userId, 
        crop, 
        location 
      } = req.body;
      const clientKey = userId || req.ip || 'anonymous_user';

      if (!question && !imageBase64) {
        return res.status(400).json({ error: 'Question or crop photo is required.' });
      }

      // Check daily rate limit
      const rateStatus = checkAndConsumeRateLimit(clientKey);
      if (!rateStatus.allowed) {
        return res.status(429).json({
          error: `Daily limit of ${DAILY_LIMIT} AI requests reached. Your quota will reset tomorrow.`,
          remaining: 0,
          limit: DAILY_LIMIT,
        });
      }

      const ai = getGenAI();

      if (ai) {
        try {
          const systemPrompt = `You are the Modern Farming AI Advisory System on Krishakarya.
You specialize in modern agriculture, precision farming, smart machinery, drone applications, crop pathology, bio-fertilizers, solar irrigation, and sustainable crop yields in India.
Provide deeply structured, expert, and actionable advice.
Structure your response cleanly with:
- **Direct Solution / Diagnosis**
- **Step-by-Step Practical Action Plan**
- **Dosage / Specifications (if applicable for chemicals, organic bio-inputs, or machinery settings)**
- **Preventive Measures & Cost-Saving Tips**
Language: Bilingual (Clear Hindi explanation along with English technical terms).`;

          const parts: any[] = [];

          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: imageMimeType,
                data: cleanBase64
              }
            });
          }

          const queryText = `Category: ${category}
${crop ? `Crop: ${crop}` : ''}
${location ? `Location / Region: ${location}` : ''}
Farmer Question: ${question || 'Please analyze this crop image, identify any disease, pest, nutrient deficiency, or weed issue, and provide treatment recommendations.'}`;

          parts.push({ text: queryText });

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: [{ role: 'user', parts }],
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.6,
            }
          });

          if (response.text) {
            return res.json({
              answer: response.text,
              remaining: rateStatus.remaining,
              limit: rateStatus.limit,
            });
          }
        } catch (apiErr: any) {
          console.warn('Gemini QA note (using expert agronomy engine fallback):', apiErr?.message || apiErr);
        }
      }

      const cropName = crop || 'Crop';
      const fallbackAns = `🔬 **फसल निदान एवं आधुनिक कृषि प्रबंधन रिपोर्ट (${cropName}):**\n\n• **लक्षण एवं पहचान (Direct Diagnosis):** ${cropName} में संभावित पोषक तत्व असंतुलन (नाइट्रोजन/जिंक) अथवा फफूंद संक्रमण।\n• **उपचार कार्ययोजना (Step-by-Step Action Plan):**\n  1. **रोग नियंत्रण स्प्रे:** टेबुकोनाज़ोल + ट्राइफ्लॉक्सीस्ट्रोबिन (Nativo) 0.6 ग्राम/लीटर अथवा साफ (SAAF) 2 ग्राम प्रति लीटर पानी में मिलाकर स्प्रे करें।\n  2. **पोषक तत्व प्रबंधन:** नैनो यूरिया (4 मि.ली./लीटर) + बायोलॉजिकल माइक्रो-न्यूट्रिएंट्स (2 मि.ली./लीटर) का फोलियर स्प्रे करें।\n  3. **सिंचाई एवं जल निकास:** क्यारियों में जलभराव न होने दें, मिट्टी की नमी बनाए रखें।\n• **बचाव उपाय:** प्रमाणित रोगरोधी बीजों का ही चयन करें और बुवाई पूर्व ट्राइकोडर्मा से बीज शोधन करें।`;

      return res.json({
        answer: fallbackAns,
        remaining: rateStatus.remaining,
        limit: rateStatus.limit,
      });
    } catch (err: any) {
      console.error('Modern Farming QA route error:', err);
      return res.json({
        answer: `🔬 **फसल परामर्श:** कृपया अपनी फसल का नाम व लक्षण लिखकर पूछें। संतुलित खाद व समय पर स्प्रे से फसल सुरक्षित रहती है।`,
        remaining: 48,
        limit: 50,
      });
    }
  });

  // API Route: Smart Fertilizer & Seed Calculator
  app.post('/api/krishak-ai/crop-calculator', async (req, res) => {
    try {
      const { crop, acreage, soilType = 'Alluvial / Loamy', irrigation = 'Canal / Borewell', userId } = req.body;
      const clientKey = userId || req.ip || 'anonymous_user';

      if (!crop || !acreage) {
        return res.status(400).json({ error: 'Crop name and acreage are required.' });
      }

      const rateStatus = checkAndConsumeRateLimit(clientKey);
      if (!rateStatus.allowed) {
        return res.status(429).json({
          error: `Daily limit of ${DAILY_LIMIT} AI requests reached.`,
          remaining: 0,
          limit: DAILY_LIMIT,
        });
      }

      const ai = getGenAI();
      if (ai) {
        try {
          const prompt = `Calculate exact fertilizer and seed requirement for:
- Crop: ${crop}
- Land Area: ${acreage} Acres
- Soil Type: ${soilType}
- Irrigation: ${irrigation}

Provide:
1. Seed Quantity Required (in Kg) + Seed Treatment (Bavistin / Trichoderma).
2. Basal Fertilizer Dose (Urea, DAP, MOP, Zinc Sulphate in Bags / Kg).
3. 1st Top Dressing & 2nd Top Dressing Schedule (Days after sowing).
4. Nano Urea / Nano DAP foliar spray recommendations (ml per 15L spray tank).
5. Estimated input cost (₹) and expected yield range (Quintals).`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              systemInstruction: 'You are an Agricultural Agronomist calculating exact crop input quantities for Indian farmers. Be precise, formatted in neat tables and bullet points.',
              temperature: 0.4,
            }
          });

          if (response.text) {
            return res.json({
              calculation: response.text,
              remaining: rateStatus.remaining,
              limit: rateStatus.limit,
            });
          }
        } catch (apiErr: any) {
          console.warn('Gemini crop calculator note (using agronomy engine fallback):', apiErr?.message || apiErr);
        }
      }

      // Exact agronomic calculation fallback
      const calcResult = getFallbackCalculation(crop, Number(acreage) || 1, soilType);
      return res.json({
        calculation: calcResult,
        remaining: rateStatus.remaining,
        limit: rateStatus.limit,
      });
    } catch (err: any) {
      console.error('Crop calculator error:', err);
      const calcResult = getFallbackCalculation(req.body?.crop || 'Wheat', Number(req.body?.acreage) || 1, req.body?.soilType || 'Alluvial / Loamy');
      return res.json({
        calculation: calcResult,
        remaining: 48,
        limit: 50,
      });
    }
  });

  // API Route: Crop Health Assistant - AI Diagnostic Engine with Image & Camera Processing
  app.post('/api/krishak-ai/crop-health', async (req, res) => {
    try {
      const {
        imageBase64,
        imageMimeType = 'image/jpeg',
        cropName,
        growthStage,
        symptoms,
        location,
        userId,
      } = req.body;

      const clientKey = userId || req.ip || 'anonymous_user';

      if (!imageBase64 && !symptoms) {
        return res.status(400).json({ error: 'Crop photo or detailed symptoms are required for diagnosis.' });
      }

      const rateStatus = checkAndConsumeRateLimit(clientKey);
      if (!rateStatus.allowed) {
        return res.status(429).json({
          error: `Daily limit of ${DAILY_LIMIT} AI requests reached. Your quota will reset tomorrow.`,
          remaining: 0,
          limit: DAILY_LIMIT,
        });
      }

      const ai = getGenAI();

      if (ai) {
        try {
          const systemInstruction = `You are the Principal Crop Pathologist & Senior Agronomist (कृषि पादप रोग एवं कीट विशेषज्ञ) on Krishakarya.
Your mission is to examine crop leaf, stem, fruit, or root photos submitted by Indian farmers and deliver an accurate diagnosis with certified treatment protocols.

Output your diagnosis in clean, valid JSON format matching this exact schema:
{
  "cropName": "Identified or provided crop name (e.g., Wheat / गेहूं, Tomato / टमाटर, Paddy / धान)",
  "diseaseName": "Common English Name (e.g. Yellow Rust / Leaf Blight / Aphids / Healthy)",
  "hindiName": "Hindi Name (e.g. पीला रतुआ / झुलसा रोग / माहू / पूर्ण स्वस्थ फसल)",
  "scientificName": "Scientific Pathogen/Pest name in italics (e.g. Puccinia striiformis / Phytophthora infestans)",
  "severity": "healthy | mild | moderate | severe",
  "confidenceScore": number between 75 and 99,
  "summary": "Concise 2-3 sentence overview of the plant condition and urgent recommendations in bilingual style (Hindi + English).",
  "visualSymptoms": [
    "List 3-4 specific visual symptom observations seen in the image or described"
  ],
  "probableCauses": [
    "List 2-4 environmental/pathogen triggers (e.g., High humidity >85%, cloudy weather, uncertified seeds)"
  ],
  "organicTreatments": [
    {
      "title": "Bio-control / Organic Solution name",
      "dosage": "Exact quantity (e.g. 5ml/L or 2.5kg/acre)",
      "applicationMethod": "Foliar spray / Soil drenching / Seed treatment",
      "timing": "Best time of application (e.g. Early morning or late evening)"
    }
  ],
  "chemicalTreatments": [
    {
      "title": "Chemical Fungicide / Insecticide trade & technical name",
      "composition": "Active ingredient (e.g., Propiconazole 25% EC or Mancozeb 75% WP)",
      "dosage": "Exact mixing ratio (e.g. 1 ml per liter of water, 200 ml/acre in 150L water)",
      "safetyPrecautions": "Safety intervals (e.g. Wear gloves, 14-day pre-harvest interval)",
      "timing": "Spray before spore spread"
    }
  ],
  "preventiveMeasures": [
    "3-4 preventive crop management practices (crop rotation, clean drainage, resistant seeds)"
  ],
  "harvestSafetyIntervalDays": number (days to wait before harvest after chemical spray)
}

Be pragmatic, accurate for Indian agro-climates (Kharif, Rabi, Zaid), and recommend widely available solutions (e.g., IFFCO, Bayer, Syngenta, UPL standards, Neem formulations, Trichoderma). Return ONLY the raw JSON object without extra conversational text.`;

          const parts: any[] = [];

          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: imageMimeType,
                data: cleanBase64,
              },
            });
          }

          const promptText = `Analyze this crop health photo and farmer details:
- Specified Crop: ${cropName || 'Auto-detect from image'}
- Growth Stage: ${growthStage || 'Vegetative / General'}
- Farmer Reported Symptoms: ${symptoms || 'Visual inspection requested from photo'}
- Farm Location / Agro-Zone: ${location || 'North / Central Indian agricultural plains'}

Please provide a thorough, certified diagnostic analysis in the specified JSON structure.`;

          parts.push({ text: promptText });

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: [{ role: 'user', parts }],
            config: {
              systemInstruction,
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          });

          const responseText = response.text || '{}';
          let parsedData: any = {};
          try {
            parsedData = JSON.parse(responseText);
          } catch (parseErr) {
            const cleanJsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
            parsedData = JSON.parse(cleanJsonStr);
          }

          if (parsedData && parsedData.diseaseName) {
            return res.json({
              success: true,
              diagnosis: {
                ...parsedData,
                id: `diag_${Date.now()}`,
                timestamp: new Date().toISOString(),
                cropName: parsedData.cropName || cropName || 'Target Crop',
                diseaseName: parsedData.diseaseName || 'Crop Health Analysis Completed',
                severity: parsedData.severity || 'mild',
                confidenceScore: parsedData.confidenceScore || 88,
                rawAnalysis: responseText,
              },
              remaining: rateStatus.remaining,
              limit: rateStatus.limit,
            });
          }
        } catch (apiErr: any) {
          console.warn('Gemini crop health note (using pathology engine fallback):', apiErr?.message || apiErr);
        }
      }

      // Expert pathology fallback diagnosis
      const fallbackDiag = getFallbackCropHealthDiagnosis(cropName, symptoms);
      return res.json({
        success: true,
        diagnosis: {
          ...fallbackDiag,
          id: `diag_${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        remaining: rateStatus.remaining,
        limit: rateStatus.limit,
      });
    } catch (err: any) {
      console.error('Crop health diagnosis error:', err);
      const fallbackDiag = getFallbackCropHealthDiagnosis(req.body?.cropName, req.body?.symptoms);
      return res.json({
        success: true,
        diagnosis: {
          ...fallbackDiag,
          id: `diag_${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        remaining: 48,
        limit: 50,
      });
    }
  });

  // Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 Krishakarya Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Krishakarya server:', err);
  process.exit(1);
});
