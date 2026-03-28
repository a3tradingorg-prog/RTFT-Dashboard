import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
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
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function Fundamental() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setSources([]);

    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        Provide a detailed fundamental analysis for the following query: "${query}".
        Focus on:
        1. Key economic indicators and news affecting the asset.
        2. Market sentiment and consensus.
        3. Potential risks and upcoming events (e.g., FOMC, NFP, earnings).
        4. Short-term and medium-term outlook.
        
        Use Markdown for formatting.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a professional financial analyst. Your goal is to provide accurate, up-to-date fundamental analysis to help traders make informed decisions."
        }
      });

      setAnalysis(response.text || "Could not generate analysis.");
      
      // Extract sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources = chunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title
          }));
        setSources(extractedSources);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch fundamental analysis. Please check your API configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Fundamental Assist</h1>
          <p className="text-neutral-500 mt-2 font-medium">Real-time market analysis and economic insights.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <Globe className="w-8 h-8 text-sky-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Market Intelligence</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Search for any asset, currency pair, or economic event to get a comprehensive fundamental analysis powered by real-time data.
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. EURUSD analysis"
                  className="w-full pl-14 pr-6 py-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-white focus:border-sky-500/50 focus:outline-none transition-all font-bold placeholder:text-neutral-700"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full py-4 bg-sky-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? 'Searching...' : 'Analyze Market'}
              </button>
            </form>
          </div>

          {sources.length > 0 && (
            <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 space-y-4 shadow-sm">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Sources</h4>
              <div className="space-y-3">
                {sources.map((source, i) => (
                  <a 
                    key={i}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl hover:border-sky-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Newspaper className="w-4 h-4 text-neutral-500 shrink-0" />
                      <span className="text-xs font-bold text-neutral-400 truncate">{source.title}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-sky-500 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 flex items-center gap-4 text-red-400"
              >
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="font-bold">{error}</p>
              </motion.div>
            ) : analysis ? (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] border border-[#262626] rounded-3xl p-8 lg:p-12 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-[#262626]">
                  <Globe className="w-6 h-6 text-sky-500" />
                  <h3 className="text-xl font-bold text-white">Analysis Report</h3>
                </div>
                <div className="prose prose-invert max-w-none prose-p:text-neutral-400 prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold prose-strong:text-sky-400 prose-ul:text-neutral-400">
                  <Markdown>{analysis}</Markdown>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] bg-[#141414] border border-[#262626] rounded-3xl border-dashed flex flex-col items-center justify-center text-center p-12 space-y-4"
              >
                <div className="w-20 h-20 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-[#262626]">
                  <Search className="w-8 h-8 text-neutral-700" />
                </div>
                <div className="max-w-xs space-y-2">
                  <h3 className="text-lg font-bold text-neutral-400">Ready to Search</h3>
                  <p className="text-sm text-neutral-600">Enter a currency pair or market event to get a detailed fundamental analysis.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
