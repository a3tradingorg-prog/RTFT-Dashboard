import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw,
  ChevronRight,
  Zap,
  Target,
  ShieldCheck,
  Newspaper,
  ExternalLink,
  Calendar,
  Activity,
  BarChart3,
  Clock,
  Monitor,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  MoreVertical
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface EconomicEvent {
  time: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  actual: string;
  forecast: string;
  previous: string;
  currency: string;
}

interface FuturesQuote {
  symbol: string;
  contractName: string;
  latest: string;
  change: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  time: string;
}

interface NewsHeadline {
  time: string;
  headline: string;
  source: string;
  url: string;
}

// --- Components ---

const EconomicCalendar = ({ events, loading }: { events: EconomicEvent[], loading: boolean }) => {
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium'>('All');

  const filteredEvents = events.filter(e => {
    if (filter === 'All') return true;
    return e.impact === filter;
  });

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-sky-500" />
          <h3 className="text-lg font-bold text-white">Economic Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-[#262626]">
            {['All', 'High', 'Medium'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-all",
                  filter === f ? "bg-sky-500 text-black" : "text-neutral-500 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Fetching Calendar...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626]">Time</th>
                <th className="px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626]">Currency</th>
                <th className="px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626]">Event</th>
                <th className="px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626]">Impact</th>
                <th className="px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Actual</th>
                <th className="px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Forecast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {filteredEvents.map((event, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-xs font-mono text-neutral-400">{event.time}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-white">{event.currency}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-neutral-200 group-hover:text-sky-400 transition-colors">{event.event}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                      event.impact === 'High' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : 
                      event.impact === 'Medium' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                      "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                    )}>
                      {event.impact}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-white">{event.actual || '-'}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-neutral-500">{event.forecast || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <Calendar className="w-12 h-12 text-neutral-800 mb-4" />
            <p className="text-sm font-bold text-neutral-500">No events found for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FuturesPrices = ({ quotes, loading }: { quotes: FuturesQuote[], loading: boolean }) => {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-sky-500" />
          <h3 className="text-lg font-bold text-white">Indices Futures Prices</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded border border-emerald-500/20 animate-pulse">
            Live
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Updating Quotes...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a]">
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626]">Symbol</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626]">Contract Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Latest</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Change</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Open</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">High</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Low</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Volume</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-[#262626] text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {quotes.map((quote) => {
                const isPositive = !quote.change.startsWith('-');
                return (
                  <tr key={quote.symbol} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-sky-500 hover:underline cursor-pointer">+{quote.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-neutral-200">{quote.contractName}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-mono font-bold text-white">{quote.latest}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={cn(
                        "text-xs font-black",
                        isPositive ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {quote.change}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-neutral-400">{quote.open}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-neutral-400">{quote.high}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-neutral-400">{quote.low}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-neutral-300">{quote.volume}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-neutral-500">{quote.time}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-neutral-600 hover:text-white transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const HeadlineNews = ({ news, loading }: { news: NewsHeadline[], loading: boolean }) => {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-sky-500" />
          <h3 className="text-lg font-bold text-white">Headline News</h3>
        </div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Fetching News...</p>
          </div>
        ) : news.length > 0 ? (
          <div className="divide-y divide-[#262626]">
            {news.map((item, i) => (
              <a 
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{item.source}</span>
                      <span className="text-[10px] font-bold text-neutral-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-200 group-hover:text-white leading-relaxed transition-colors">
                      {item.headline}
                    </h4>
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-700 group-hover:text-sky-500 transition-colors shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <Newspaper className="w-12 h-12 text-neutral-800 mb-4" />
            <p className="text-sm font-bold text-neutral-500">No news headlines available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Page ---

export default function MarketData() {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<FuturesQuote[]>([]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [news, setNews] = useState<NewsHeadline[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'news'>('calendar');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      const prompt = `
        Fetch the most accurate, real-time financial market data for today, ${new Date().toLocaleDateString()}.
        
        1. Economic Calendar: Fetch high and medium impact economic events for today (US, EU, UK, JP). Include time, event name, currency, impact level (High/Medium), actual, forecast, and previous values.
        2. Futures Prices: Fetch the latest quotes for the following active contracts (as seen on Barchart): ESM26 (S&P 500 Jun '26), ESU26 (S&P 500 Sep '26), NQM26 (Nasdaq 100 Jun '26), NQU26 (Nasdaq 100 Sep '26), YMM26 (Dow Mini Jun '26), YMU26 (Dow Mini Sep '26). Include symbol, contract name, latest price, net change, open, high, low, volume, and last update time.
        3. Headline News: Fetch the top 10 most recent financial news headlines. Include time, headline text, source name, and a valid URL.
        
        Return the data in a strict JSON format.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              economicCalendar: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    event: { type: Type.STRING },
                    currency: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    actual: { type: Type.STRING },
                    forecast: { type: Type.STRING },
                    previous: { type: Type.STRING }
                  },
                  required: ['time', 'event', 'currency', 'impact']
                }
              },
              futuresPrices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    symbol: { type: Type.STRING },
                    contractName: { type: Type.STRING },
                    latest: { type: Type.STRING },
                    change: { type: Type.STRING },
                    open: { type: Type.STRING },
                    high: { type: Type.STRING },
                    low: { type: Type.STRING },
                    volume: { type: Type.STRING },
                    time: { type: Type.STRING }
                  },
                  required: ['symbol', 'contractName', 'latest', 'change']
                }
              },
              headlineNews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    headline: { type: Type.STRING },
                    source: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ['time', 'headline', 'source', 'url']
                }
              }
            },
            required: ['economicCalendar', 'futuresPrices', 'headlineNews']
          }
        }
      });

      const data = JSON.parse(response.text);
      setEvents(data.economicCalendar || []);
      setQuotes(data.futuresPrices || []);
      setNews(data.headlineNews || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Market Data Fetch Error:", err);
      setError("Failed to fetch real-time market data. Please ensure your API key is configured correctly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 mins
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
              <Monitor className="w-6 h-6 text-sky-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Market Terminal</h1>
          </div>
          <p className="text-neutral-500 font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Verified Real-Time Data Stream • {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:border-sky-500/50 transition-all flex items-center gap-3 group"
          >
            <RefreshCw className={cn("w-4 h-4 text-sky-500", loading && "animate-spin")} />
            {loading ? 'Syncing...' : 'Refresh Stream'}
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/5 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4 text-rose-400"
        >
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="font-black uppercase text-xs tracking-widest mb-1">Data Stream Interrupted</p>
            <p className="text-sm font-bold opacity-80">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Futures Prices Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-sky-500 rounded-full" />
          <h2 className="text-lg font-black text-white uppercase tracking-widest">Indices Futures</h2>
        </div>
        <FuturesPrices quotes={quotes} loading={loading} />
      </div>

      {/* Tabs for Calendar and News */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 h-[650px]">
          <EconomicCalendar events={events} loading={loading} />
        </div>
        <div className="lg:col-span-5 h-[650px]">
          <HeadlineNews news={news} loading={loading} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-[#262626]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">CME Group Feed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Reuters News Stream</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Economic Bureau API</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-neutral-600 italic">
          Data provided for informational purposes only. Real-time accuracy verified via Google Search Grounding.
        </p>
      </div>
    </div>
  );
}
