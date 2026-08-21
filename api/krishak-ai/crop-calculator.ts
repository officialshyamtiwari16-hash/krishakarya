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
    const { crop, acreage, soilType = 'Alluvial / Loamy', irrigation = 'Canal / Borewell' } = req.body || {};

    if (!crop || !acreage) {
      return res.status(400).json({ error: 'Crop name and acreage are required.' });
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

    return res.status(200).json({
      calculation: response.text || 'Calculation generated successfully.',
      remaining: 49,
      limit: 50,
    });
  } catch (err: any) {
    console.error('Crop calculator error (Vercel):', err);
    return res.status(500).json({
      error: err?.message || 'Failed to calculate crop requirements.',
    });
  }
}
