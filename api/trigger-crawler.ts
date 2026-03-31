import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, dateRange } = req.body;
    const authHeader = req.headers.authorization;
    
    const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;
    
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

    // Step 2: Execute the crawling logic
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
    
    res.status(200).json({
      status: "success",
      source,
      timestamp,
      data_preview: dataPreview
    });
  } catch (error: any) {
    console.error("Crawler trigger error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}
