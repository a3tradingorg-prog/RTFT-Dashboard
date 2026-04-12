import React, { useState, useEffect, useRef, useCallback } from 'react';
import { callGeminiWithRetry } from '../lib/gemini';
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
import { CoolDownTimer } from '../components/CoolDownTimer';
import { ScrollReveal } from '../components/ScrollReveal';

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
  const [analysisType, setAnalysisType] = useState<'quick' | 'deep'>('quick');
  const [lastQuotaError, setLastQuotaError] = useState<number | null>(() => {
    const cached = localStorage.getItem('last_quota_error');
    return cached ? parseInt(cached) : null;
  });
  const isFetchingRef = useRef(false);

  const updateQuotaError = useCallback((time: number) => {
    setLastQuotaError(time);
    localStorage.setItem('last_quota_error', time.toString());
  }, []);
  
  // Preferences
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  
  // UI State
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const accountRef = useClickOutside(() => setIsAccountDropdownOpen(false));
  const languageRef = useClickOutside(() => setIsLanguageDropdownOpen(false));

  useEffect(() => {
    if (user) {
      fetchInitialData().catch(err => console.error('Initial data fetch error:', err));

      // Subscribe to user profile changes (for language preferences)
      const profileSub = supabase
        .channel(`profile_realtime_${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchInitialData().catch(err => console.error('Realtime profile fetch error:', err));
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
      fetchAccountData().catch(err => console.error('Account data fetch error:', err));

      // Subscribe to realtime changes for AI summaries
      const summarySub = supabase
        .channel(`summary_realtime_${selectedAccountId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'ai_summaries_cache',
          filter: `account_id=eq.${selectedAccountId}`
        }, () => {
          fetchAccountData().catch(err => console.error('Realtime summary fetch error:', err));
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

      if (tradesRes.data) {
        const uniqueTrades = Array.from(new Map(tradesRes.data.map((t: any) => [t.id, t])).values());
        setTrades(uniqueTrades);
      }
      if (strategiesRes.data) {
        const uniqueStrategies = Array.from(new Map(strategiesRes.data.map((s: any) => [s.id, s])).values());
        setStrategies(uniqueStrategies);
      }
      
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


  const generateHash = (data: any) => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  };

  const generateSummary = async () => {
    if (isFetchingRef.current) return;

    // Check for recent quota error from localStorage to sync across tabs
    const cachedQuotaError = localStorage.getItem('last_quota_error');
    const lastErrorTime = cachedQuotaError ? parseInt(cachedQuotaError) : null;
    
    // If we hit a quota error recently (within 5 mins), warn the user
    if (lastErrorTime && Date.now() - lastErrorTime < 300000) {
      setError("Daily AI Quota Reached. Please wait a few minutes or try again tomorrow.");
      return;
    }

    if (trades.length === 0) {
      setError("No trades found to analyze for this account.");
      return;
    }

    isFetchingRef.current = true;
    setSummarizing(true);
    setError(null);
    setSummary(null); // Clear previous summary to allow re-run feedback

    const toastId = toast.loading(`Initializing ${analysisType} performance analysis...`);

    try {
      // Prepare data for AI - Focus on Outcome, Entry Reason, Risk:Reward
      // Extreme Data Minimization: 10 for Quick, 30 for Deep
      const account = accounts.find(a => a.id === selectedAccountId);
      const limit = analysisType === 'quick' ? 10 : 30;
      const recentTrades = trades.slice(0, limit);
      
      // Convert to CSV-like string to minimize tokens
      const csvHeader = "O,R,RR,P,A";
      const csvData = recentTrades.map(t => {
        let rr = 0;
        const risk = Math.abs(t.entry_price - (t.stop_loss || t.entry_price));
        const reward = Math.abs((t.take_profit || t.entry_price) - t.entry_price);
        if (risk > 0) rr = Number((reward / risk).toFixed(1));
        
        const outcome = t.pnl > 0 ? 'W' : t.pnl < 0 ? 'L' : 'B';
        const reason = (t.entry_context || 'N/A').replace(/,/g, ';'); // Avoid CSV break
        return `${outcome},${reason},${rr},${t.pnl.toFixed(0)},${t.asset}`;
      }).join('\n');

      const tradeDataString = `${csvHeader}\n${csvData}`;
      const dataHash = generateHash(`${tradeDataString}-${analysisType}`);
      const today = new Date().toISOString().split('T')[0];

      // Check cache first using account_id, data_hash, AND language
      const { data: cachedAnalysis } = await supabase
        .from('analysis_cache')
        .select('analysis_result')
        .eq('account_id', selectedAccountId)
        .eq('data_hash', dataHash)
        .eq('language', selectedLanguage)
        .maybeSingle();

      if (cachedAnalysis) {
        setSummary(cachedAnalysis.analysis_result);
        setSummarizing(false);
        isFetchingRef.current = false;
        toast.success('Loaded from cache.', { id: toastId });
        return;
      }

      const prompt = `
        ### ROLE: High-Efficiency Trading Data Analyst (Token-Optimized Mode)
        ### CONTEXT: Analyzing live trading account "${account?.name}" with TPM limits.
        ### ANALYSIS TYPE: ${analysisType.toUpperCase()}
        
        ### OPERATIONAL GUIDELINES:
        1. Focus only on 'Outcome', 'Entry Reason', and 'Risk:Reward'.
        2. Output only 'High-Impact Findings'. Do not repeat data.
        3. Use compressed Markdown tables and bullet points. No conversational filler.
        4. Prioritize most recent 20% of trades and 5 largest losses.
        
        ### TASK: ${analysisType === 'quick' ? 'QUICK PERFORMANCE SNAPSHOT' : 'DEEP PERFORMANCE AUDIT (PRODUCTION ENV)'}
        
        ### LANGUAGE REQUIREMENT:
        CRITICAL: You must provide the entire analysis and report in ${selectedLanguage}. 
        If the language is Myanmar, use professional Burmese terminology while keeping technical trading terms like 'BSL', 'SSL', 'FVG', 'RR', 'FVG', 'OB' in English.
        
        ### DATA TO ANALYZE (CSV FORMAT):
        Account Size: ${account?.account_size}
        Balance: ${formatCurrency(account?.current_balance || 0)}
        Trades (O=Outcome, R=Reason, RR=RiskReward, P=PnL, A=Asset):
        ${tradeDataString}
        
        ### EXECUTION STEPS:
        1. Pre-filter: Identify 3 most significant equity curve drops.
        2. Pattern Recognition: Compare 'Entry Logic' of losing vs winning trades.
        3. Synthesis: Provide "Trader's Blindspot" analysis.
        
        ### TOKEN CONSTRAINTS:
        - Response MUST NOT exceed 300 tokens.
        - Use Technical Trading Shorthand (RR, BE, FVG, etc.).
        - Focus 80% on 'Why losses happened' and 20% on 'How to scale wins'.
        
        ### OUTPUT STRUCTURE:
        - **Core Edge:** [1 sentence]
        - **Primary Leak:** [1 sentence]
        - **Strategic Fix:** [3 actionable bullet points]
        - Table: [Trade Patterns]
        - List: [Actionable Adjustments]
      `;

      toast.loading('Synthesizing data with Gemini 1.5 Flash...', { id: toastId });

      const response = await callGeminiWithRetry(prompt, {
        systemInstruction: "You are a High-Efficiency Trading Data Analyst. Use technical shorthand. Be concise. No filler."
      }, 3, toastId, updateQuotaError);
      
      const generatedText = response.text || "Could not generate summary.";

      setSummary(generatedText);

      // Save to cache
      await supabase.from('analysis_cache').upsert({
        account_id: selectedAccountId,
        analysis_date: today,
        data_hash: dataHash,
        language: selectedLanguage,
        analysis_result: generatedText,
        created_at: new Date().toISOString()
      }, { onConflict: 'account_id, data_hash, language' });

      toast.success('Analysis complete and cached.', { id: toastId });
    } catch (err: any) {
      console.error(err);
      const isQuotaError = err?.message?.includes('429') || 
                         err?.status === 429 || 
                         JSON.stringify(err).includes('429') ||
                         err?.message?.toLowerCase().includes('quota');
                         
      const errorMessage = isQuotaError 
        ? "Gemini API quota exceeded. The free tier has limits. Please wait 1-2 minutes and try again." 
        : "Failed to generate AI summary. Please check your API configuration or try again later.";
      setError(errorMessage);
      toast.error(isQuotaError ? 'Quota Exceeded' : 'Analysis failed', { id: toastId });
    } finally {
      setSummarizing(false);
      isFetchingRef.current = false;
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <ScrollReveal>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-sky-500" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">AI Summarization</h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-neutral-500 font-medium ml-1">Advanced analytical core powered by multi-agent intelligence.</p>
              {lastQuotaError && Date.now() - lastQuotaError < 120000 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Quota Cooling Down</span>
                </div>
              )}
            </div>
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
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-8">
          {/* Analysis Action */}
          <ScrollReveal>
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-neutral-500 uppercase tracking-[0.2em]">AI Intelligence</h3>
                <Sparkles className="w-4 h-4 text-sky-500" />
              </div>

              <div className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-4">
                <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white">Gemini 1.5 Flash</h4>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">Powered by Google's latest high-efficiency AI model for deep trading analysis.</p>
                </div>
              </div>

              {lastQuotaError && Date.now() - lastQuotaError < 3600000 && (
                <CoolDownTimer lastError={lastQuotaError} />
              )}

              {/* Analysis Type Toggle */}
              <div className="flex p-1 bg-[#0a0a0a] border border-[#262626] rounded-2xl">
                <button
                  onClick={() => setAnalysisType('quick')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    analysisType === 'quick' ? "bg-sky-500 text-black shadow-lg shadow-sky-500/20" : "text-neutral-500 hover:text-white"
                  )}
                >
                  Quick Analysis (10)
                </button>
                <button
                  onClick={() => setAnalysisType('deep')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    analysisType === 'deep' ? "bg-sky-500 text-black shadow-lg shadow-sky-500/20" : "text-neutral-500 hover:text-white"
                  )}
                >
                  Deep Analysis (30)
                </button>
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
                {summarizing ? 'Analyzing Data...' : `Run ${analysisType === 'quick' ? 'Quick' : 'Deep'} Analysis`}
              </button>
            </motion.div>
          </ScrollReveal>

          {/* Analysis Context */}
          <ScrollReveal delay={0.1}>
            <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-6">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Analysis Context</h4>
              <div className="space-y-5">
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-[#262626]"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold text-neutral-400">Trade History</span>
                  </div>
                  <span className="text-xs font-black text-white">{trades.length} Logs</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-[#262626]"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold text-neutral-400">Strategies</span>
                  </div>
                  <span className="text-xs font-black text-white">{strategies.length} Active</span>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-[#262626]"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold text-neutral-400">Psychology</span>
                  </div>
                  <span className="text-xs font-black text-white">Full Tracking</span>
                </motion.div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {error ? (
              <ScrollReveal key="error">
                <motion.div 
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
              </ScrollReveal>
            ) : summarizing ? (
              <ScrollReveal key="loading">
                <motion.div 
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
              </ScrollReveal>
            ) : summary ? (
              <ScrollReveal key="summary">
                <motion.div 
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
                          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Gemini 1.5 Flash</span>
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
                      <motion.div 
                        whileHover={{ y: -4 }}
                        className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3 group hover:border-sky-500/30 transition-all"
                      >
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-white text-sm">Reinforce</h4>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">Double down on identified strengths and winning patterns.</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ y: -4 }}
                        className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3 group hover:border-sky-500/30 transition-all"
                      >
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                          <Lightbulb className="w-5 h-5 text-amber-500" />
                        </div>
                        <h4 className="font-bold text-white text-sm">Refine</h4>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">Adjust strategies based on the suggested improvements.</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ y: -4 }}
                        className="p-6 bg-[#0a0a0a] border border-[#262626] rounded-2xl space-y-3 group hover:border-sky-500/30 transition-all"
                      >
                        <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                          <PlusCircle className="w-5 h-5 text-sky-500" />
                        </div>
                        <h4 className="font-bold text-white text-sm">Add</h4>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">Implement new risk rules or psychological techniques.</p>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ) : (
              <ScrollReveal key="placeholder">
                <motion.div 
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
              </ScrollReveal>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
