import { GoogleGenAI } from '@google/genai';

function getFallbackCropCalculation(crop: string, acreage: number, soilType: string, irrigation: string): string {
  const acres = Number(acreage) || 1;
  const isWheat = /wheat|गेहूं/i.test(crop);
  const isPaddy = /paddy|rice|धान/i.test(crop);
  const isMustard = /mustard|सरसों/i.test(crop);

  let seedKgPerAcre = 40;
  let dapKgPerAcre = 50;
  let ureaKgPerAcre = 80;
  let mopKgPerAcre = 25;
  let expectedYield = '18 - 24 Quintals/Acre';

  if (isPaddy) {
    seedKgPerAcre = 6; // Nursery
    dapKgPerAcre = 45;
    ureaKgPerAcre = 90;
    mopKgPerAcre = 30;
    expectedYield = '22 - 28 Quintals/Acre';
  } else if (isMustard) {
    seedKgPerAcre = 2;
    dapKgPerAcre = 35;
    ureaKgPerAcre = 50;
    mopKgPerAcre = 15;
    expectedYield = '8 - 12 Quintals/Acre';
  }

  const totalSeed = seedKgPerAcre * acres;
  const totalDap = dapKgPerAcre * acres;
  const totalUrea = ureaKgPerAcre * acres;
  const totalMop = mopKgPerAcre * acres;
  const estimatedCost = Math.round(acres * 6500);

  return `📊 **सटीक कृषि इनपुट गणना (Input Calculator for ${crop})**:
- **कुल रकबा**: ${acres} एकड़ (${(acres * 0.4047).toFixed(2)} हेक्टेयर)
- **मिट्टी प्रकार**: ${soilType} | **सिंचाई**: ${irrigation}

---
### 1. बीज आवश्यकता एवं बीजोपचार:
- **कुल बीज आवश्यकता**: **${totalSeed} Kg** (${seedKgPerAcre} Kg/एकड़)
- **बीजोपचार (Seed Treatment)**: बाविस्टिन 2.5 ग्राम प्रति Kg बीज या ट्राइकोडर्मा विरिडे 5 ग्राम प्रति Kg बीज।

---
### 2. उर्वरक प्रबंधन (Fertilizer Schedule):
- **बुवाई के समय (Basal)**: 
  - DAP: **${totalDap} Kg** (${Math.ceil(totalDap / 50)} बैग)
  - MOP (पोटाश): **${totalMop} Kg** (${(totalMop / 50).toFixed(1)} बैग)
  - जिंक सल्फेट 21%: **${acres * 10} Kg**
- **पहली टॉप ड्रेसिंग (20-25 दिन बाद)**: यूरिया **${Math.round(totalUrea * 0.5)} Kg** + सिंचाई।
- **दूसरी टॉप ड्रेसिंग (40-45 दिन बाद)**: यूरिया **${Math.round(totalUrea * 0.5)} Kg**।

---
### 3. आधुनिक नैनो उर्वरक विकल्प:
- **इफको नैनो यूरिया**: 4 मिली प्रति लीटर पानी का फोलियर स्प्रे (25-30 दिन और 45 दिन पर)।
- **लागत में बचत**: पारंपरिक दानेदार यूरिया से 30-40% अधिक दक्षता।

---
### 4. अपेक्षित उपज एवं अनुमानित लागत:
- **अनुमानित कुल इनपुट लागत**: लगभग **₹${estimatedCost.toLocaleString('en-IN')}**
- **अपेक्षित पैदावार**: **${expectedYield}** (उत्कृष्ट कृषि क्रियाओं पर)।`;
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

  const { crop = 'Wheat / गेहूं', acreage = 1, soilType = 'Alluvial / Loamy', irrigation = 'Canal / Tube Well' } = req.body || {};

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
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
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: 'You are an Agricultural Agronomist calculating exact crop input quantities for Indian farmers. Be precise, formatted in neat tables and bullet points in Hindi and English.',
          temperature: 0.4,
        }
      });

      const calculation = response.text || getFallbackCropCalculation(crop, Number(acreage) || 1, soilType, irrigation);

      return res.status(200).json({
        calculation,
        remaining: 49,
        limit: 50,
      });
    } catch (err: any) {
      console.warn('Crop calculator note, falling back to local agronomist:', err?.message || err);
    }
  }

  return res.status(200).json({
    calculation: getFallbackCropCalculation(crop, Number(acreage) || 1, soilType, irrigation),
    remaining: 50,
    limit: 50,
  });
}
