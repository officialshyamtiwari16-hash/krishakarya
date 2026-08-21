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
    const { 
      question, 
      category = 'general', 
      imageBase64, 
      imageMimeType = 'image/jpeg', 
      crop, 
      location 
    } = req.body || {};

    if (!question && !imageBase64) {
      return res.status(400).json({ error: 'Question or crop photo is required.' });
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

    if (imageBase64 && typeof imageBase64 === 'string') {
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

    return res.status(200).json({
      answer,
      remaining: 49,
      limit: 50,
    });
  } catch (err: any) {
    console.error('Modern Farming QA error (Vercel):', err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate modern farming answer.',
    });
  }
}
