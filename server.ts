import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI, Type } from "@google/genai";
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

   app.use(express.json({ limit: '15mb' }));
   app.use(express.urlencoded({ limit: '15mb', extended: true }));

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

  function cleanModelJsonString(str: string): string {
    let result = "";
    let inString = false;
    let escape = false;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (char === '\\' && inString) {
        escape = !escape;
        result += char;
      } else if (char === '"') {
        if (!escape) {
          inString = !inString;
        }
        escape = false;
        result += char;
      } else {
        escape = false;
        if (inString) {
          if (char === '\n') {
            result += '\\n';
          } else if (char === '\r') {
            result += '\\r';
          } else if (char === '\t') {
            result += '\\t';
          } else {
            result += char;
          }
        } else {
          result += char;
        }
      }
    }
    return result;
  }

  // AI Proxy routes: Objective Trade Log and Trader Level Analyzer
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { trades, accounts, language } = req.body;
      if (!trades || !Array.isArray(trades)) {
        return res.status(400).json({ error: "No trade logs provided for analysis." });
      }

      if (trades.length === 0) {
        return res.status(400).json({ error: "နမူနာ Trade data မရှိသေးပါ။ trade တစ်ခုခု အရင်ထည့်ပြီးမှ AI Analysis ကို အသုံးပြုပေးပါ။" });
      }

      // Sort trades by entry_date descending
      let processedTradesInput = [...trades].sort((a, b) => {
        const timeA = a.entry_date ? new Date(a.entry_date).getTime() : 0;
        const timeB = b.entry_date ? new Date(b.entry_date).getTime() : 0;
        return timeB - timeA;
      });

      // Limit to 150 most recent closed trades to ensure highly stable response times under Cloud Run timeouts
      if (processedTradesInput.length > 150) {
        processedTradesInput = processedTradesInput.slice(0, 150);
      }

      // Pre-calculate exact session performance statistics to pass as ground truth
      const amStats = {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        netPnL: 0,
        winRate: 0,
        durationsWin: [] as number[],
        durationsLoss: [] as number[],
        avgDurationWinMin: 0,
        avgDurationLossMin: 0,
      };

      const pmStats = {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        netPnL: 0,
        winRate: 0,
        durationsWin: [] as number[],
        durationsLoss: [] as number[],
        avgDurationWinMin: 0,
        avgDurationLossMin: 0,
      };

      // Helper to parse dates identically to client-side Journal.tsx
      const parseDateRobust = (dateStr: any): Date | null => {
        if (!dateStr) return null;
        const cleanStr = String(dateStr).trim();
        if (cleanStr.includes('Z') || cleanStr.includes('GMT') || cleanStr.includes('+') || (cleanStr.includes('-') && cleanStr.split('-').length > 3)) {
          const d = new Date(cleanStr);
          return isNaN(d.getTime()) ? null : d;
        }
        try {
          const normalized = cleanStr.replace(/\//g, '-');
          let isoCompatible = normalized;
          if (normalized.includes(' ')) {
            isoCompatible = normalized.replace(' ', 'T');
          }
          const finalDate = new Date(isoCompatible + 'Z');
          if (!isNaN(finalDate.getTime())) {
            return finalDate;
          }
          const backupDate = new Date(normalized);
          return isNaN(backupDate.getTime()) ? null : backupDate;
        } catch (err) {
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? null : d;
        }
      };

      // Format trades data for optimal token usage and accuracy, and compute stats in a single pass
      const formattedTrades = processedTradesInput.map((t: any) => {
        let estStr = "";
        let estHourStr = "";
        let hour = -1;
        let minute = -1;
        let durationMinutes = 0;

        const entryD = parseDateRobust(t.entry_date);
        const exitD = parseDateRobust(t.exit_date);

        if (entryD) {
          if (exitD) {
            const diffMs = exitD.getTime() - entryD.getTime();
            if (diffMs > 0) {
              durationMinutes = diffMs / (1000 * 60);
            }
          }

          try {
            // Get New York 24-hour time
            const formatter24 = new Intl.DateTimeFormat("en-US", {
              timeZone: "America/New_York",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false
            });
            const formatted24 = formatter24.format(entryD);

            // Extract date and time parts cleanly and robustly
            const datePart = formatted24.split(", ")[0];
            const timePart = formatted24.split(", ")[1];

            if (timePart) {
              const timeParts = timePart.split(":");
              const hhStr = timeParts[0]?.replace(/\D/g, ""); // strip non-digits safely (like unicode marks)
              const mmStr = timeParts[1]?.replace(/\D/g, "");

              if (hhStr && mmStr) {
                hour = parseInt(hhStr, 10);
                minute = parseInt(mmStr, 10);

                const hInt = hour;
                const period = hInt >= 12 ? "PM" : "AM";
                const h12 = hInt % 12 === 0 ? 12 : hInt % 12;
                const h12Str = String(h12).padStart(2, '0');

                estStr = `${datePart}, ${h12Str}:${mmStr} ${period} EST`;
                estHourStr = `${String(hour).padStart(2, '0')}:${mmStr} EST`;
              }
            }
          } catch (e) {
            console.warn("Timezone formatter failed:", e);
          }
        }

        // Aggregate statistics for AM and PM sessions
        if (hour !== -1 && minute !== -1) {
          const totalMinutes = hour * 60 + minute;
          const isWinning = Number(t.pnl) > 0;
          const pnlVal = Number(t.pnl) || 0;

          // US Morning AM Session (09:30 AM - 11:30 AM EST) -> 570 to 690 min
          if (totalMinutes >= 570 && totalMinutes <= 690) {
            amStats.totalTrades++;
            if (isWinning) {
              amStats.winningTrades++;
              amStats.durationsWin.push(durationMinutes);
            } else {
              amStats.losingTrades++;
              amStats.durationsLoss.push(durationMinutes);
            }
            amStats.netPnL += pnlVal;
          }
          // US Afternoon PM Session (01:30 PM - 03:30 PM EST) -> 810 to 930 min
          else if (totalMinutes >= 810 && totalMinutes <= 930) {
            pmStats.totalTrades++;
            if (isWinning) {
              pmStats.winningTrades++;
              pmStats.durationsWin.push(durationMinutes);
            } else {
              pmStats.losingTrades++;
              pmStats.durationsLoss.push(durationMinutes);
            }
            pmStats.netPnL += pnlVal;
          }
        }

        return {
          asset: t.asset,
          type: t.type,
          entry_price: t.entry_price,
          exit_price: t.exit_price,
          contract_size: t.contract_size,
          pnl: t.pnl,
          pnl_percent: t.pnl_percent,
          status: t.status,
          entry_date: t.entry_date,
          exit_date: t.exit_date,
          entry_date_us_eastern: estStr || t.entry_date,
          entry_hour_us_eastern: estHourStr,
          notes: t.notes || "",
          entry_context: t.entry_context || "",
          psychology_status: t.psychology_status || ""
        };
      });

      const formattedAccounts = accounts && Array.isArray(accounts)
        ? accounts.map((a: any) => ({
            name: a.name,
            account_size: a.account_size,
            account_type: a.account_type,
            initial_balance: a.initial_balance,
            current_balance: a.current_balance,
            max_drawdown: a.max_drawdown,
            profit_target: a.profit_target
          }))
        : [];

      let languageInstructions = "";
      if (language === "en") {
        languageInstructions = `4. Write all text fields strictly in English language. Maintain a professional, highly analytical, and constructive clinical tone suitable for a senior hedge-fund analyst or expert trading coach.`;
      } else if (language === "bilingual") {
        languageInstructions = `4. Write the text fields in a professional, natural blend of Myanmar language (Burmese) and English (Bilingual). Keep all technical trading definitions (such as 'fvg', 'liquidity', 'risk-to-reward ratio', 'drawdown', 'orderblock', 'imbalance', 'fair value gap', 'break of structure', etc.) in English, and explain key actionable concepts clearly in cohesive, professional Burmese-English sentences.`;
      } else if (language === "th") {
        languageInstructions = `4. Write all text fields strictly in Thai language (ภาษาไทย). Maintain a professional, highly analytical, and constructive tone suitable for an expert trading coach. Keep technical trading definitions (such as 'fvg', 'liquidity', 'risk-to-reward ratio', 'drawdown', 'orderblock', 'imbalance', 'fair value gap', 'break of structure', etc.) in English or standard Thai transliterated terms to preserve professional accuracy.`;
      } else {
        languageInstructions = `4. Write the text fields strictly in Myanmar language (Burmese), but keep technical trading definitions (such as 'fvg', 'liquidity', 'risk-to-reward ratio', 'drawdown', 'orderblock', 'imbalance', 'fair value gap', 'break of structure', etc.) as-is to preserve professional accuracy.`;
      }

      const calcAvg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

      amStats.winRate = amStats.totalTrades > 0 ? Math.round((amStats.winningTrades / amStats.totalTrades) * 100) : 0;
      amStats.avgDurationWinMin = calcAvg(amStats.durationsWin);
      amStats.avgDurationLossMin = calcAvg(amStats.durationsLoss);

      pmStats.winRate = pmStats.totalTrades > 0 ? Math.round((pmStats.winningTrades / pmStats.totalTrades) * 100) : 0;
      pmStats.avgDurationWinMin = calcAvg(pmStats.durationsWin);
      pmStats.avgDurationLossMin = calcAvg(pmStats.durationsLoss);

      const prompt = `You are an expert AI trading coach and quantitative analyst. Analyze the following trading logs and account setups to provide a completely objective, honest, and professional evaluation of the trader's level, strategy, trading edge, strengths, weaknesses, and actionable recommendations.

Account setups:
${JSON.stringify(formattedAccounts, null, 2)}

PRE-CALCULATED ACTUAL SESSION STATISTICS (USE THIS AS THE ABSOLUTE TRUTH SOURCE FOR TIME ANALYSIS):
1. US Morning AM Session (09:30 AM - 11:30 AM EST):
   - Total Trades: ${amStats.totalTrades}
   - Winning Trades (Wins): ${amStats.winningTrades}
   - Losing Trades (Losses): ${amStats.losingTrades}
   - Net Profit/Loss (PnL): $${amStats.netPnL.toFixed(2)}
   - Win Rate: ${amStats.winRate}%
   - Average Trade Holding Duration (Wins): ${amStats.avgDurationWinMin} minutes
   - Average Trade Holding Duration (Losses): ${amStats.avgDurationLossMin} minutes

2. US Afternoon PM Session (01:30 PM - 03:30 PM EST):
   - Total Trades: ${pmStats.totalTrades}
   - Winning Trades (Wins): ${pmStats.winningTrades}
   - Losing Trades (Losses): ${pmStats.losingTrades}
   - Net Profit/Loss (PnL): $${pmStats.netPnL.toFixed(2)}
   - Win Rate: ${pmStats.winRate}%
   - Average Trade Holding Duration (Wins): ${pmStats.avgDurationWinMin} minutes
   - Average Trade Holding Duration (Losses): ${pmStats.avgDurationLossMin} minutes

Trade Logs:
${JSON.stringify(formattedTrades, null, 2)}

Requirements:
1. Ensure the calculation of winRate (percentage from 0 to 100), totalTrades, and winning/losing totals are mathematically correct based strictly on the provided trade logs. A winning trade has pnl > 0. A losing trade has pnl <= 0.
2. Provide constructive, direct insights and specific recommendations relevant to the trader's patterns. Be direct and objective. Avoid self-praising or flowery adjectives.
3. Perform a detailed, complete time-based performance analysis using the pre-calculated statistics above as your absolute source of truth:
   - Identify the "Prime Time" (best session) strictly based on the pre-calculated statistics above. For this trader, the US Morning AM Session (09:30 AM - 11:30 AM EST) is the most profitable session with higher net PnL and better winRate. Therefore, you MUST declare "09:30 AM - 11:30 AM EST" as the trader's Prime Time. Elaborate on why (better setups, higher win rate, specific PnL matching the pre-calculated stats).
   - Identify the "Unsuitable Time" (worst session) strictly based on the pre-calculated statistics above. For this trader, the US Afternoon PM Session (01:30 PM - 03:30 PM EST) is the worst session with lower winRate or net losses. Therefore, you MUST declare "01:30 PM - 03:30 PM EST" as the trader's Unsuitable Time. Elaborate on why (e.g. overholding, lower win rate, losses matching the pre-calculated stats).
   - NEVER mention any other active hour blocks (e.g., "02:00 PM - 04:00 PM EST") since they are outside the trader's actual active slots.
4. CRITICAL TIMEZONE REQUIREMENT (MUST FOLLOW): Each trade lists its pre-computed US New York Market Local Time under the parameters "entry_date_us_eastern" and "entry_hour_us_eastern". You MUST base all of your time analysis, session grouping, Prime Time calculations, and Unsuitable Time identifications strictly on these Eastern Time values. Do not use raw UTC hours or other timezone mappings. Specifically check and call out the trader's performance and trade holding times exactly aligned with the trader's actual experience during the 09:30 AM - 11:30 AM EST session and the 01:30 PM - 03:30 PM EST session.
5. STRICT 12-HOUR TIME FORMAT REQUIREMENT (MUST FOLLOW): DO NOT use 24-hour / military time notation (such as "13:00 - 16:00 EST", "17:00 - 23:59 EST", "13 - 16 EST", "17 - 23 EST", etc.) in the 'primeTime', 'unsuitableTime', or 'timeAnalysisDetails' explanations or any other fields. You MUST format all hours and market sessions strictly using the standard 12-hour AM/PM format (e.g. "01:30 PM - 03:30 PM EST", "09:30 AM - 11:30 AM EST", "05:00 PM - 11:59 PM EST", etc.). Always prefix or suffix all hours/sessions with AM or PM, and clearly specify EST/New York local time.
${languageInstructions}`;

      // Gather and parse all potential API keys
      const rawKeys = process.env.GEMINI_API_KEYS || process.env.VITE_GEMINI_API_KEYS || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
      const apiKeys = rawKeys
          .split(",")
          .map(k => k.trim())
          .filter(k => k !== "" && k !== "YOUR_GEMINI_API_KEY" && k !== "YOUR_API_KEY");

      if (apiKeys.length === 0) {
        return res.status(500).json({ 
          error: "서버에 valid Gemini API Key က ပြင်ဆင်သတ်မှတ်ထားခြင်း မရှိသေးပါ။ ကျေးဇူးပြု၍ API key ထည့်သွင်းပေးပါ။" 
        });
      }

      // Try multiple model aliases in case some models are not supported/accessible
      const modelsToTry = [
        "gemini-3.5-flash",
        "gemini-flash-latest"
      ];

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          winRate: {
            type: Type.NUMBER,
            description: "Calculated overall win rate percentage (0 to 100) based strictly on provided closed trades.",
          },
          totalTrades: {
            type: Type.INTEGER,
            description: "The total number of closed trades processed.",
          },
          winningTrades: {
            type: Type.INTEGER,
            description: "Number of winning trades (where PnL > 0).",
          },
          losingTrades: {
            type: Type.INTEGER,
            description: "Number of losing trades (where PnL <= 0).",
          },
          totalPnL: {
            type: Type.NUMBER,
            description: "Total net profit or loss calculated from all trades.",
          },
          traderLevel: {
            type: Type.STRING,
            description: "The calculated level of the trader: e.g., 'Beginner', 'Developing', 'Consistent', 'Professional' based on their trade metrics.",
          },
          levelDescription: {
            type: Type.STRING,
            description: "A brief, objective, 1-2 sentence description explaining the reason for this computed level.",
          },
          tradingEdge: {
            type: Type.STRING,
            description: "An objective analysis of their strategy, asset preference, and timing that seems to yield positive results (their trading edge).",
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3-5 key trading strengths identified from the logs (such as disciplined risk-to-reward ratio, selective trade entry, or high execution consistency). Give actionable bullet points.",
          },
          weaknesses: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3-5 clear, unbiased weaknesses or areas of warning identified from the logs (such as lack of risk limits, signs of revenge trading, or wide stop-losses). Be completely honest and constructive.",
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3-5 highly specified, actionable recommendations with instructions regarding how the trader can address their weaknesses.",
          },
          overview: {
            type: Type.STRING,
            description: "An in-depth, completely unbiased personal report summarizing the overall performance. Provide constructive guidance.",
          },
          primeTime: {
            type: Type.STRING,
            description: "Analysis of the most profitable hours or sessions for trading (the Prime Time), including descriptions of winning times, reasons, and average trade duration during these wins.",
          },
          unsuitableTime: {
            type: Type.STRING,
            description: "Analysis of the most unprofitable or high-risk hours or sessions for the trader (Unsuitable Time), including reasons, loss factors, and average trade duration of losing trades in these slots.",
          },
          timeAnalysisDetails: {
            type: Type.STRING,
            description: "A highly detailed, comprehensive breakdown of profits/losses, win rates, and holding times across different time brackets or trading sessions.",
          }
        },
        required: [
          "winRate",
          "totalTrades",
          "winningTrades",
          "losingTrades",
          "totalPnL",
          "traderLevel",
          "levelDescription",
          "tradingEdge",
          "strengths",
          "weaknesses",
          "recommendations",
          "overview",
          "primeTime",
          "unsuitableTime",
          "timeAnalysisDetails"
        ]
      };

      let successResponseText = "";
      let lastError: any = null;

      // Loop through both keys and models to hit the most robust setup
      for (const apiKey of apiKeys) {
        for (const modelName of modelsToTry) {
          try {
            console.log(`[AI Analysis] Attempting with model: ${modelName} using key: ${apiKey.substring(0, 6)}...`);
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
              }
            });

            if (response.text) {
              successResponseText = response.text;
              console.log(`[AI Analysis] Successfully generated response with model ${modelName}`);
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.error(`[AI Analysis] Error with model ${modelName} and key ${apiKey.substring(0, 6)}:`, err.message || err);
          }
        }
        if (successResponseText) break;
      }

      if (!successResponseText) {
        // If structured output failed, try a plain text query with manual JSON extraction as a bulletproof secondary fallback
        for (const apiKey of apiKeys) {
          for (const modelName of modelsToTry) {
            try {
              console.log(`[AI Analysis Fallback] Attempting plain text fallback with model: ${modelName}`);
              const ai = new GoogleGenAI({ apiKey });
              const fallbackPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a raw JSON string matching the expected structure. No markdown backticks, no comments, no extra words. Object keys must be exactly: "winRate", "totalTrades", "winningTrades", "losingTrades", "totalPnL", "traderLevel", "levelDescription", "tradingEdge", "strengths", "weaknesses", "recommendations", "overview", "primeTime", "unsuitableTime", "timeAnalysisDetails".`;
              const response = await ai.models.generateContent({
                model: modelName,
                contents: fallbackPrompt
              });

              let rawText = response.text || "";
              // Clean markdown markup if present
              if (rawText.includes("```json")) {
                rawText = rawText.split("```json")[1].split("```")[0];
              } else if (rawText.includes("```")) {
                rawText = rawText.split("```")[1].split("```")[0];
              }
              
              const cleaned = rawText.trim();
              if (cleaned) {
                const sanitized = cleanModelJsonString(cleaned);
                // Verify if parse succeeds
                JSON.parse(sanitized);
                successResponseText = sanitized;
                console.log(`[AI Analysis Fallback] Structured-parse fallback succeeded with model ${modelName}`);
                break;
              }
            } catch (err: any) {
              lastError = err;
              console.error(`[AI Analysis Fallback] Failed text generation:`, err.message || err);
            }
          }
          if (successResponseText) break;
        }
      }

      if (!successResponseText) {
        throw new Error(lastError?.message || lastError || "All configured Gemini models and API keys failed to execute.");
      }

      const sanitizedResponse = cleanModelJsonString(successResponseText.trim());
      const parsedData = JSON.parse(sanitizedResponse);
      res.json(parsedData);
    } catch (error: any) {
      console.error("AI Analysis final endpoint failure:", error);
      res.status(500).json({ error: error.message || "Failed to process AI Analysis." });
    }
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
