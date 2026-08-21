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
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
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

      // Build conversation contents for Gemini
      const contents: any[] = [];
      
      // Add previous history turns if available (last 6 turns max)
      const recentHistory = history.slice(-6);
      for (const item of recentHistory) {
        contents.push({
          role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.text }]
        });
      }

      // Current prompt
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

      const textResponse = response.text || 'मुझे आपकी मदद करने में खुशी होगी। कृपया अपना कृषि प्रश्न दोबारा पूछें।';

      return res.json({
        reply: textResponse,
        remaining: rateStatus.remaining,
        limit: rateStatus.limit,
      });
    } catch (err: any) {
      console.error('Krishak A.I chat error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to process AI chat request. Please try again.',
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

      // If user uploaded a photo for disease/pest diagnosis
      if (imageBase64) {
        // Strip data URI prefix if present
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
        contents: [
          {
            role: 'user',
            parts
          }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
        }
      });

      const answer = response.text || 'कृषि समाधान तैयार नहीं हो सका। कृपया पुनः प्रयास करें।';

      return res.json({
        answer,
        remaining: rateStatus.remaining,
        limit: rateStatus.limit,
      });
    } catch (err: any) {
      console.error('Modern Farming QA error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to generate modern farming answer.',
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

      return res.json({
        calculation: response.text || 'Calculation generated successfully.',
        remaining: rateStatus.remaining,
        limit: rateStatus.limit,
      });
    } catch (err: any) {
      console.error('Crop calculator error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to calculate crop requirements.',
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
