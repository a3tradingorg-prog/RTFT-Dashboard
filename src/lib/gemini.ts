import { toast } from "sonner";

export const callGeminiWithRetry = async (
  prompt: string, 
  config: any = {}, 
  maxRetries = 2, 
  toastId?: string | number,
  updateQuotaError?: (time: number) => void
) => {
  const { provider = 'Gemini', userApiKey } = config;

  if (!userApiKey) {
    throw new Error(`Please configure your ${provider} API Key in the AI Settings.`);
  }

  // Use the backend proxy for all requests to ensure clean handling and avoid CORS if any
  try {
    const endpoint = 
      provider === 'ChatGPT' ? "/api/openai" : 
      provider === 'ManuAI' ? "/api/manuai" : 
      "/api/gemini";
    
    const response = await fetch(endpoint, {
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
      errorData = await response.json();
    } else {
      errorData = { error: await response.text().catch(() => response.statusText) };
    }

    if (response.status === 429) {
      if (updateQuotaError) updateQuotaError(Date.now());
      throw new Error(`Your ${provider} API quota has been reached. Please check your billing or wait a moment.`);
    }

    throw new Error(errorData.error || `${provider} API Error: ${response.status}`);
  } catch (err: any) {
    console.error(`[AI] ${provider} request failed:`, err);
    throw err;
  }
};
