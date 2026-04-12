import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

const getApiKeys = () => {
  let keysStr = "";
  
  try {
    // Vite-style environment variables (Bundled into client)
    keysStr = 
      ((import.meta as any).env?.VITE_GEMINI_API_KEYS) || 
      ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      "";
      
    // Fallback to process.env (Only works in some environments or if polyfilled)
    if (!keysStr && typeof process !== 'undefined' && process.env) {
      keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    }
  } catch (e) {
    console.warn("[Gemini] Error reading environment variables:", e);
  }
    
  const keys = keysStr.split(",").map(k => k.trim()).filter(k => k !== "");
  
  if (keys.length > 0) {
    console.log(`[Gemini] Client-side fallback initialized with ${keys.length} API keys.`);
  } else {
    console.warn("[Gemini] No VITE_GEMINI_API_KEYS found for client-side fallback. Only backend proxy will be used.");
  }
  
  return keys;
};

const MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-flash-latest",
  "gemini-2.0-flash"
];

export const callGeminiWithRetry = async (
  prompt: string, 
  config: any = {}, 
  maxRetries = 3, 
  toastId?: string | number,
  updateQuotaError?: (time: number) => void
) => {
  // 1. Attempt Backend Proxy Call First
  let backendRateLimited = false;
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

    let errorData: any = {};
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      errorData = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => "");
      errorData = { error: text || response.statusText };
    }

    if (response.status === 429) {
      backendRateLimited = true;
      console.warn("[Gemini] Backend rate limited (429). Falling back to client-side rotation.");
      if (toastId) toast.loading("Backend busy, switching to direct client-side connection...", { id: toastId });
    } else {
      console.error("[Gemini] Backend error:", errorData);
    }
  } catch (err) {
    console.error("[Gemini] Failed to reach backend proxy:", err);
  }

  // 2. Client-Side Fallback with Key & Model Rotation
  const allKeys = getApiKeys();
  if (allKeys.length === 0) {
    const errorMsg = "Gemini API Key is missing for client-side fallback. Please add VITE_GEMINI_API_KEYS to your environment variables.";
    console.error(`[Gemini] ${errorMsg}`);
    if (backendRateLimited && updateQuotaError) {
      updateQuotaError(Date.now());
    }
    throw new Error(errorMsg);
  }

  let lastError: any = null;

  for (const modelName of MODELS) {
    console.log(`[Gemini] Trying model: ${modelName}`);
    
    // Shuffle keys for each model attempt
    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledKeys.length; i++) {
      const apiKey = shuffledKeys[i];
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: config
        });
        
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
          console.error(`[Gemini] Empty response from ${modelName}:`, JSON.stringify(result));
          throw new Error("Invalid response structure from Gemini");
        }
        
        return { text };
      } catch (err: any) {
        lastError = err;
        console.error(`[Gemini] Error with model ${modelName} and key ${apiKey.substring(0, 8)}...:`, err?.message || err);
        
        const isQuotaError = err?.message?.includes('429') || 
                           err?.status === 429 || 
                           JSON.stringify(err).includes('429') ||
                           err?.message?.toLowerCase().includes('quota');
        
        if (isQuotaError) {
          console.warn(`[Gemini] Key ${apiKey.substring(0, 8)}... exhausted for ${modelName}. Trying next key...`);
          continue; 
        }

        const isInvalidKey = err?.message?.includes('API key not valid') || 
                            err?.status === 400 || 
                            JSON.stringify(err).includes('API_KEY_INVALID');
        
        if (isInvalidKey) {
          console.warn(`[Gemini] Invalid API key detected for ${modelName}. Trying next key...`);
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
