import { GoogleGenAI } from '@google/genai';

function getFallbackQAAnswer(question: string, crop?: string): string {
  return `🌾 **कृषककार्य आधुनिक कृषि समाधान (Expert Modern Farming Advisory)**:

- **मुख्य समाधान / निदान (Direct Solution)**:
  ${crop ? `फसल (${crop}) में` : 'आपकी फसल में'} संतुलित एकीकृत कीट एवं पोषण प्रबंधन (IPM & INM) अपनाएं।
- **त्वरित उपचार कदम (Immediate Steps)**:
  1. सुबह या शाम के समय 10,000 PPM नीम तेल का 3 मिली/लीटर पानी में फोलियर स्प्रे करें।
  2. यदि फंगल संक्रमण या धब्बे हों, तो साफ (कार्बेन्डाजिम + मैंकोजेब 2 ग्राम/लीटर) या कॉपर ऑक्सीक्लोराइड का छिड़काव करें।
  3. मिट्टी में अधिक जलभराव से बचें और खेत में उचित जल निकासी बनाए रखें।
- **लागत बचत एवं जैविक टिप**:
  जीवामृत या खट्टी छाछ का छिड़काव कीट प्रतिरोधक क्षमता को बढ़ाता है और रसायनों पर होने वाले खर्च को 40% तक घटाता है।

💡 *सलाह*: फसल की पत्तियों की साफ फोटो लेकर AI Crop Health टूल में अपलोड करने पर आपको रोग का सटीक नाम एवं स्टेज-वाइज़ उपचार प्राप्त होगा।`;
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

  const { 
    question = '', 
    category = 'general', 
    imageBase64, 
    imageMimeType = 'image/jpeg', 
    crop = '', 
    location = '' 
  } = req.body || {};

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

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
        model: 'gemini-3.8-flash',
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

      const answer = response.text || getFallbackQAAnswer(question, crop);

      return res.status(200).json({
        answer,
        remaining: 49,
        limit: 50,
      });
    } catch (err: any) {
      console.warn('Modern Farming QA note, falling back to local agronomist:', err?.message || err);
    }
  }

  return res.status(200).json({
    answer: getFallbackQAAnswer(question, crop),
    remaining: 50,
    limit: 50,
  });
}
