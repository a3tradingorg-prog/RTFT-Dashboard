import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { TradingAccount, Trade, Strategy } from '../types';
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
  ShieldCheck,
  ChevronDown,
  Globe,
  Bot,
  History,
  Check,
  Search,
  Layout,
  Activity,
  ArrowRight,
  Lightbulb,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const LANGUAGES = [
  { id: 'English', name: 'English', flag: '🇺🇸' },
  { id: 'Myanmar', name: 'Myanmar', flag: '🇲🇲' },
  { id: 'Thai', name: 'Thai', flag: '🇹🇭' },
];

export default function AISummary() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Preferences
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  
  // UI State
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const accountRef = useClickOutside(() => setIsAccountDropdownOpen(false));
  const languageRef = useClickOutside(() => setIsLanguageDropdownOpen(false));

  useEffect(() => {
    if (user) {
      fetchInitialData();

      // Subscribe to user profile changes (for language preferences)
      const profileSub = supabase
        .channel(`profile_realtime_${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchInitialData();
        })
        .subscribe();

      return () => {
        profileSub.unsubscribe();
      };
    }
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch accounts and user preferences
      const [accountsRes, profileRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user?.id),
        supabase.from('user_profiles').select('preferred_ai_language').eq('user_id', user?.id).maybeSingle()
      ]);

      if (accountsRes.error) throw accountsRes.error;
      
      if (accountsRes.data) {
        setAccounts(accountsRes.data);
        if (accountsRes.data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accountsRes.data[0].id);
        }
      }

      if (profileRes.data) {
        setSelectedLanguage(profileRes.data.preferred_ai_language || 'English');
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchAccountData();

      // Subscribe to realtime changes for AI summaries
      const summarySub = supabase
        .channel(`summary_realtime_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'ai_summaries_cache',
          filter: `account_id=eq.${selectedAccountId}`
        }, () => {
          fetchAccountData();
        })
        .subscribe();

      return () => {
        summarySub.unsubscribe();
      };
    }
  }, [selectedAccountId, selectedLanguage]);

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      const [tradesRes, strategiesRes] = await Promise.all([
        supabase
          .from('trades')
          .select('*, trade_exit_records(*)')
          .eq('account_id', selectedAccountId)
          .order('entry_date', { ascending: false })
          .limit(100),
        supabase
          .from('strategies')
          .select('*')
          .eq('user_id', user?.id)
      ]);

      if (tradesRes.error) throw tradesRes.error;
      if (strategiesRes.error) throw strategiesRes.error;

      if (tradesRes.data) setTrades(tradesRes.data);
      if (strategiesRes.data) setStrategies(strategiesRes.data);
      
      // Check for cached summary
      const { data: cachedSummary } = await supabase
        .from('ai_summaries_cache')
        .select('summary_text')
        .eq('account_id', selectedAccountId)
        .eq('ai_agent_used', 'Gemini')
        .eq('summary_language', selectedLanguage)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedSummary) {
        setSummary(cachedSummary.summary_text);
      } else {
        setSummary(null);
      }

    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (language: string) => {
    try {
      await supabase.from('user_profiles').upsert({
        user_id: user?.id,
        preferred_ai_agent: 'Gemini',
        preferred_ai_language: language,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const generateSummary = async () => {
    if (trades.length === 0) {
      setError("No trades found to analyze for this account.");
      return;
    }

    setSummarizing(true);
    setError(null);
    setSummary(null); // Clear previous summary to allow re-run feedback

    const toastId = toast.loading('Initializing performance analysis...');

    try {
      // Prepare data for AI
      const account = accounts.find(a => a.id === selectedAccountId);
      
      const tradeData = trades.map(t => ({
        asset: t.asset,
        type: t.type,
        pnl: t.pnl,
        pnl_percent: t.pnl_percent,
        date: t.entry_date,
        status: t.status,
        psychology: t.psychology_status,
        context: t.entry_context,
        strategy: strategies.find(s => s.strategy_id === t.strategy_id)?.strategy_name || 'Unknown'
      }));

      const strategyData = strategies.map(s => ({
        name: s.strategy_name,
        description: s.description,
        assets: s.assets_applicable,
        timeframes: s.timeframes_applicable
      }));

      const prompt = `
        Analyze the following trading data for the account "${account?.name}".
        
        Account Context:
        - Size: ${account?.account_size}
        - Initial Balance: ${formatCurrency(account?.initial_balance || 0)}
        - Current Balance: ${formatCurrency(account?.current_balance || 0)}
        - Max Drawdown Limit: ${account?.max_drawdown}%
        
        Trade History (Last ${trades.length} trades):
        ${JSON.stringify(tradeData, null, 2)}
        
        Defined Strategies:
        ${JSON.stringify(strategyData, null, 2)}
        
        Please provide a comprehensive analysis in ${selectedLanguage}.
        Structure the response with the following sections:
        
        1. **Performance Overview**: A summary of profitability, win rate, and risk-adjusted returns.
        2. **Psychological Insights**: Analysis of the "psychology_status" recorded for trades. Identify emotional patterns (e.g., FOMO, revenge trading, or disciplined execution).
        3. **Strategic Alignment**: How well the trades align with the defined strategies. Are there "off-strategy" trades?
        4. **Areas for Improvement**: 3-5 specific, actionable points to correct or refine.
        5. **Reinforcement**: Identify 2-3 positive habits that should be maintained.
        6. **Suggestions for Addition**: Recommendations for new strategies, risk management rules, or psychological approaches to consider.
        
        Use professional trading terminology (TA, FA, Psychology).
        Keep the tone professional, objective, and constructive.
        Use Markdown for formatting with clear headers and bullet points.
      `;

      toast.loading('Synthesizing data with Gemini...', { id: toastId });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "You are a world-class trading performance analyst and psychology coach. You have deep expertise in Technical Analysis, Fundamental Analysis, and the mental game of trading."
        }
      });
      const generatedText = response.text || "Could not generate summary.";

      setSummary(generatedText);

      toast.loading('Caching analysis results...', { id: toastId });

      // Cache the result
      await supabase.from('ai_summaries_cache').upsert({
        account_id: selectedAccountId,
        ai_agent_used: 'Gemini',
        summary_language: selectedLanguage,
        summary_text: generatedText,
        generated_at: new Date().toISOString(),
        analysis_start_date: trades.length > 0 ? trades[trades.length - 1].entry_date : null,
        analysis_end_date: trades.length > 0 ? trades[0].entry_date : null
      }, { onConflict: 'account_id, ai_agent_used, summary_language, analysis_start_date, analysis_end_date' });

      toast.success('Performance report generated', { id: toastId });
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate AI summary. Please check your API configuration or try again later.");
      toast.error('Analysis failed', { id: toastId });
    } finally {
      setSummarizing(false);
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-sky-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">AI Summarization</h1>
          </div>
          <p className="text-neutral-500 font-medium ml-1">Advanced analytical core powered by multi-agent intelligence.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Enhanced Account Dropdown */}
          <div className="relative" ref={accountRef}>
            <button 
              onClick={() => {
                setIsAccountDropdownOpen(!isAccountDropdownOpen);
                setIsLanguageDropdownOpen(false);
              }}
              className="flex items-center gap-3 px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-sm font-bold text-white hover:border-sky-500/50 transition-all min-w-[240px] justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-sky-500/10 rounded-md flex items-center justify-center">
                  <Layout className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <span>{selectedAccount?.name || 'Select Account'}</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform duration-300", isAccountDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isAccountDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-72 bg-[#1f1f1f] border border-[#262626] rounded-2xl shadow-2xl z-[100] overflow-hidden p-2"
                >
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setIsAccountDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl transition-all group",
                        selectedAccountId === account.id ? "bg-sky-500/10 text-sky-400" : "text-neutral-400 hover:bg-[#262626] hover:text-white"
                      )}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-sm">{account.name}</span>
                        <span className="text-[10px] opacity-50 uppercase tracking-widest">{account.propfirm}</span>
                      </div>
                      {selectedAccountId === account.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language Dropdown */}
          <div className="relative" ref={languageRef}>
            <button 
              onClick={() => {
                setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                setIsAccountDropdownOpen(false);
              }}
              className="flex items-center gap-3 px-5 py-4 bg-[#141414] border border-[#262626] rounded-2xl text-sm font-bold text-white hover:border-sky-500/50 transition-all group"
            >
              <TrendingUp className="w-4 h-4 text-neutral-500 group-hover:text-sky-500 transition-colors" />
              <span>{LANGUAGES.find(l => l.id === selectedLanguage)?.name}</span>
              <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform duration-300", isLanguageDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isLanguageDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-48 bg-[#1f1f1f] border border-[#262626] rounded-2xl shadow-2xl z-[100] overflow-hidden p-2"
                >
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setSelectedLanguage(lang.id);
                        setIsLanguageDropdownOpen(false);
                        updatePreferences(lang.id);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                        selectedLanguage === lang.id ? "bg-sky-500/10 text-sky-400" : "text-neutral-400 hover:bg-[#262626] hover:text-white"
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="font-bold text-sm">{lang.name}</span>
                      {selectedLanguage === lang.id && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-8">
          {/* Analysis Action */}
          <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-500 uppercase tracking-[0.2em]">AI Intelligence</h3>
              <Sparkles className="w-4 h-4 text-sky-500" />
            </div>

            <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white">Gemini Pro</h4>
                <p className="text-[11px] text-neutral-500 leading-relaxed">Powered by Google's most capable AI model for deep trading analysis.</p>
              </div>
            </div>

            <button 
              onClick={generateSummary}
              disabled={summarizing || trades.length === 0}
              className="w-full py-5 bg-sky-500 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {summarizing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
              {summarizing ? 'Analyzing Data...' : 'Run Deep Analysis'}
            </button>
          </div>

          {/* Analysis Context */}
          <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-6">
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Analysis Context</h4>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-[#262626]">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-neutral-400">Trade History</span>
                </div>
                <span className="text-xs font-black text-white">{trades.length} Logs</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-[#262626]">
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-neutral-400">Strategies</span>
                </div>
                <span className="text-xs font-black text-white">{strategies.length} Active</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-[#262626]">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-neutral-400">Psychology</span>
                </div>
                <span className="text-xs font-black text-white">Full Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-500/5 border border-rose-500/20 rounded-[32px] p-10 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Analysis Failed</h3>
                  <p className="text-sm text-neutral-500 max-w-sm">{error}</p>
                </div>
                <button 
                  onClick={generateSummary}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            ) : summarizing ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[600px] bg-[#141414] border border-[#262626] rounded-[32px] flex flex-col items-center justify-center p-12 space-y-8"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-sky-500/10 border-t-sky-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-sky-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-bold text-white">Synthesizing Data</h3>
                  <p className="text-neutral-500 max-w-xs mx-auto text-sm leading-relaxed">
                    Gemini is currently analyzing your trade logs, psychological patterns, and strategy alignment...
                  </p>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-sky-500 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            ) : summary ? (
              <motion.div 
                key="summary"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] border border-[#262626] rounded-[32px] overflow-hidden shadow-2xl"
              >
                {/* Report Header */}
                <div className="p-8 lg:p-12 bg-gradient-to-b from-sky-500/5 to-transparent border-b border-[#262626]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sky-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Analysis Complete</span>
                      </div>
                      <h3 className="text-3xl font-bold text-white">Performance Intelligence Report</h3>
                      <div className="flex items-center gap-4 text-neutral-500 text-xs font-bold">
                        <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Gemini Pro</span>
                        <span className="w-1 h-1 bg-neutral-800 rounded-full" />
                        <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {selectedLanguage}</span>
                        <span className="w-1 h-1 bg-neutral-800 rounded-full" />
                        <span>{format(new Date(), 'MMM dd, yyyy • HH:mm')}</span>
                      </div>
                    </div>
                    <button 
                      onClick={generateSummary}
                      className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-2xl text-neutral-400 hover:text-white hover:border-sky-500/30 transition-all"
                      title="Refresh Analysis"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Report Content */}
                <div className="p-8 lg:p-12">
                  <div className="prose prose-invert max-w-none 
                    prose-p:text-neutral-400 prose-p:leading-[1.8] prose-p:text-[15px]
                    prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                    prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                    prose-strong:text-sky-400 prose-strong:font-bold
                    prose-ul:text-neutral-400 prose-li:my-2
                    prose-blockquote:border-l-sky-500 prose-blockquote:bg-sky-500/5 prose-blockquote:py-2 prose-blockquote:rounded-r-xl
                    prose-code:text-sky-300 prose-code:bg-sky-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                  ">
                    <Markdown>{summary}</Markdown>
                  </div>

                  {/* Action Footer */}
                  <div className="mt-12 pt-12 border-t border-[#262626] grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3 group hover:border-sky-500/30 transition-all">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      </div>
                      <h4 className="font-bold text-white text-sm">Reinforce</h4>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">Double down on identified strengths and winning patterns.</p>
                    </div>
                    <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3 group hover:border-sky-500/30 transition-all">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                      </div>
                      <h4 className="font-bold text-white text-sm">Refine</h4>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">Adjust strategies based on the suggested improvements.</p>
                    </div>
                    <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3 group hover:border-sky-500/30 transition-all">
                      <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                        <PlusCircle className="w-5 h-5 text-sky-500" />
                      </div>
                      <h4 className="font-bold text-white text-sm">Add</h4>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">Implement new risk rules or psychological techniques.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[600px] bg-[#141414] border border-[#262626] rounded-[32px] border-dashed flex flex-col items-center justify-center text-center p-12 space-y-8"
              >
                <div className="relative">
                  <div className="w-32 h-32 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-[#262626] group">
                    <Sparkles className="w-12 h-12 text-neutral-800 group-hover:text-sky-500/50 transition-colors duration-500" />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border border-dashed border-neutral-800 rounded-full"
                  />
                </div>
                <div className="max-w-sm space-y-4">
                  <h3 className="text-2xl font-bold text-neutral-400 tracking-tight">Intelligence Engine Standby</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Select an account and your preferred language to generate a deep synthesis of your trading performance, psychology, and strategy alignment using Gemini.
                  </p>
                </div>
                <button 
                  onClick={generateSummary}
                  className="flex items-center gap-3 px-10 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/5"
                >
                  Initialize Analysis <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
