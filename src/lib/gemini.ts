import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

const getApiKeys = () => {
  const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(k => k !== "");
  return keys;
};

const getRandomApiKey = (keys: string[]) => {
  const index = Math.floor(Math.random() * keys.length);
  return keys[index];
};

export const callGeminiWithRetry = async (
  prompt: string, 
  config: any = {}, 
  maxRetries = 3, 
  toastId?: string | number,
  updateQuotaError?: (time: number) => void
) => {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("Gemini API Key is missing.");
  
  let retries = 0;
  while (retries < maxRetries) {
    const apiKey = getRandomApiKey(keys);
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-1.5-flash";
    
    try {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });
    } catch (err: any) {
      const isQuotaError = err?.message?.includes('429') || 
                         err?.status === 429 || 
                         JSON.stringify(err).includes('429') ||
                         err?.message?.toLowerCase().includes('quota');
      
      if (isQuotaError) {
        if (updateQuotaError) updateQuotaError(Date.now());
        
        // Rotate key on 429
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        
        if (retries < maxRetries - 1) {
          retries++;
          const delay = Math.pow(2, retries) * 2000; // 4s, 8s
          const msg = `AI is busy, retrying... (Attempt ${retries}/${maxRetries-1})`;
          if (toastId) {
            toast.loading(msg, { id: toastId });
          } else {
            console.warn(msg);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw err;
    }
  }
};
