import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { TradingAccount, Trade } from '../types';
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw,
  ChevronRight,
  Zap,
  Target,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function AISummary() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      if (data) {
        setAccounts(data);
        if (data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchTrades();
    }
  }, [selectedAccountId]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', selectedAccountId)
        .order('entry_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setTrades(data);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (trades.length === 0) {
      setError("No trades found to analyze.");
      return;
    }

    setSummarizing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const tradeData = trades.map(t => ({
        asset: t.asset,
        type: t.type,
        pnl: t.pnl,
        pnl_percent: t.pnl_percent,
        date: t.entry_date,
        status: t.status
      }));

      const prompt = `
        Analyze the following trading data for the last ${trades.length} trades.
        Provide a concise, professional summary of the performance.
        Focus on:
        1. Overall profitability and win rate.
        2. Strengths (e.g., best symbols, types of trades that work).
        3. Weaknesses (e.g., recurring mistakes, symbols with high losses).
        4. Actionable advice for improvement.
        
        Keep the tone professional and encouraging. Use Markdown for formatting.
        
        Trade Data:
        ${JSON.stringify(tradeData, null, 2)}
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "You are an expert trading performance analyst. Your goal is to help traders identify patterns in their behavior and improve their edge."
        }
      });

      setSummary(response.text || "Could not generate summary.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate AI summary. Please check your API configuration.");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">AI Summarization</h1>
          <p className="text-neutral-500 mt-2 font-medium">Intelligent analysis of your trading performance.</p>
        </div>

        <select 
          value={selectedAccountId || ''} 
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="px-6 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-sm font-bold text-white focus:border-sky-500/50 focus:outline-none transition-all"
        >
          {accounts.map(account => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 space-y-6">
            <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-sky-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Trading Intelligence</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Our AI analyzes your recent trade history to find patterns, identify your edge, and suggest improvements to your strategy.
              </p>
            </div>
            <button 
              onClick={generateSummary}
              disabled={summarizing || trades.length === 0}
              className="w-full py-4 bg-sky-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {summarizing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {summarizing ? 'Analyzing...' : 'Generate Analysis'}
            </button>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 space-y-4">
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Analysis Scope</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#262626]">
                  <Zap className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-xs font-bold text-neutral-400">Recent {trades.length} Trades</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#262626]">
                  <Target className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-xs font-bold text-neutral-400">Win Rate & Profitability</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-[#262626]">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-xs font-bold text-neutral-400">Risk Management Patterns</span>
              </div>
            </div>
          </div>
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
            ) : summary ? (
              <motion.div 
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] border border-[#262626] rounded-3xl p-8 lg:p-12 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-[#262626]">
                  <Sparkles className="w-6 h-6 text-sky-500" />
                  <h3 className="text-xl font-bold text-white">Analysis Report</h3>
                </div>
                <div className="prose prose-invert max-w-none prose-p:text-neutral-400 prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold prose-strong:text-sky-400 prose-ul:text-neutral-400">
                  <Markdown>{summary}</Markdown>
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
                  <Sparkles className="w-8 h-8 text-neutral-700" />
                </div>
                <div className="max-w-xs space-y-2">
                  <h3 className="text-lg font-bold text-neutral-400">Ready to Analyze</h3>
                  <p className="text-sm text-neutral-600">Click the button to generate your personalized trading performance summary.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
