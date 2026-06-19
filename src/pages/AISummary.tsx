import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Trade, TradingAccount } from '../types';
import { 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Zap, 
  Compass, 
  RefreshCw, 
  ShieldAlert, 
  Activity, 
  Layers,
  Award,
  BookOpen,
  ArrowRight,
  Database,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal } from '../components/ScrollReveal';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { toast } from 'sonner';

interface AIResult {
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  traderLevel: string;
  levelDescription: string;
  tradingEdge: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overview: string;
  primeTime: string;
  unsuitableTime: string;
  timeAnalysisDetails: string;
}

const translations: Record<string, any> = {
  my: {
    title: "AI Trader Insight",
    subtitle: "သင့်၏ Trading logs များအပေါ် အခြေခံ၍ dynamic အားသာချက်၊ အားနည်းချက်၊ level နှင့် trading edge ကို ဘက်လိုက်မှုမရှိပဲ အရှိကိုအရှိအတိုင်း ပြုပြင်ထုတ်နုတ်တင်ပြပေးသည့် intelligent trading companion။",
    reAnalyze: "ပြန်လည်သုံးသပ်ရန် (Re-analyze)",
    connectAccounts: "Connecting to Account",
    connectAccountsDesc: "AI ဆန်းစစ်မှု ပြုလုပ်လိုသော trading accounts များကို စိတ်ကြိုက် ရွေးချယ်ချိတ်ဆက်ပါ။",
    noAccounts: "ချိတ်ဆက်ထားသော accounts မရှိသေးပါ။",
    addAccountsFirst: "Accounts စาမျက်နှာတွင် အရင်ထည့်ရန်",
    accountsList: "ဆန်းစစ်မည့် အကောင့်များ",
    selectAccountTrigger: "Choose Account",
    noAccountSelected: "အကောင့် ရွေးချယ်ထားခြင်း မရှိပါ",
    allAccountsSelected: "အကောင့်အားလုံးကို ရွေးချယ်ထားသည်",
    accountsCount: "Accounts",
    selectAll: "Select All",
    clearAll: "Clear All",
    tradesCount: "trades",
    totalTradeLogs: "ဆန်းစစ်မည့် စုစုပေါင်း Trade logs",
    runAnalysisBtn: "AI Evaluation စတင်ရန်",
    warningNoAccount: "⚠️ ဆန်းစစ်ရန် Trading Account ရွေးချယ်ပေးပါ။",
    warningNoLanguage: "⚠️ အစီရင်ခံစာထွက်မည့် Language ကို ရွေးချယ်ပေးပါ။",
    warningNoTrades: "⚠️ ရွေးထားသော Account တွင် closed trades မရှိပါ။",
    warningNoTradesDesc: "ဆန်းစစ်ရန် trade logs အချက်အလက်များ မတွေ့ရှိပါ။ ကိန်းဂဏန်းများမရှိဘဲ evaluation ပြုလုပ်၍မရပါ။ trades page တွင် Trade status closed logs အရင်ထည့်ပါ။",
    preparing: "AI Trading Insights ကို တိကျစွာ တွက်ချက်ဆန်းစစ်နေပါသည်။ ခေတ္တစောင့်ဆိုင်းပေးပါ...",
    analyzingTitle: "AI Quantitative Analyzing...",
    analyzingDesc: "စနစ်မှ သင့်၏ entry context, psychology status, PnL ratios, leverage pattern နှင့် risk parameters များကို အသေးစိတ် တွက်ချက်စစ်ဆေးနေပါသည်။",
    traderProfile: "Trader Profile",
    evaluationComplete: "Evaluation complete",
    calculatedLevel: "Calculated Level",
    assessmentLabel: "Level Assessment:",
    winRateLabel: "Win Rate",
    totalTradesLabel: "Total Trades",
    winsLossesLabel: "Wins / Losses",
    netPnlLabel: "Total Net PnL",
    strengthsTitle: "ကျွမ်းကျင်မှု အားသာချက်များ (Strengths)",
    weaknessesTitle: "ပြတ်ယွင်းချက် အားနည်းချက်များ (Weaknesses)",
    tradingEdgeTitle: "Trading Edge & Strategy Consistency",
    recommendationsTitle: "အကြังပြု ပြုပြင်ချက်များ (Recommendations)",
    overviewTitle: "ပြုပြင်တိုးတက်မှု သုံးသပ်ချက်အနှစ်ချုပ် (Overview Report)",
    readyTitle: "AI Report ဆန်းစစ်မှုစတင်ရန် အဆင်သင့်ရှိပါသည်",
    readyDesc: "ဘယ်ဘက်ရှိ sidebar မီနူးမှ သင့်၏ trading accounts များကို ရွေးချယ်ပြီး အောက်ခြေရှိ \"AI Evaluation စတင်ရန်\" ခလုတ်အားနှိပ်၍ quantitative insights များကို ထုတ်ယူလိုက်ပါ။",
    languageLabel: "Choose Language",
    logsUnit: "logs",
    loadingData: "ဒေတာများကို ဆွဲယူနေပါသည်။ ခေတ္တစောင့်ပါ။...",
    toastErrorLoading: "ဒေတာဖတ်ရှုရာတွင် အမှားအယွင်းရှိခဲ့ပါသည်။",
    toastWarningHeading: "ဆန်းစစ်ရန် အနည်းဆုံး account တစ်ခု ရွေးချယ်ပေးပါ။",
    toastWarningLang: "ကျေးဇူးပြု၍ ဆန်းစစ်မည့် Language (ဘာသာစကား) ကို ရွေးချယ်ပေးပါ။",
    toastWarningNoClosed: "ရွေးချယ်ထားသော accounts များတွင် closed trades များ မရှိသေးပါ။ trade အသစ်များ အရင်ထည့်ပေးပါ။",
    toastSuccessAnalysis: "AI Analysis အသစ်ကို အောင်မြင်စွာ တင်ဆက်လိုက်ပါပြီ။",
    toastErrorAnalyzing: "AI Analysis အချက်အလက်များအား လုပ်ဆောင်ရာတွင် ချို့ယွင်းချက်ရှိခဲ့ပါသည်။",
    preparingText: "AI Trading Insights ကို တိကျစွာ တွက်ချက်ဆန်းစစ်နေပါသည်။ ခေတ္တစောင့်ဆိုင်းပေးပါ..."
  },
  en: {
    title: "AI Trader Insight",
    subtitle: "An unbiased, professional evaluation of your strategy, trading edge, strengths, weaknesses, and level based directly on your trade history.",
    reAnalyze: "Re-analyze",
    connectAccounts: "Connecting to Account",
    connectAccountsDesc: "Select the trading accounts you want to connect for AI evaluation.",
    noAccounts: "No connected accounts found.",
    addAccountsFirst: "Please add accounts in Accounts page first",
    accountsList: "Accounts for Analysis",
    selectAccountTrigger: "Choose Account",
    noAccountSelected: "No account selected",
    allAccountsSelected: "All Accounts Selected",
    accountsCount: "Accounts",
    selectAll: "Select All",
    clearAll: "Clear All",
    tradesCount: "trades",
    totalTradeLogs: "Total Trade Logs to Analyze",
    runAnalysisBtn: "Start AI Evaluation",
    warningNoAccount: "⚠️ Please select at least one Trading Account.",
    warningNoLanguage: "⚠️ Please select a report Language.",
    warningNoTrades: "⚠️ Selected accounts do not have closed trades.",
    warningNoTradesDesc: "No trade logs found for analysis. Please add closed trades in your Trades page first.",
    preparing: "Analyzing your trading performance data with AI. Please wait...",
    analyzingTitle: "AI Quantitative Analyzing...",
    analyzingDesc: "Analyzing your entry contexts, psychological triggers, PnL ratios, leverage use, and risk metrics in detail.",
    traderProfile: "Trader Profile",
    evaluationComplete: "Evaluation complete",
    calculatedLevel: "Calculated Level",
    assessmentLabel: "Level Assessment:",
    winRateLabel: "Win Rate",
    totalTradesLabel: "Total Trades",
    winsLossesLabel: "Wins / Losses",
    netPnlLabel: "Total Net PnL",
    strengthsTitle: "Trading Strengths",
    weaknessesTitle: "Areas of Weakness",
    tradingEdgeTitle: "Trading Edge & Strategy Consistency",
    recommendationsTitle: "Actionable Recommendations",
    overviewTitle: "Overview Performance Report",
    readyTitle: "AI Diagnostic Analysis Ready",
    readyDesc: "Select your trading accounts on the left panel, choose your preferred language, and click \"Start AI Evaluation\" to generate your report.",
    languageLabel: "Choose Language",
    logsUnit: "logs",
    loadingData: "Loading trading data, please wait...",
    toastErrorLoading: "Error loading trading dashboard logs.",
    toastWarningHeading: "Please select at least one trading account.",
    toastWarningLang: "Please choose a language for the AI analysis.",
    toastWarningNoClosed: "There are no closed trades in the selected accounts. Please add closed trades first.",
    toastSuccessAnalysis: "Successfully generated fresh AI trading diagnostics!",
    toastErrorAnalyzing: "Encountered an issue running the AI model analysis.",
    preparingText: "Analyzing your trading performance data with AI. Please wait..."
  },
  th: {
    title: "ข้อมูลเชิงลึก AI Trader",
    subtitle: "การประเมินวิเคราะห์ทักษะ จุดเด่น จุดบกพร่อง และระดับการเทรดอย่างตรงไปตรงมาจากข้อมูลบันทึกประวัติการเทรดจริงของคุณ",
    reAnalyze: "วิเคราะห์ใหม่ (Re-analyze)",
    connectAccounts: "Connecting to Account",
    connectAccountsDesc: "เลือกบัญชีเทรดที่ท่านต้องการใช้งานเพื่อส่งวิเคราะห์ข้อมูลประสิทธิภาพด้วย AI",
    noAccounts: "ไม่พบบัญชีเทรดที่เชื่อมต่อระบบ",
    addAccountsFirst: "กรุณาเพิ่มบัญชีเทรดที่หน้าบัญชีเทรดก่อน",
    accountsList: "บัญชีเทรดที่เลือกวิเคราะห์",
    selectAccountTrigger: "Choose Account",
    noAccountSelected: "ไม่ได้เลือกบัญชี",
    allAccountsSelected: "เลือกบัญชีทั้งหมดแล้ว",
    accountsCount: "บัญชีเทรด",
    selectAll: "เลือกทั้งหมด",
    clearAll: "ล้างทั้งหมด",
    tradesCount: "การเทรด",
    totalTradeLogs: "ประวัติบันทึกการเทรดทั้งหมด",
    runAnalysisBtn: "เริ่มการวิเคราะห์ด้วย AI",
    warningNoAccount: "⚠️ โปรดเลือกบัญชีเทรดอย่างน้อยหนึ่งบัญชี",
    warningNoLanguage: "⚠️ โปรดเลือกภาษาสำหรับรายงานข้อมูล",
    warningNoTrades: "⚠️ ไม่พบประวัติการเทรดที่ปิดแล้วในบัญชีที่เลือก",
    warningNoTradesDesc: "ไม่พบข้อมูลประวัติบันทึกการเทรดเพื่อใช้ในการวิเคราะห์ โปรดเปลี่ยนสถานะออเดอร์เป็น Closed ในหน้าบันทึกการเทรดก่อนทำงาน",
    preparing: "ระบบกำลังวิเคราะห์ข้อมูลการเทรดด้วย AI โปรดรอสักครู่...",
    analyzingTitle: "ระบบ AI กำลังวิเคราะห์ข้อมูลเชิงลึก...",
    analyzingDesc: "ระบบอัจฉริยะกำลังประเมินและประมวลผล สภาวะทางอารมณ์, สัดส่วนกำไร/ขาดทุน และกฎการควบคุมความเสี่ยงของเทรดเดอร์เพื่อสรุปผล",
    traderProfile: "โปรไฟล์เทรดเดอร์",
    evaluationComplete: "การประเมินผลสำเร็จ",
    calculatedLevel: "ระดับฝีมือเทรดเดอร์",
    assessmentLabel: "ผลประเมินระดับการเทรด:",
    winRateLabel: "อัตราการชนะ (Win Rate)",
    totalTradesLabel: "จำนวนบันทึกเทรดทั้งหมด",
    winsLossesLabel: "ชนะ / แพ้",
    netPnlLabel: "กำไรขาดทุนสุทธิสะสม",
    strengthsTitle: "จุดแข็งและการเข้าออเดอร์ที่ดี (Strengths)",
    weaknessesTitle: "จุดบกพร่องที่ควรระวังปรับปรุง (Weaknesses)",
    tradingEdgeTitle: "การรักษาความสสม่ำเสมอของกลยุทธ์ (Trading Edge)",
    recommendationsTitle: "คำแนะนำและการปฏิบัติตัว (Recommendations)",
    overviewTitle: "บทสรุปและรายงานเชิงคุณภาพ (Overview Report)",
    readyTitle: "พร้อมวิเคราะห์ผลงานเทรดของท่านแล้ว",
    readyDesc: "โปรดคลิกเลือกบัญชีเทรดหลักจากแถบเมนูด้านซ้าย เลือกภาษาคำตอบ และกดปุ่ม \"เริ่มการวิเคราะห์ด้วย AI\" เพื่อทำงานประมวลผล",
    languageLabel: "Choose Language",
    logsUnit: "รายการ",
    loadingData: "ระบบกำลังโหลดข้อมูลบัญชี โปรดรอสักครู่...",
    toastErrorLoading: "ไม่สามารถประมวลผลดึงข้อมูลรายการเทรดได้",
    toastWarningHeading: "กรุณาเลือกบัญชีเทรดอย่างน้อยหนึ่งบัญชี",
    toastWarningLang: "โปรดเลือกภาษาที่จะใช้ในรายงานสรุปผลสมบูรณ์",
    toastWarningNoClosed: "ไม่พบบันทึกการเทรดที่ปิดไปแล้วในบัญชีที่รวบรวม โปรดจัดการข้อมูลก่อน",
    toastSuccessAnalysis: "ทำการสร้างรายงานการวิเคราะห์เทรดด้วย AI สำเร็จเสร็จสิ้น",
    toastErrorAnalyzing: "เกิดข้อผิดพลาดในการประมวลผล AI กรุณาลองใหม่อีกครั้ง",
    preparingText: "ระบบกำลังจำลองการเทรดและวิเคราะห์ด้วย AI อย่างเป็นระบบ โปรดรอสักครู่..."
  }
};

export default function AISummary() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ai_summary_selected_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('ai_summary_selected_language') || '';
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [profileName, setProfileName] = useState('TRADER');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const t = translations[selectedLanguage || 'my'];

  // Sync selections with localStorage
  useEffect(() => {
    localStorage.setItem('ai_summary_selected_accounts', JSON.stringify(selectedAccountIds));
  }, [selectedAccountIds]);

  useEffect(() => {
    localStorage.setItem('ai_summary_selected_language', selectedLanguage);
  }, [selectedLanguage]);

  // Load accounts and trades
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch user profile username (full_name) first and fallback gracefully
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profErr && prof && prof.full_name) {
          setProfileName(prof.full_name);
        } else {
          setProfileName(user.email?.split('@')[0] || 'TRADER');
        }

        // Fetch accounts
        const { data: accts, error: acctsErr } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
        
        if (acctsErr) throw acctsErr;
        
        const fetchedAccounts = accts || [];
        setAccounts(fetchedAccounts);

        // Fetch closed trades
        const { data: trds, error: trdsErr } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'CLOSED');

        if (trdsErr) throw trdsErr;
        setTrades(trds || []);

        // Load saved selection if valid and matches loaded accounts
        let finalIds: string[] = [];
        const saved = localStorage.getItem('ai_summary_selected_accounts');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              finalIds = parsed.filter(id => fetchedAccounts.some(a => a.id === id));
            }
          } catch {
            // ignore
          }
        }
        setSelectedAccountIds(finalIds);
      } catch (err: any) {
        console.error("Error loading analysis data:", err);
        // use default fallback language translation for error to be completely safe
        toast.error(translations['my'].toastErrorLoading);
      } finally {
        setLoading(false);
      }
    };

    loadData().catch(e => console.error(e));
  }, [user]);

  // Handle selected account cache loading
  useEffect(() => {
    if (!user || selectedAccountIds.length === 0 || !selectedLanguage) {
      setResult(null);
      return;
    }
    const cacheKey = `ai_analysis_${user.id}_${[...selectedAccountIds].sort().join('_')}_${selectedLanguage}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setResult(JSON.parse(cached));
      } catch (e) {
        setResult(null);
      }
    } else {
      setResult(null);
    }
  }, [selectedAccountIds, selectedLanguage, user]);

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedAccountIds(accounts.map(a => a.id));
  };

  const handleSelectNone = () => {
    setSelectedAccountIds([]);
  };

  const runAnalysis = async () => {
    if (!user) return;
    if (selectedAccountIds.length === 0) {
      toast.warning(t.toastWarningHeading);
      return;
    }
    if (!selectedLanguage) {
      toast.warning(t.toastWarningLang);
      return;
    }

    // Filter trades based on selected accounts
    const filteredTrades = trades.filter(t => selectedAccountIds.includes(t.account_id));

    if (filteredTrades.length === 0) {
      toast.error(t.toastWarningNoClosed);
      return;
    }

    setAnalyzing(true);
    const toastId = toast.loading(t.preparingText);

    try {
      const filteredAccounts = accounts.filter(a => selectedAccountIds.includes(a.id));

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trades: filteredTrades,
          accounts: filteredAccounts,
          language: selectedLanguage
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Server response error" }));
        throw new Error(errData.error || "Analysis could not be processed.");
      }

      const data: AIResult = await response.json();
      
      // Save result to cache
      const cacheKey = `ai_analysis_${user.id}_${[...selectedAccountIds].sort().join('_')}_${selectedLanguage}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));

      setResult(data);
      toast.success(t.toastSuccessAnalysis, { id: toastId });
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      toast.error(error.message || t.toastErrorAnalyzing, { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedTradesCount = trades.filter(t => selectedAccountIds.includes(t.account_id)).length;

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <ScrollReveal>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-[#262626] pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                <Sparkles className="w-5 h-5 text-orange-500" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white m-0">{t.title}</h1>
            </div>
            <p className="text-neutral-400 max-w-xl text-base leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {result && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={runAnalysis}
                disabled={analyzing || !selectedLanguage || selectedAccountIds.length === 0}
                className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-neutral-300 border border-[#262626] px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={cn("w-4 h-4", analyzing && "animate-spin")} />
                {t.reAnalyze}
              </motion.button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-2 border-t-orange-500 border-r-orange-500/20 border-b-orange-500/20 border-l-orange-500/20 rounded-full animate-spin" />
          <p className="text-neutral-500 font-medium text-sm">{t.loadingData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Area: Account Connections & Language Selector */}
          <div className="lg:col-span-4 space-y-6">
            <ScrollReveal delay={0.1}>
              <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-6">
                
                {/* Interactive Language Selector Option (First step) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                    <span className="text-lg font-bold text-white tracking-tight">{t.languageLabel}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'my', label: 'မြန်မာဘာသာ (Burmese)', desc: 'Technical စကားများမှလွဲ၍ မြန်မာလိုအပြည့်အစုံ' },
                      { id: 'en', label: 'English (အင်္ဂလိပ်)', desc: 'Direct quantitative assessment in English' },
                      { id: 'th', label: 'ภาษาไทย (Thai)', desc: 'การวิเคราะห์เชิงปริมาณเป็นภาษาไทยอย่างสมบูรณ์' }
                    ].map((lang) => {
                      const isSelected = selectedLanguage === lang.id;
                      return (
                        <div
                          key={lang.id}
                          onClick={() => setSelectedLanguage(lang.id)}
                          className={cn(
                            "group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none text-left",
                            isSelected
                              ? "bg-orange-500/5 border-orange-500/45 text-white"
                              : "bg-[#0c0c0c] border-[#1e1e1e] text-neutral-400 hover:border-neutral-700 hover:bg-[#111]"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 transition-all flex-shrink-0",
                            isSelected
                              ? "border-orange-500 bg-orange-500 text-black"
                              : "border-neutral-700 group-hover:border-neutral-500"
                          )}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className={cn(
                              "text-xs font-bold block leading-none mb-1",
                              isSelected ? "text-orange-400" : "text-neutral-300"
                            )}>
                              {lang.label}
                            </span>
                            <span className="text-[10px] text-neutral-500 block leading-tight font-medium">
                              {lang.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Account Selection Option (Second step) */}
                <div className="border-t border-[#1f1f1f] pt-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <Database className="w-4 h-4 text-orange-500" />
                      <h3 className="text-sm font-bold text-neutral-300 tracking-tight">{t.connectAccounts}</h3>
                    </div>
                    <p className="text-neutral-500 text-xs leading-normal">
                      {t.connectAccountsDesc}
                    </p>
                  </div>

                  {accounts.length === 0 ? (
                    <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-center space-y-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mx-auto" />
                      <p className="text-xs text-orange-200/80 font-medium">{t.noAccounts}</p>
                      <a href="/accounts" className="inline-block text-[11px] text-orange-400 hover:underline">{t.addAccountsFirst}</a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[11px] font-bold text-neutral-500 uppercase tracking-wider border-b border-[#1f1f1f] pb-2">
                        <span>{t.accountsList}</span>
                      </div>

                      <div className="relative">
                        {/* Dropdown Trigger Button */}
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="w-full flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#222] rounded-2xl hover:border-orange-500/30 transition-all text-left focus:outline-none"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-neutral-500 block font-semibold mb-0.5 uppercase tracking-widest">{t.selectAccountTrigger}</span>
                            <span className="text-sm font-bold text-white block truncate">
                              {selectedAccountIds.length === 0
                                ? t.noAccountSelected
                                : selectedAccountIds.length === accounts.length
                                  ? t.allAccountsSelected
                                  : accounts.filter(a => selectedAccountIds.includes(a.id)).map(a => a.name).join(', ')}
                            </span>
                          </div>
                          <ChevronDown className={cn("w-5 h-5 text-neutral-500 transition-transform ml-2", dropdownOpen && "rotate-180")} />
                        </button>

                        {/* Dropdown Options Box */}
                        {dropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setDropdownOpen(false)} 
                            />
                            <div className="absolute left-0 right-0 mt-2 bg-[#121212] border border-[#262626] rounded-2xl shadow-2xl z-40 overflow-hidden max-h-[350px] flex flex-col">
                              {/* Controls inside dropdown */}
                              <div className="flex justify-between items-center bg-[#0d0d0d] px-4 py-3 border-b border-[#222] text-[10px] font-bold text-neutral-400">
                                <span>{t.accountsCount} ({accounts.length})</span>
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectAll();
                                    }}
                                    className="hover:text-white transition-all uppercase tracking-wider text-[9px] text-orange-400"
                                  >
                                    {t.selectAll}
                                  </button>
                                  <span className="text-neutral-700">|</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectNone();
                                    }}
                                    className="hover:text-white transition-all uppercase tracking-wider text-[9px] text-neutral-400"
                                  >
                                    {t.clearAll}
                                  </button>
                                </div>
                              </div>

                              {/* Dropdown Items List */}
                              <div className="overflow-y-auto p-2 space-y-1">
                                {accounts.map(acc => {
                                  const isSelected = selectedAccountIds.includes(acc.id);
                                  const accountTradesCount = trades.filter(t => t.account_id === acc.id).length;
                                  return (
                                    <div
                                      key={acc.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAccountSelection(acc.id);
                                      }}
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer select-none",
                                        isSelected
                                          ? "bg-orange-500/5 text-white"
                                          : "hover:bg-neutral-900 text-neutral-400"
                                      )}
                                    >
                                      <div className="space-y-0.5 min-w-0 flex-1">
                                        <span className={cn(
                                          "text-sm block truncate leading-tight font-bold",
                                          isSelected ? "text-orange-400" : "text-neutral-300"
                                        )}>
                                          {acc.name}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium">
                                          <span className="bg-[#181818] px-1 rounded text-neutral-400">{acc.propfirm}</span>
                                          <span>Size: {acc.account_size}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 ml-3">
                                        <span className="text-[10px] text-neutral-500 bg-[#161616] px-2 py-0.5 rounded-full border border-[#222]">
                                          {accountTradesCount} {t.tradesCount}
                                        </span>
                                        <div className={cn(
                                          "w-4 h-4 rounded flex items-center justify-center border transition-all",
                                          isSelected
                                            ? "bg-orange-500 border-orange-500 text-black"
                                            : "border-neutral-700"
                                        )}>
                                          {isSelected && (
                                            <svg className="w-3 h-3 stroke-black stroke-2 fill-none" viewBox="0 0 24 24">
                                              <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#1f1f1f] pt-4 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">{t.totalTradeLogs}</span>
                  <span className="text-sm font-bold text-white">{selectedTradesCount} {t.logsUnit}</span>
                </div>

                {!result && (() => {
                  const isReady = selectedAccountIds.length > 0 && selectedLanguage !== '' && selectedTradesCount > 0 && !analyzing;
                  return (
                    <div className="space-y-3">
                      <motion.button
                        whileHover={isReady ? { scale: 1.02 } : {}}
                        whileTap={isReady ? { scale: 0.98 } : {}}
                        onClick={runAnalysis}
                        disabled={!isReady}
                        className={cn(
                          "w-full flex items-center justify-center gap-2.5 font-extrabold text-sm py-4 rounded-2xl transition-all shadow-md duration-300",
                          isReady
                            ? "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-black cursor-pointer shadow-orange-500/15"
                            : "bg-[#181818] text-neutral-600 cursor-not-allowed border border-neutral-800"
                        )}
                      >
                        {analyzing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4 shadow-sm" />
                        )}
                        {t.runAnalysisBtn}
                      </motion.button>

                      {!isReady && (
                        <p className="text-[10px] text-neutral-400 bg-neutral-900/50 p-3 rounded-xl text-center font-medium leading-normal border border-neutral-800/20">
                          {selectedAccountIds.length === 0 && t.warningNoAccount}
                          {selectedAccountIds.length > 0 && selectedLanguage === '' && t.warningNoLanguage}
                          {selectedAccountIds.length > 0 && selectedLanguage !== '' && selectedTradesCount === 0 && t.warningNoTrades}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {selectedAccountIds.length > 0 && selectedTradesCount === 0 && (
                  <div className="flex items-start gap-2 bg-[#ff0000]/5 border border-[#ff0000]/10 p-4 rounded-2xl text-left">
                    <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-400 leading-normal font-medium">
                      {t.warningNoTradesDesc}
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Main Dashboard Panel: AI Insights Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {analyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-[#141414] border border-[#262626] rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-6 min-h-[450px]"
                >
                  <div className="relative">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-[32px] flex items-center justify-center border border-orange-500/30 animate-pulse">
                      <Brain className="w-10 h-10 text-orange-500 animate-bounce" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center animate-ping opacity-75" />
                  </div>
                  <div className="space-y-2.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">{t.analyzingTitle}</h2>
                    <p className="text-neutral-400 max-w-sm mx-auto text-xs leading-relaxed">
                      {t.analyzingDesc}
                    </p>
                  </div>
                  <div className="w-48 bg-[#1f1f1f] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full w-2/3 rounded-full animate-[progress_2s_infinite_ease-in-out]" />
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  
                  {/* Summary & Trader Level Card */}
                  <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-3xl -z-10" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1f1f1f]">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/5 px-2.5 py-1 rounded border border-orange-500/15">{t.traderProfile}</span>
                          <span className="text-xs text-neutral-500 font-medium">{t.evaluationComplete}</span>
                        </div>
                        <h2 className="text-2xl font-black text-white m-0 tracking-tight flex flex-wrap items-center gap-2">
                          <span>{profileName.toUpperCase()}</span>
                          <span className="text-xs font-normal text-neutral-400 bg-[#1a1a1a] border border-[#2d2d2d] px-2.5 py-1 rounded-xl shadow-sm">
                            {accounts.filter(a => selectedAccountIds.includes(a.id)).map(a => a.name).join(', ')}
                          </span>
                        </h2>
                      </div>

                      <div className="flex items-center gap-4 bg-[#0a0a0a] border border-[#1e1e1e] p-3.5 rounded-2xl">
                        <Award className="w-6 h-6 text-orange-500 flex-shrink-0" />
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{t.calculatedLevel}</label>
                          <span className="text-base font-black text-white tracking-tight leading-none block mt-0.5">{result.traderLevel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                        <span className="text-orange-400 font-bold">{t.assessmentLabel}</span> {result.levelDescription}
                      </p>
                    </div>
                  </div>

                  {/* Quantitative Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 text-left space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.winRateLabel}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white tracking-tight">{formatPercent(result.winRate)}</span>
                        {result.winRate >= 50 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>

                    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 text-left space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.totalTradesLabel}</span>
                      <span className="text-2xl font-black text-white tracking-tight">{result.totalTrades} {t.logsUnit}</span>
                    </div>

                    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 text-left space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.winsLossesLabel}</span>
                      <span className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                        <span className="text-emerald-500">{result.winningTrades}</span>
                        <span className="text-neutral-600 text-sm">/</span>
                        <span className="text-rose-500">{result.losingTrades}</span>
                      </span>
                    </div>

                    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 text-left space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.netPnlLabel}</span>
                      <span className={cn(
                        "text-2xl font-black tracking-tight",
                        result.totalPnL >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {formatCurrency(result.totalPnL)}
                      </span>
                    </div>
                  </div>

                  {/* Time-Based Performance Analysis (ကုန်သွယ်ချိန် ဆန်းစစ်ချက်) */}
                  <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-6">
                    <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                      <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/15">
                        <Activity className="w-4 h-4 text-orange-500" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        {selectedLanguage === 'my' ? "ကုန်သွယ်ချိန် ဆန်းစစ်ချက် (Time & Session Diagnostics)" : "Time & Session Performance Diagnostics"}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Prime Time Card */}
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 bg-emerald-500/10 rounded-md flex items-center justify-center border border-emerald-500/10">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                            {selectedLanguage === 'my' ? "Prime Time (ကုန်သွယ်ရန် အကောင်းဆုံးအချိန်)" : "Prime Time (Best Trading Time)"}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed font-semibold whitespace-pre-wrap">
                          {result.primeTime}
                        </p>
                      </div>

                      {/* Unsuitable Time Card */}
                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 bg-rose-500/10 rounded-md flex items-center justify-center border border-rose-500/10">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          </div>
                          <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                            {selectedLanguage === 'my' ? "Unsuitable Time (මသင့်တော်သောအချိန်)" : "Unsuitable Time (Worst Trading Time)"}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed font-semibold whitespace-pre-wrap">
                          {result.unsuitableTime}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Hourly Breakdown & Duration Tracker */}
                    <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 bg-orange-500/10 rounded-md flex items-center justify-center border border-orange-500/15">
                          <Zap className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                          {selectedLanguage === 'my' ? "အချိန်နှင့် Trade ကြာချိန် ခွဲခြားပြသမှု (Detailed Time & Holding Analysis)" : "Detailed Time & Holding Analysis"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap">
                        {result.timeAnalysisDetails}
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses Comparative Dual Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-5">
                      <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                        <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/10">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.strengthsTitle}</h3>
                      </div>
                      <ul className="space-y-3.5">
                        {result.strengths.map((str, idx) => (
                           <li key={idx} className="flex items-start gap-3 text-xs text-neutral-300 leading-normal font-medium">
                            <span className="text-emerald-500 font-bold block mt-0.5">•</span>
                            <span className="flex-1">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-5">
                      <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                        <div className="w-7 h-7 bg-rose-500/10 rounded-lg flex items-center justify-center border border-rose-500/10">
                          <XCircle className="w-4 h-4 text-rose-500" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.weaknessesTitle}</h3>
                      </div>
                      <ul className="space-y-3.5">
                        {result.weaknesses.map((weak, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs text-neutral-300 leading-normal font-medium">
                            <span className="text-rose-500 font-bold block mt-0.5">•</span>
                            <span className="flex-1">{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Trading Edge Analysis block */}
                  <div className="bg-[#141414]/80 border border-[#262626] rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                      <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/15">
                        <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.tradingEdgeTitle}</h3>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-semibold">
                      {result.tradingEdge}
                    </p>
                  </div>

                  {/* Actionable Recommendations Layout */}
                  <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-5">
                    <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                      <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/10">
                        <Compass className="w-4 h-4 text-blue-500" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.recommendationsTitle}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {result.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl relative overflow-hidden group">
                          <div className="text-lg font-black text-neutral-700 select-none">#{idx + 1}</div>
                          <p className="text-xs text-neutral-300 leading-relaxed font-medium flex-1 m-0">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deep Detailed Overview Report */}
                  <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                      <div className="w-7 h-7 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/10">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.overviewTitle}</h3>
                    </div>
                    <div className="p-4 bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl">
                      <p className="text-xs text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap">
                        {result.overview}
                      </p>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#141414] border border-dashed border-[#262626] rounded-[32px] p-24 flex flex-col items-center justify-center text-center space-y-6 min-h-[450px]"
                >
                  <div className="w-20 h-20 bg-orange-500/5 rounded-[24px] flex items-center justify-center border border-orange-500/10">
                    <Brain className="w-10 h-10 text-orange-500/40" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{t.readyTitle}</h2>
                    <p className="text-neutral-500 max-w-sm mx-auto text-xs leading-relaxed">
                      {t.readyDesc}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </div>
  );
}
