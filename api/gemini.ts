import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, config } = req.body;
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const allKeys = keysStr.split(",").map(k => k.trim()).filter(k => k !== "");
  
  if (allKeys.length === 0) {
    return res.status(500).json({ error: "Gemini API Key is missing on server." });
  }

  const MODELS = [
    "gemini-3-flash-preview",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite-preview"
  ];

  let lastError: any = null;

  for (const modelName of MODELS) {
    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
    
    for (const apiKey of shuffledKeys) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        const result = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config
        });
        
        return res.status(200).json(result);
      } catch (err: any) {
        lastError = err;
        const isQuotaError = err?.message?.includes('429') || 
                           err?.status === 429 || 
                           JSON.stringify(err).includes('429') ||
                           err?.message?.toLowerCase().includes('quota');
        
        if (isQuotaError) {
          console.warn(`[Vercel Gemini] Key exhausted for ${modelName}. Trying next key...`);
          continue;
        }
        
        console.error(`[Vercel Gemini] Error with model ${modelName}:`, err);
        continue;
      }
    }
    console.warn(`[Vercel Gemini] All keys exhausted for ${modelName}. Trying next model...`);
  }

  const isQuotaError = lastError?.message?.includes('429') || 
                     lastError?.status === 429 || 
                     JSON.stringify(lastError).includes('429');

  res.status(isQuotaError ? 429 : 500).json({ 
    error: lastError?.message || "All Gemini models/keys failed on server.",
    status: isQuotaError ? 429 : 500
  });
}
