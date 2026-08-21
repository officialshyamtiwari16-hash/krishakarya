import { GoogleGenAI } from '@google/genai';

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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history = [], userContext } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const ai = getGenAI();

    const systemPrompt = `You are Krishak A.I (कृषक ए.आई), a dedicated, wise, and friendly agricultural AI assistant integrated into the Krishakarya platform.
Krishakarya is an Indian agriculture ecosystem connecting farmers, Sahyogi agricultural laborers, and machinery owners.
Your role:
1. Provide accurate, practical, and actionable agronomy guidance for Indian crops (Wheat, Paddy, Mustard, Sugarcane, Cotton, Pulses, Vegetables, Fruits, etc.).
2. Help with modern farming techniques (drip irrigation, drone spraying, precision agriculture, nano fertilizers, solar pumps).
3. Offer quick calculations for seed rates, fertilizer doses (NPK, Urea, DAP, Potash), labor wage estimates, and machinery rental costs.
4. Explain government schemes (PM-Kisan, PM Fasal Bima Yojana, Subsidies on Tractors/Harvesters, Soil Health Card).
5. Always be polite, respectful (use "राम राम" or warm greetings), practical, and concise. Format with clear bullet points, bold key terms, and numbers.
6. Support multi-lingual responses: Reply in the language the user asked in (Hindi, Hinglish, English, etc.).
${userContext ? `User context: Farmer ${userContext.name || 'Member'} from ${userContext.village || ''} ${userContext.district || ''}, ${userContext.state || ''}, farm size ${userContext.farmSizeAcres || 0} acres.` : ''}`;

    const contents: any[] = [];
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    for (const item of recentHistory) {
      if (item && item.text) {
        contents.push({
          role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(item.text) }]
        });
      }
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

    const textResponse = response.text || 'मुझे आपकी मदद करने में खुशी होगी। कृपया अपना कृषि प्रश्न दोबारा पूछें।';

    return res.status(200).json({
      reply: textResponse,
      remaining: 49,
      limit: 50,
    });
  } catch (err: any) {
    console.error('Krishak A.I chat error (Vercel):', err);
    return res.status(500).json({
      error: err?.message || 'Failed to process AI chat request.',
    });
  }
}
