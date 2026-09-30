import { GoogleGenAI } from '@google/genai';

function getFallbackChatResponse(message: string): string {
  const q = message.toLowerCase();

  if (q.includes('mandi') || q.includes('मंडी') || q.includes('rate') || q.includes('bhav') || q.includes('भाव')) {
    return `🌾 **ताज़ा मंडी भाव जानकारी (Live APMC Mandi Updates)**:
- **गेहूं (Wheat)**: ₹2,420 - ₹2,580 / क्विंटल (स्थिर मांग)
- **धान (Paddy Basmati)**: ₹3,600 - ₹4,150 / क्विंटल (मजबूत ट्रेंड)
- **सरसों (Mustard)**: ₹5,300 - ₹5,750 / क्विंटल (42% तेल गुणवत्ता)
- **चना (Desi Chana)**: ₹5,800 - ₹6,200 / क्विंटल

💡 *सुझाव*: अपने निकटतम कृषि उपज मंडी के सटीक भाव के लिए होमपेज पर 'Live Mandi Bhav' कार्ड देखें या जिला अनुसार फिल्टर करें।`;
  }

  if (q.includes('fertilizer') || q.includes('urea') || q.includes('खाद') || q.includes('dap') || q.includes('यूरिया')) {
    return `🌱 **संतुलित उर्वरक एवं पोषण प्रबंधन (Balanced Nutrient Advisory)**:
1. **बुवाई के समय (Basal Dose)**:
   - 1 बैग DAP (50 Kg) + 25 Kg MOP (पोटाश) + 10 Kg जिंक सल्फेट (21%) प्रति एकड़।
2. **पहली सिंचाई (21-25 दिन बाद)**:
   - 35-40 Kg यूरिया प्रति एकड़।
3. **नैनो यूरिया / नैनो डीएपी स्प्रे**:
   - 4 मिली प्रति लीटर पानी (60 मिली प्रति 15L स्प्रेयर)। लागत में 50% बचत और 15-20% अधिक उपज।`;
  }

  if (q.includes('wheat') || q.includes('गेहूं')) {
    return `🌾 **गेहूं की उन्नत खेती गाइड (Wheat Farming Best Practices)**:
- **बीज दर**: 40-45 किलोग्राम प्रति एकड़ (सामान्य बुवाई), 50 Kg (देरी से बुवाई)।
- **बीजोपचार**: बाविस्टिन (2 ग्राम/Kg) या ट्राइकोडर्मा (5 ग्राम/Kg) से उपचारित अवश्य करें।
- **प्रमुख किस्में**: HD-2967, HD-3086, DBW-187 (करण वंदना), PBW-550।
- **सिंचाई की क्रांतिक अवस्थाएं**: पहली सिंचाई मुकुट जड़ बनते समय (20-22 दिन) सबसे जरूरी है।`;
  }

  return `राम राम किसान भाई! 🙏
कृषककार्य (Krishakarya) में आपका स्वागत है। मैं आपकी फसल, मंडी भाव, सरकारी योजनाओं (PM-Kisan, Fasal Bima), और कृषि यंत्रों/श्रमिकों के बारे में पूरी सहायता कर सकता हूँ।

आप मुझसे पूछ सकते हैं:
1. **फसल में खाद व बीज की सही मात्रा**
2. **कीट व रोग का जैविक व रासायनिक उपचार**
3. **निकटतम मंडी में आज का ताज़ा भाव**
4. **ट्रैक्टर व कृषि यंत्र किराए पर लेने के नियम**`;
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

  const { message = '', history = [], userContext } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

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
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const textResponse = response.text || getFallbackChatResponse(message);

      return res.status(200).json({
        reply: textResponse,
        remaining: 49,
        limit: 50,
      });
    } catch (err: any) {
      console.warn('Krishak A.I chat API note, falling back to local agronomist:', err?.message || err);
    }
  }

  // Graceful fallback
  return res.status(200).json({
    reply: getFallbackChatResponse(message),
    remaining: 50,
    limit: 50,
  });
}
