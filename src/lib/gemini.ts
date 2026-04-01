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

const MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite-preview"
];

export const callGeminiWithRetry = async (
  prompt: string, 
  config: any = {}, 
  maxRetries = 3, 
  toastId?: string | number,
  updateQuotaError?: (time: number) => void
) => {
  const allKeys = getApiKeys();
  if (allKeys.length === 0) throw new Error("Gemini API Key is missing.");
  
  // 1. Attempt Backend Proxy Call First
  try {
    console.log("[Gemini] Attempting backend proxy call...");
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, config })
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }

    if (response.status === 429) {
      console.warn("[Gemini] Backend rate limited (429). Falling back to client-side rotation.");
      if (toastId) toast.loading("Backend busy, switching to direct client-side connection...", { id: toastId });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Gemini] Backend error:", errorData);
    }
  } catch (err) {
    console.error("[Gemini] Failed to reach backend proxy:", err);
  }

  // 2. Client-Side Fallback with Key & Model Rotation
  let lastError: any = null;

  for (const modelName of MODELS) {
    console.log(`[Gemini] Trying model: ${modelName}`);
    
    // Shuffle keys for each model attempt
    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledKeys.length; i++) {
      const apiKey = shuffledKeys[i];
      const ai = new GoogleGenAI({ apiKey });
      
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config
        });
        return result;
      } catch (err: any) {
        lastError = err;
        const isQuotaError = err?.message?.includes('429') || 
                           err?.status === 429 || 
                           JSON.stringify(err).includes('429') ||
                           err?.message?.toLowerCase().includes('quota');
        
        if (isQuotaError) {
          console.warn(`[Gemini] Key ${apiKey.substring(0, 8)}... exhausted for ${modelName}. Trying next key...`);
          continue; 
        }
        
        console.error(`[Gemini] Error with model ${modelName} and key ${apiKey.substring(0, 8)}...:`, err);
        continue;
      }
    }
    
    console.warn(`[Gemini] All keys exhausted for model ${modelName}. Trying next model...`);
  }

  // If we reached here, ALL models and ALL keys failed
  if (updateQuotaError) {
    updateQuotaError(Date.now());
  }

  throw lastError || new Error("All Gemini API models and keys failed after multiple attempts.");
};
