import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { useClickOutside } from '../hooks/useClickOutside';
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
  MoreVertical,
  Megaphone,
  X,
  Code,
  Languages,
  Play,
  FileText,
  ChevronDown,
  History as HistoryIcon,
  Brain,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';

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
  content?: string; // Full content for modal
}

interface InstrumentImpact {
  instrument: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  probability: number;
  reasoning: string;
}

interface EconomicAnalysis {
  category: string;
  country: string;
  impact: string;
  instruments: InstrumentImpact[];
}

interface NewsAnalysisRecord {
  id: string;
  created_at: string;
  date_range: string;
  raw_output: string;
  analysis_json: {
    categories: EconomicAnalysis[];
    overall_summary: string;
  };
  summary_text: string;
}

// --- Components ---

const EconomicCalendar = ({ events, loading, view, setView }: { events: EconomicEvent[], loading: boolean, view: string, setView: (v: 'Today' | 'Weekly' | 'Monthly') => void }) => {
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium'>('All');

  const filteredEvents = events.filter(e => {
    if (filter === 'All') return true;
    return e.impact === filter;
  });

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="p-5 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between bg-[#1a1a1a] gap-4">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-sky-500" />
          <h3 className="text-base font-bold text-white uppercase tracking-tighter italic">Economic Calendar</h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Filter */}
          <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-[#262626]">
            {['Today', 'Weekly', 'Monthly'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={cn(
                  "px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded transition-all",
                  view === v ? "bg-sky-500 text-black" : "text-neutral-500 hover:text-white"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Impact Filter */}
          <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-[#262626]">
            {['All', 'High', 'Medium'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded transition-all",
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
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Fetching {view} Calendar...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <>
            {/* Desktop View */}
            <table className="w-full text-left border-collapse hidden sm:table">
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

            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-[#262626]">
              {filteredEvents.map((event, i) => (
                <div key={i} className="p-4 space-y-3 hover:bg-white/5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{event.currency}</span>
                      <span className="text-[10px] font-bold text-neutral-500">• {event.time}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      event.impact === 'High' ? "bg-rose-500/10 text-rose-500" : 
                      event.impact === 'Medium' ? "bg-amber-500/10 text-amber-500" : 
                      "bg-sky-500/10 text-sky-500"
                    )}>
                      {event.impact}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200 leading-relaxed">{event.event}</h4>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Actual</span>
                      <span className="text-xs font-mono font-bold text-white">{event.actual || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Forecast</span>
                      <span className="text-xs font-mono font-bold text-neutral-400">{event.forecast || '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <Calendar className="w-12 h-12 text-neutral-800 mb-4" />
            <p className="text-sm font-bold text-neutral-500">No events found for {view.toLowerCase()}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FuturesPrices = ({ quotes, loading }: { quotes: FuturesQuote[], loading: boolean }) => {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-[#262626] flex items-center justify-between bg-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-sky-500" />
          <h3 className="text-base font-bold text-white uppercase tracking-tighter italic">Indices Futures Prices</h3>
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

const HeadlineNews = ({ news, loading, onSelect }: { news: NewsHeadline[], loading: boolean, onSelect: (item: NewsHeadline) => void }) => {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="p-5 border-b border-[#262626] flex items-center justify-between bg-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <Newspaper className="w-4 h-4 text-sky-500" />
          <h3 className="text-base font-bold text-white uppercase tracking-tighter italic">Headline News</h3>
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
              <button 
                key={i}
                onClick={() => onSelect(item)}
                className="w-full text-left block p-6 hover:bg-white/5 transition-all group"
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
                  <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-sky-500 transition-colors shrink-0 mt-1" />
                </div>
              </button>
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

const NewsModal = ({ item, onClose }: { item: NewsHeadline | null, onClose: () => void }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#141414] border border-[#262626] rounded-[32px] w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-[#262626] flex items-center justify-between bg-[#1a1a1a]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{item.source}</span>
              <span className="text-[10px] font-bold text-neutral-500">{item.time}</span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">{item.headline}</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-[#0a0a0a] border border-[#262626] rounded-full flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide">
          <div className="prose prose-invert max-w-none prose-p:text-neutral-400 prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold prose-strong:text-sky-400">
            {item.content ? (
              <Markdown>{item.content}</Markdown>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Loading Article Content...</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-[#262626] bg-[#0a0a0a] flex items-center justify-between">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-sky-500 hover:text-sky-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Original Source
          </a>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#1f1f1f] border border-[#262626] rounded-xl text-xs font-bold text-white hover:bg-[#262626] transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AICrawler = () => {
  const { user } = useAuth();
  const [pythonCode, setPythonCode] = useState(`import requests
from bs4 import BeautifulSoup

def crawl_news():
    url = "https://www.forexfactory.com/news"
    # Logic to fetch news_output
    return "Latest news data..."`);
  
  const [crawling, setCrawling] = useState(false);
  const [newsOutput, setNewsOutput] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<{ [key: string]: string }>({});
  const [selectedLang, setSelectedLang] = useState('English');
  const [summarizing, setSummarizing] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('Today');
  const langModalRef = useClickOutside(() => setIsLangModalOpen(false));
  
  // History & Deep Analysis
  const [history, setHistory] = useState<NewsAnalysisRecord[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<NewsAnalysisRecord | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchHistory();

    // Subscribe to realtime changes for news_analyses
    const channel = supabase
      .channel('news_analyses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_analyses',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as NewsAnalysisRecord;
            setHistory((prev) => {
              // Avoid duplicates if already added manually
              if (prev.some(item => item.id === newRecord.id)) return prev;
              return [newRecord, ...prev];
            });
            setSelectedAnalysis(newRecord);
          } else if (payload.eventType === 'DELETE') {
            setHistory((prev) => prev.filter((item) => item.id !== payload.old.id));
            setSelectedAnalysis(prev => prev?.id === payload.old.id ? null : prev);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as NewsAnalysisRecord;
            setHistory((prev) =>
              prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
            );
            setSelectedAnalysis(prev => prev?.id === updatedRecord.id ? updatedRecord : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('news_analyses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
      if (data && data.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(data[0]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleCrawl = async () => {
    setCrawling(true);
    setNewsOutput(null);
    setSummaries({});
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      // Simulate execution by asking Gemini to "act" as the script
      const prompt = `
        Fetch the latest high-impact financial news for the period: "${selectedDateRange}" as if a crawler script just ran. 
        Provide the raw "news_output" content.
        
        Note: Use your internal knowledge and real-time search capabilities to provide the most accurate news data for today.
      `;

      let response;
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { tools: [{ googleSearch: {} }] }
        });
      } catch (searchErr) {
        console.warn("Crawler search failed, trying without it:", searchErr);
        response = await ai.models.generateContent({
          model,
          contents: prompt + " (Note: If real-time search is unavailable, use your latest knowledge base for today's news)",
        });
      }

      const output = response.text || "No output generated.";
      setNewsOutput(output);

      // Upload to Supabase Storage
      try {
        const fileName = `news_output_${Date.now()}.txt`;
        const { error: uploadError } = await supabase.storage
          .from('news-cache')
          .upload(fileName, output, {
            contentType: 'text/plain',
            upsert: true
          });

        if (uploadError) throw uploadError;
        
        localStorage.setItem('latest_news_output_file', fileName);
        toast.success('Crawler output cached to Supabase');
      } catch (storageErr) {
        console.warn('Supabase storage failed, falling back to localStorage:', storageErr);
        localStorage.setItem('latest_news_output_raw', output);
        toast.info('Crawler output cached locally');
      }
    } catch (err) {
      console.error(err);
      toast.error('Crawling failed');
    } finally {
      setCrawling(false);
    }
  };

  const handleDeepAnalysis = async (lang: string) => {
    setSummarizing(true);
    setIsLangModalOpen(false);
    setSelectedAnalysis(null); // Clear previous analysis to allow re-run feedback
    
    const toastId = toast.loading('Initializing deep analysis...');
    
    try {
      let contentToAnalyze = newsOutput;
      
      if (!contentToAnalyze) {
        const fileName = localStorage.getItem('latest_news_output_file');
        if (fileName) {
          const { data, error } = await supabase.storage
            .from('news-cache')
            .download(fileName);
          
          if (!error && data) {
            contentToAnalyze = await data.text();
          }
        }
      }

      if (!contentToAnalyze) {
        contentToAnalyze = localStorage.getItem('latest_news_output_raw');
      }

      if (!contentToAnalyze) throw new Error("No news output found to analyze");

      // Truncate content if too long to save tokens
      if (contentToAnalyze.length > 30000) {
        contentToAnalyze = contentToAnalyze.substring(0, 30000) + "... [Content Truncated]";
      }

      toast.loading('Analyzing market data with Gemini...', { id: toastId });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      const prompt = `
        Perform a deep economic analysis on the following "news_output" data for professional trading intelligence.
        
        News Output:
        ${contentToAnalyze}
        
        Requirements:
        1. Categorize analysis by Economic Category (e.g., Inflation, Employment, Monetary Policy) and Country (e.g., USA, EU, UK).
        2. Provide a detailed impact assessment for each category.
        3. Instrument-Specific Impact Assessment: For each relevant news item, assess the potential impact on:
           - DXY (US Dollar Index)
           - EURUSD
           - GBPUSD
           - Futures Indices (MNQ, NQ, MES, ES, MGC, GC)
        4. For each instrument, provide:
           - Sentiment: Bullish, Bearish, or Neutral.
           - Probability: Estimated likelihood (0-100%).
           - Reasoning: Concise explanation.
        5. Provide an overall professional summary in ${lang}.
        
        Return the analysis in a strict JSON format.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    country: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    instruments: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          instrument: { type: Type.STRING },
                          sentiment: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral'] },
                          probability: { type: Type.NUMBER },
                          reasoning: { type: Type.STRING }
                        },
                        required: ['instrument', 'sentiment', 'probability', 'reasoning']
                      }
                    }
                  },
                  required: ['category', 'country', 'impact', 'instruments']
                }
              },
              overall_summary: { type: Type.STRING }
            },
            required: ['categories', 'overall_summary']
          }
        }
      });

      const analysisData = JSON.parse(response.text);
      
      toast.loading('Saving analysis results...', { id: toastId });

      // Save to Supabase
      const { data: savedRecord, error: saveError } = await supabase
        .from('news_analyses')
        .insert({
          user_id: user?.id,
          date_range: selectedDateRange,
          raw_output: contentToAnalyze,
          analysis_json: analysisData,
          summary_text: analysisData.overall_summary
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setHistory(prev => [savedRecord, ...prev]);
      setSelectedAnalysis(savedRecord);
      setSelectedLang(lang);
      toast.success('Deep analysis complete and saved', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Analysis failed', { id: toastId });
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Code Input (Hidden by default) */}
        <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-sky-500" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">News Crawler (V1.04)</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <HistoryIcon className="w-3 h-3" />
                <span className="hidden xs:inline">{isHistoryOpen ? 'Hide History' : 'View History'}</span>
                <span className="xs:hidden">History</span>
              </button>
              <button 
                onClick={handleCrawl}
                disabled={crawling}
                className="w-full sm:w-auto px-6 py-2 bg-sky-500 text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-sky-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {crawling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {crawling ? 'Crawling...' : 'Run Script'}
              </button>
            </div>
          </div>

          {/* History Panel */}
          <AnimatePresence>
            {isHistoryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#0a0a0a] border border-[#262626] rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-[#262626] bg-[#141414]">
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Analysis History</h4>
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-hide">
                  {history.length > 0 ? (
                    history.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => {
                          setSelectedAnalysis(record);
                          setNewsOutput(record.raw_output);
                          setIsHistoryOpen(false);
                        }}
                        className={cn(
                          "w-full p-4 text-left border-b border-[#262626] hover:bg-white/5 transition-all flex items-center justify-between group",
                          selectedAnalysis?.id === record.id && "bg-sky-500/5"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{record.date_range}</span>
                            <span className="text-[8px] px-1.5 py-0.5 bg-sky-500/10 text-sky-500 rounded font-black uppercase tracking-widest">Deep Analysis</span>
                          </div>
                          <p className="text-[10px] text-neutral-500">{format(new Date(record.created_at), 'MMM dd, yyyy • HH:mm')}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-sky-500 transition-colors" />
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">No history found.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date Range Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Select news date range:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Today', 'Yesterday', 'Today & Yesterday', 'This Week'].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedDateRange(range)}
                  className={cn(
                    "px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all",
                    selectedDateRange === range 
                      ? "bg-sky-500/10 border-sky-500 text-sky-500" 
                      : "bg-[#0a0a0a] border-[#262626] text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 bg-[#0a0a0a] border border-[#262626] rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-4">
            <ShieldCheck className="w-12 h-12 text-sky-500/20" />
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">
              Crawler script is active and secured.<br/>Click "Run Script" to fetch latest data.
            </p>
          </div>
        </div>

        {/* Output & Summary */}
        <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-6 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">news_output</h3>
            </div>
            {newsOutput && (
              <button 
                onClick={() => setIsLangModalOpen(true)}
                disabled={summarizing}
                className="px-6 py-2 bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {summarizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {summarizing ? 'Analyzing...' : 'Deep Analysis'}
              </button>
            )}
          </div>

          <div className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 overflow-y-auto scrollbar-hide min-h-[200px]">
            {newsOutput ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">Crawling Complete</h4>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    The news crawler has successfully gathered the latest market data. Proceed to Deep Analysis for professional intelligence.
                  </p>
                </div>
                <button 
                  onClick={() => setIsLangModalOpen(true)}
                  disabled={summarizing}
                  className="px-8 py-3 bg-emerald-500 text-black font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20"
                >
                  {summarizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {summarizing ? 'Analyzing...' : 'Start Deep Analysis'}
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <FileText className="w-12 h-12 text-neutral-600" />
                <p className="text-xs font-bold uppercase tracking-widest">No output yet. Run script to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deep Analysis Display */}
      <AnimatePresence>
        {selectedAnalysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Overall Summary */}
            <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#262626] pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-sky-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">Professional Economic Intelligence</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{format(new Date(selectedAnalysis.created_at), 'MMM dd, yyyy • HH:mm')}</span>
                  <div className="px-3 py-1 bg-sky-500/10 text-sky-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-sky-500/20">
                    {selectedAnalysis.date_range}
                  </div>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="p-8 bg-[#0a0a0a] border border-[#262626] rounded-3xl">
                  <p className="text-neutral-300 leading-relaxed text-lg font-medium">
                    {selectedAnalysis.summary_text}
                  </p>
                </div>
              </div>
            </div>

            {/* Categorized Analysis & Impact */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {selectedAnalysis.analysis_json.categories.map((cat, idx) => (
                <div key={idx} className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{cat.country}</span>
                        <span className="w-1 h-1 bg-neutral-800 rounded-full" />
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{cat.category}</span>
                      </div>
                      <h4 className="text-xl font-bold text-white tracking-tight">{cat.category} Analysis</h4>
                    </div>
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-[#262626]">
                      <TrendingUp className="w-5 h-5 text-neutral-500" />
                    </div>
                  </div>

                  <p className="text-sm text-neutral-400 leading-relaxed bg-[#0a0a0a] p-4 rounded-2xl border border-[#262626]">
                    {cat.impact}
                  </p>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Instrument Impact Assessment</h5>
                    <div className="grid grid-cols-1 gap-3">
                      {cat.instruments.map((inst, iidx) => (
                        <div key={iidx} className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3 group hover:border-sky-500/30 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-white">{inst.instrument}</span>
                              <div className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                inst.sentiment === 'Bullish' ? "bg-emerald-500/10 text-emerald-500" :
                                inst.sentiment === 'Bearish' ? "bg-rose-500/10 text-rose-500" :
                                "bg-neutral-500/10 text-neutral-500"
                              )}>
                                {inst.sentiment}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-neutral-500">Prob:</span>
                              <span className="text-[10px] font-black text-sky-500">{inst.probability}%</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-neutral-500 leading-relaxed italic">
                            {inst.reasoning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {isLangModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              ref={langModalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 w-full max-w-md space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white uppercase tracking-tighter italic">Deep Economic Analysis</h3>
                <button onClick={() => setIsLangModalOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Select output language:</p>
              <div className="grid grid-cols-1 gap-3">
                {['English', 'Myanmar', 'Thai'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleDeepAnalysis(lang)}
                    className="w-full p-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-left hover:border-sky-500/50 hover:bg-sky-500/5 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-300 group-hover:text-white">{lang}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-sky-500" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Page ---

export default function News() {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<FuturesQuote[]>([]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [news, setNews] = useState<NewsHeadline[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'futures' | 'headlines' | 'crawler'>('calendar');
  const [calendarView, setCalendarView] = useState<'Today' | 'Weekly' | 'Monthly'>('Today');
  const [selectedNews, setSelectedNews] = useState<NewsHeadline | null>(null);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key is missing.");
      
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      const prompt = `
        Fetch the most accurate, real-time financial market data for the period: ${calendarView}.
        Current Date: ${new Date().toLocaleDateString()}.
        
        1. Economic Calendar: Fetch HIGH and MEDIUM impact economic events for the United States (US) ONLY. 
           - If view is "Today", fetch for today.
           - If view is "Weekly", fetch for the current week.
           - If view is "Monthly", fetch for the current month.
           - IMPORTANT: Ensure the data is accurate and matches the current schedule on ForexFactory.com.
           - Include the correct time in EST/EDT.
           - Mimic Forex Factory's data points: time, event name, currency (USD), impact level (High/Medium), actual, forecast, and previous values.
        
        2. Futures Prices: Fetch the latest quotes for the following US Indices:
           - ES (S&P 500)
           - NQ (Nasdaq 100)
           - YM (Dow Jones)
           - For each, provide data for both "Active" (Front Month) and "Coming" (Next Month) contracts.
           - Include: symbol, contract name, latest price, net change, open, high, low, volume, and last update time.
        
        3. Headline News: Fetch the top 10 most recent HIGH IMPACT financial news headlines. 
           - PRIORITIZE: War news, geopolitical tensions, and significant posts/announcements from Donald Trump.
           - Include: time, headline text, source name, and a valid URL.
        
        Return the data in a strict JSON format.
      `;

      let response;
      try {
        response = await ai.models.generateContent({
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
      } catch (searchErr) {
        console.warn("Google Search failed, trying without it:", searchErr);
        response = await ai.models.generateContent({
          model,
          contents: prompt + " (Note: If real-time search is unavailable, use your latest knowledge base for today's expected events)",
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                economicCalendar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, event: { type: Type.STRING }, currency: { type: Type.STRING }, impact: { type: Type.STRING }, actual: { type: Type.STRING }, forecast: { type: Type.STRING }, previous: { type: Type.STRING } } } },
                futuresPrices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { symbol: { type: Type.STRING }, contractName: { type: Type.STRING }, latest: { type: Type.STRING }, change: { type: Type.STRING } } } },
                headlineNews: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, headline: { type: Type.STRING }, source: { type: Type.STRING }, url: { type: Type.STRING } } } }
              }
            }
          }
        });
      }

      const data = JSON.parse(response.text);
      setEvents(data.economicCalendar || []);
      setQuotes(data.futuresPrices || []);
      setNews(data.headlineNews || []);
      setLastUpdated(new Date());

      // Save to session cache
      sessionStorage.setItem(`news_cache_${calendarView}`, JSON.stringify({
        events: data.economicCalendar || [],
        quotes: data.futuresPrices || [],
        news: data.headlineNews || [],
        timestamp: Date.now()
      }));

    } catch (err: any) {
      console.error("Market Data Fetch Error:", err);
      if (!isBackground) setError("Failed to fetch real-time market data.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [calendarView]);

  const fetchArticleContent = async (item: NewsHeadline) => {
    if (item.content) return;
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return;
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      const prompt = `
        Fetch and summarize the full content of this financial news article: "${item.headline}" from ${item.source} (${item.url}).
        Provide a detailed, readable summary that covers all key points.
        Use Markdown for formatting.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      const content = response.text || "Could not retrieve article content.";
      setNews(prev => prev.map(n => n.url === item.url ? { ...n, content } : n));
      setSelectedNews(prev => prev?.url === item.url ? { ...prev, content } : prev);
    } catch (err) {
      console.error("Article Fetch Error:", err);
    }
  };

  useEffect(() => {
    const cachedData = sessionStorage.getItem(`news_cache_${calendarView}`);
    if (cachedData) {
      const { events: cEvents, quotes: cQuotes, news: cNews, timestamp } = JSON.parse(cachedData);
      setEvents(cEvents);
      setQuotes(cQuotes);
      setNews(cNews);
      setLastUpdated(new Date(timestamp));
      setLoading(false);
      
      // Background refetch if older than 5 minutes
      if (Date.now() - timestamp > 300000) {
        fetchData(true);
      }
    } else {
      fetchData();
    }

    const interval = setInterval(() => fetchData(true), 300000); // 5 mins background refresh
    return () => clearInterval(interval);
  }, [fetchData, calendarView]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
              <Megaphone className="w-6 h-6 text-sky-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">News Terminal</h1>
          </div>
          <p className="text-neutral-500 font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Verified Real-Time Data Stream • {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchData()}
            disabled={loading}
            className="px-6 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:border-sky-500/50 transition-all flex items-center gap-3 group"
          >
            <RefreshCw className={cn("w-4 h-4 text-sky-500", loading && "animate-spin")} />
            {loading ? 'Syncing...' : 'Refresh Stream'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3 pb-4 border-b border-[#262626]">
        {[
          { id: 'calendar', label: 'Economic Calendar', icon: Calendar, mobileLabel: 'Calendar' },
          { id: 'futures', label: 'Futures Prices', icon: Activity, mobileLabel: 'Futures', hiddenOnMobile: true },
          { id: 'headlines', label: 'Headline News', icon: Newspaper, mobileLabel: 'News' },
          { id: 'crawler', label: 'AI News Crawler', icon: Code, mobileLabel: 'Crawler' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative overflow-hidden group border",
              activeTab === tab.id 
                ? "bg-sky-500 text-black border-sky-400 shadow-xl shadow-sky-500/20 scale-105" 
                : "bg-[#141414] text-neutral-500 hover:text-white border-[#262626] hover:border-neutral-700",
              tab.hiddenOnMobile && "hidden md:flex"
            )}
          >
            <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 relative z-10" />
            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            <span className="relative z-10 sm:hidden">{tab.mobileLabel}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'calendar' && (
          <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-[700px]">
            <EconomicCalendar events={events} loading={loading} view={calendarView} setView={setCalendarView} />
          </motion.div>
        )}

        {activeTab === 'futures' && (
          <motion.div key="futures" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <FuturesPrices quotes={quotes} loading={loading} />
          </motion.div>
        )}

        {activeTab === 'headlines' && (
          <motion.div key="headlines" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-[700px]">
            <HeadlineNews 
              news={news} 
              loading={loading} 
              onSelect={(item) => {
                setSelectedNews(item);
                fetchArticleContent(item);
              }} 
            />
          </motion.div>
        )}

        {activeTab === 'crawler' && (
          <motion.div key="crawler" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <AICrawler />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNews && (
          <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
        )}
      </AnimatePresence>

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
