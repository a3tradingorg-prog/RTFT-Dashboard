import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Server-side Supabase features will be disabled.");
}

const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/news-proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const data = await response.text();
      res.send(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/yahoo-finance", async (req, res) => {
    try {
      const symbol = req.query.symbol as string;
      if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
      }

      console.log(`[Yahoo Finance] Fetching data for: ${symbol}`);
      const result = await yahooFinance.quote(symbol);
      res.json(result);
    } catch (error: any) {
      console.error("Yahoo Finance error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch Yahoo Finance data" });
    }
  });

  app.get("/api/forex-calendar", async (req, res) => {
    try {
      const url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
      console.log(`[Forex Calendar] Fetching from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Forex Factory API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Forex Calendar error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch Forex Factory calendar" });
    }
  });

  app.get("/api/finnhub", async (req, res) => {
    try {
      const endpoint = req.query.endpoint as string;
      const params = req.query.params as string;
      const finnhubKey = process.env.VITE_FINNHUB_API_KEY;

      if (!finnhubKey) {
        return res.status(500).json({ error: "Finnhub API Key is missing on server" });
      }

      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required" });
      }

      const url = new URL(`https://finnhub.io/api/v1/${endpoint}`);
      url.searchParams.append("token", finnhubKey);
      
      if (params) {
        try {
          const parsedParams = JSON.parse(params);
          for (const [key, value] of Object.entries(parsedParams)) {
            url.searchParams.append(key, String(value));
          }
        } catch (e) {
          console.warn("Failed to parse Finnhub params:", params);
        }
      }

      console.log(`[Finnhub] Fetching: ${url.origin}${url.pathname}?token=***${url.search.split('token=')[1]?.substring(5) || ''}`);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Finnhub] API Error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: `Finnhub API Error: ${errorText}` });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Finnhub proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch from Finnhub" });
    }
  });

  app.post("/api/trigger-crawler", async (req, res) => {
    try {
      const { userId, dateRange } = req.body;
      const authHeader = req.headers.authorization;
      
      // Create a request-specific Supabase client with the user's token
      const requestSupabase = (supabaseUrl && supabaseAnonKey && authHeader) 
        ? createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
          })
        : supabase;

      // Step 1: Verify connection to Supabase and check for the script
      if (requestSupabase) {
        const { data: scriptData, error: scriptError } = await requestSupabase
          .storage
          .from('crawler-scripts')
          .download('market_data_crawler.py');
        
        if (scriptError) {
          console.warn("Python script not found in Supabase Storage, using built-in fallback logic:", scriptError.message);
        } else {
          console.log("Successfully connected to Supabase and retrieved market_data_crawler.py");
        }
      }

      // Step 2: Execute the crawling logic (Simulating the Python script's behavior)
      // We'll use the JSON feed as the primary source as it's much more reliable than scraping HTML
      const primaryUrl = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
      console.log(`Triggering fetch for: ${primaryUrl}`);
      
      let response = await fetch(primaryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      
      let dataPreview = "";
      let source = "Forex Factory (JSON Feed)";

      if (response.ok) {
        const jsonData = await response.json();
        dataPreview = JSON.stringify(jsonData).substring(0, 5000);
      } else {
        console.warn(`Primary JSON fetch failed with status: ${response.status}. Trying HTML fallback...`);
        // Fallback to HTML scraping if JSON feed is unavailable
        const fallbackUrl = "https://www.forexfactory.com/calendar";
        response = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          }
        });

        if (response.ok) {
          const html = await response.text();
          dataPreview = html.substring(0, 5000);
          source = "Forex Factory (HTML Scraping)";
        }
      }

      if (!response.ok) {
        console.warn(`HTML fallback failed with status: ${response.status}. Trying Investing.com...`);
        const fallbackUrl2 = "https://www.investing.com/economic-calendar/";
        response = await fetch(fallbackUrl2, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          dataPreview = html.substring(0, 5000);
          source = "Investing.com (HTML Scraping)";
        }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error body");
        throw new Error(`Failed to fetch from all sources. Last Status: ${response.status}. Body: ${errorText.substring(0, 100)}`);
      }
      
      const timestamp = new Date().toISOString();
      const rawOutput = `PYTHON CRAWLER OUTPUT (${timestamp}):\n\nSource: ${source}\n\nData Preview:\n${dataPreview}...`;

      // Save to Supabase if client is available and userId is provided
      if (requestSupabase && userId) {
        const { error: saveError } = await requestSupabase
          .from('news_analyses')
          .insert({
            user_id: userId,
            date_range: dateRange || 'Today',
            raw_output: rawOutput,
            analysis_json: {
              categories: [],
              overall_summary: "Data crawled via Python-based script simulation. Deep analysis required to generate structured insights."
            },
            summary_text: "Raw market data successfully crawled and stored."
          });
        
        if (saveError) console.warn("Failed to save crawler result to Supabase:", JSON.stringify(saveError));
      }
      
      res.json({
        status: "success",
        source,
        timestamp,
        data_preview: dataPreview
      });
    } catch (error: any) {
      console.error("Crawler trigger error:", error);
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Gemini API Proxy with Model Rotation
  app.post("/api/gemini", async (req, res) => {
    console.log(`[Server Gemini] Received request for prompt: ${req.body.prompt?.substring(0, 50)}...`);
    const { prompt, config } = req.body;
    const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const allKeys = keysStr.split(",").map(k => k.trim()).filter(k => k !== "");
    
    if (allKeys.length === 0) {
      console.error("[Server Gemini] No API keys found in environment.");
      return res.status(500).json({ error: "Gemini API Key is missing on server." });
    }

    const MODELS = [
      "gemini-3-flash-preview",
      "gemini-3.1-pro-preview",
      "gemini-flash-latest",
      "gemini-2.0-flash"
    ];

    let lastError: any = null;

    for (const modelName of MODELS) {
      const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
      
      for (const apiKey of shuffledKeys) {
        try {
          console.log(`[Server Gemini] Attempting with model: ${modelName}`);
          const ai = new GoogleGenAI({ apiKey: apiKey });
          
          const result = await ai.models.generateContent({
            model: modelName,
            contents: prompt
          });
          
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!text) {
            console.error(`[Server Gemini] Empty response from ${modelName}:`, JSON.stringify(result));
            throw new Error("Invalid response structure from Gemini");
          }
          
          console.log(`[Server Gemini] Success with model: ${modelName}`);
          return res.json({
            text: text,
            candidates: result.candidates,
            usageMetadata: result.usageMetadata
          });
        } catch (err: any) {
          lastError = err;
          console.error(`[Server Gemini] Error with model ${modelName}:`, err?.message || err);
          const isQuotaError = err?.message?.includes('429') || 
                             err?.status === 429 || 
                             JSON.stringify(err).includes('429') ||
                             err?.message?.toLowerCase().includes('quota');
          
          const isInvalidKey = err?.message?.includes('API key not valid') || 
                               err?.status === 400 || 
                               JSON.stringify(err).includes('API_KEY_INVALID');
          
          if (isQuotaError) {
            console.warn(`[Server Gemini] Key exhausted for ${modelName}. Trying next key...`);
            continue;
          }

          if (isInvalidKey) {
            console.warn(`[Server Gemini] Invalid API key detected for ${modelName}. Trying next key...`);
            continue;
          }
          
          console.error(`[Server Gemini] Error with model ${modelName}:`, err);
          continue;
        }
      }
      console.warn(`[Server Gemini] All keys exhausted for ${modelName}. Trying next model...`);
    }

    console.error("[Server Gemini] All attempts failed.");
    const isQuotaError = lastError?.message?.includes('429') || 
                       lastError?.status === 429 || 
                       JSON.stringify(lastError).includes('429');

    res.status(isQuotaError ? 429 : 500).json({ 
      error: lastError?.message || "All Gemini models/keys failed on server.",
      status: isQuotaError ? 429 : 500
    });
  });

  // Request logging middleware (only for non-API requests that fall through to Vite/Static)
  app.use((req, res, next) => {
    // Skip logging for common Vite/HMR/Asset requests to reduce noise
    const isViteInternal = 
      req.url.includes('@vite') || 
      req.url.includes('@id') || 
      req.url.includes('node_modules') ||
      req.url.startsWith('/src/') ||
      req.url.match(/\.(tsx|ts|jsx|js|css|scss|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);

    if (!isViteInternal && req.url !== '/') {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware initialized.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // API 404 handler
    app.all('/api/*', (req, res) => {
      res.status(404).json({ status: "error", message: `API route not found: ${req.method} ${req.url}` });
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global error handler:", err);
    res.status(err.status || 500).json({
      status: "error",
      message: err.message || "Internal Server Error"
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
