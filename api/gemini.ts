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
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro"
  ];

  let lastError: any = null;

  for (const modelName of MODELS) {
    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
    
    for (const apiKey of shuffledKeys) {
      try {
        const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' });
        
        const result = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: config
        });
        
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
          console.error(`[Vercel Gemini] Empty response from ${modelName}:`, JSON.stringify(result));
        }

        return res.status(200).json({
          text: text,
          candidates: result.candidates,
          usageMetadata: result.usageMetadata
        });
      } catch (err: any) {
        lastError = err;
        console.error(`[Vercel Gemini] Error with model ${modelName}:`, err?.message || err);
        const isQuotaError = err?.message?.includes('429') || 
                           err?.status === 429 || 
                           JSON.stringify(err).includes('429') ||
                           err?.message?.toLowerCase().includes('quota');
        
        if (isQuotaError) {
          console.warn(`[Vercel Gemini] Key exhausted for ${modelName}. Trying next key...`);
          continue;
        }

        const isInvalidKey = err?.message?.includes('API key not valid') || 
                            err?.status === 400 || 
                            JSON.stringify(err).includes('API_KEY_INVALID');
        
        if (isInvalidKey) {
          console.warn(`[Vercel Gemini] Invalid API key detected for ${modelName}. Trying next key...`);
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
