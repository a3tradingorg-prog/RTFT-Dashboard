import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

const getApiKeys = () => {
  // Check both Vite-style and process-style environment variables
  const keysStr = 
    ((import.meta as any).env?.VITE_GEMINI_API_KEYS) || 
    (process.env.GEMINI_API_KEYS) ||
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (process.env.GEMINI_API_KEY) ||
    "";
    
  const keys = keysStr.split(",").map(k => k.trim()).filter(k => k !== "");
  
  if (keys.length > 0) {
    console.log(`[Gemini] Initialized with ${keys.length} API keys.`);
  } else {
    console.warn("[Gemini] No API keys found. Please check your environment variables.");
  }
  
  return keys;
};

export const callGeminiWithRetry = async (
  prompt: string, 
  config: any = {}, 
  maxRetries = 3, 
  toastId?: string | number,
  updateQuotaError?: (time: number) => void
) => {
  const allKeys = getApiKeys();
  if (allKeys.length === 0) throw new Error("Gemini API Key is missing.");
  
  let retries = 0;
  let lastError: any = null;

  while (retries < maxRetries) {
    // Shuffle keys for each retry attempt to distribute load
    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledKeys.length; i++) {
      const apiKey = shuffledKeys[i];
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      try {
        return await ai.models.generateContent({
          model,
          contents: prompt,
          config
        });
      } catch (err: any) {
        lastError = err;
        const isQuotaError = err?.message?.includes('429') || 
                           err?.status === 429 || 
                           JSON.stringify(err).includes('429') ||
                           err?.message?.toLowerCase().includes('quota');
        
        if (isQuotaError) {
          // If it's a quota error, try the NEXT key immediately
          console.warn(`Key ${apiKey.substring(0, 8)}... exhausted. Trying next key (${i + 1}/${shuffledKeys.length})`);
          continue; 
        }
        
        // For other errors, we might want to retry this key or move on
        // But for now, let's just move to the next key to be safe
        continue;
      }
    }

    // If we reached here, it means ALL keys failed in this pass
    const isQuotaError = lastError?.message?.includes('429') || 
                       lastError?.status === 429 || 
                       JSON.stringify(lastError).includes('429') ||
                       lastError?.message?.toLowerCase().includes('quota');

    if (isQuotaError && updateQuotaError) {
      // Only trigger global quota error if ALL keys failed
      updateQuotaError(Date.now());
    }

    if (retries < maxRetries - 1) {
      retries++;
      const delay = Math.pow(2, retries) * 2000; // 4s, 8s
      const msg = `All ${allKeys.length} keys busy, retrying in ${delay/1000}s... (Attempt ${retries}/${maxRetries-1})`;
      
      if (toastId) {
        toast.loading(msg, { id: toastId });
      } else {
        console.warn(msg);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    break;
  }

  throw lastError || new Error("All Gemini API keys failed after multiple attempts.");
};
