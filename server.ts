import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';

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

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

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
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey });
          
          const result = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config
          });
          
          return res.json(result);
        } catch (err: any) {
          lastError = err;
          const isQuotaError = err?.message?.includes('429') || 
                             err?.status === 429 || 
                             JSON.stringify(err).includes('429') ||
                             err?.message?.toLowerCase().includes('quota');
          
          if (isQuotaError) {
            console.warn(`[Server Gemini] Key exhausted for ${modelName}. Trying next key...`);
            continue;
          }
          
          console.error(`[Server Gemini] Error with model ${modelName}:`, err);
          continue;
        }
      }
      console.warn(`[Server Gemini] All keys exhausted for ${modelName}. Trying next model...`);
    }

    const isQuotaError = lastError?.message?.includes('429') || 
                       lastError?.status === 429 || 
                       JSON.stringify(lastError).includes('429');

    res.status(isQuotaError ? 429 : 500).json({ 
      error: lastError?.message || "All Gemini models/keys failed on server.",
      status: isQuotaError ? 429 : 500
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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
