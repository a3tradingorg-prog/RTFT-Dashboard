import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  ChevronDown,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal } from '../components/ScrollReveal';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AIResult {
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  traderLevel: string;
  levelDescription: string;
  tradingEdge: string;
  hasTradingEdge: boolean;
  tradingEdgePercentage: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overview: string;
  primeTime: string;
  unsuitableTime: string;
  timeAnalysisDetails: string;
  edgeActionsTodo: string[];
  edgeActionsAvoid: string[];
  psychologyAnalysis: string;
  riskAnalysis: string;
  riskActionsTodo: string[];
  riskActionsAvoid: string[];
  selectedAccountIds?: string[];
  selectedLanguage?: string;
}

const translations: Record<string, any> = {
  my: {
    title: "AI Trader Insight",
    subtitle: "သင့်၏ Trading logs များအပေါ် အခြေခံ၍ dynamic အားသာချက်၊ အားနည်းချက်၊ level နှင့် trading edge ကို ဘက်လိုက်မှုမရှိပဲ အရှိကိုအရှိအတိုင်း ပြုပြင်ထုတ်နုတ်တင်ပြပေးသည့် intelligent trading companion။",
    reAnalyze: "ပြန်လည်သုံးသပ်ရန် (Re-analyze)",
    connectAccounts: "Connecting to Account",
    connectAccountsDesc: "AI ဆန်းစစ်မှု ပြုလုပ်လိုသော trading accounts များကို စိတ်ကြိုက် ရွေးချယ်ချိတ်ဆက်ပါ။",
    noAccounts: "ချိတ်ဆက်ထားသော accounts မရှိသေးပါ။",
    addAccountsFirst: "Accounts စာမျက်နှာတွင် အရင်ထည့်ရန်",
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
    tradingEdgeScoreLabel: "Trading Edge Score",
    hasEdgeLabel: "Trading Edge ရှိမရှိ",
    hasEdgeYes: "ရှိပါသည်",
    hasEdgeNo: "မရှိပါ",
    strengthsTitle: "ကျွမ်းကျင်မှု အားသာချက်များ (Strengths)",
    weaknessesTitle: "ပြတ်ယွင်းချက် အားနည်းချက်များ (Weaknesses)",
    tradingEdgeTitle: "Trading Edge & Strategy Consistency",
    edgeImprovementTitle: "Trading Edge ပိုကောင်းလာစေရန် ပြင်ဆင်ချက်များ (Do's & Don'ts)",
    edgeDoLabel: "ဆောင်ရွက်ရမည့် အချက်များ (Do's)",
    edgeAvoidLabel: "ရှောင်ကြဉ်ရမည့် အချက်များ (Avoids)",
    psychologyTitle: "ကုန်သွယ်သူ၏ စိတ်ဓာတ်ပိုင်းဆိုင်ရာ ဆန်းစစ်ချက် (Trader Psychology Analysis)",
    recommendationsTitle: "အကြံပြု ပြုပြင်ချက်များ (Recommendations)",
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
    preparingText: "AI Trading Insights ကို တိကျစွာ တွက်ချက်ဆန်းစစ်နေပါသည်။ ခေတ္တစောင့်ဆိုင်းပေးပါ...",
    riskTitle: "Risk Management ဆန်းစစ်ချက် (Risk Management)",
    riskDoLabel: "ဘေးကင်းစေရန် လိုက်နာဆောင်ရွက်ရန်များ (Risk Do's)",
    riskAvoidLabel: "လုံးဝရှောင်ကြဉ်ရမည့် အချက်များ (Risk Avoids)",
    downloadReport: "PDF Report ဒေါင်းလုဒ်လုပ်ရန်",
    downloadingReport: "PDF ဆွဲနေပါသည်...",
    downloadSuccess: "PDF Report ကို အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ!"
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
    tradingEdgeScoreLabel: "Trading Edge Score",
    hasEdgeLabel: "Has Trading Edge",
    hasEdgeYes: "Yes",
    hasEdgeNo: "No",
    strengthsTitle: "Trading Strengths",
    weaknessesTitle: "Areas of Weakness",
    tradingEdgeTitle: "Trading Edge & Strategy Consistency",
    edgeImprovementTitle: "Trading Edge Improvement Guidelines (Do's & Don'ts)",
    edgeDoLabel: "Actions to Do (Establish Edge)",
    edgeAvoidLabel: "Actions to Avoid (Protect Edge)",
    psychologyTitle: "Trader Psychology & Discipline Analysis",
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
    preparingText: "Analyzing your trading performance data with AI. Please wait...",
    riskTitle: "Risk Management & Capital Protection Analysis",
    riskDoLabel: "Risk Actions to Do (Capital Protection)",
    riskAvoidLabel: "Risk Actions to Avoid (Avoid Ruin)",
    downloadReport: "Download PDF Report",
    downloadingReport: "Generating PDF...",
    downloadSuccess: "PDF Report downloaded successfully!"
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
    tradingEdgeScoreLabel: "คะแนนแต้มต่อกลยุทธ์ (Trading Edge Score)",
    hasEdgeLabel: "มีแต้มต่อระบบเทรด (Has Edge)",
    hasEdgeYes: "มีแต้มต่อ (Yes)",
    hasEdgeNo: "ไม่มีแต้มต่อ (No)",
    strengthsTitle: "จุดแข็งและการเข้าออเดอร์ที่ดี (Strengths)",
    weaknessesTitle: "จุดบกพร่องที่ควรระวังปรับปรุง (Weaknesses)",
    tradingEdgeTitle: "การรักษาความสสม่ำเสมอของกลยุทธ์ (Trading Edge)",
    edgeImprovementTitle: "แนวทางปรับปรุงแต้มต่อระบบเทรด (Do's & Don'ts)",
    edgeDoLabel: "สิ่งที่ควรปฏิบัติ (Do's)",
    edgeAvoidLabel: "สิ่งที่ควรหลีกเลี่ยง (Avoids)",
    psychologyTitle: "การวิเคราะห์สภาวะทางอารมณ์และจิตวิทยาของเทรดเดอร์ (Trader Psychology)",
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
    preparingText: "ระบบกำลังจำลองการเทรดและวิเคราะห์ด้วย AI อย่างเป็นระบบ โปรดรอสักครู่...",
    riskTitle: "การวิเคราะห์การจัดการความเสี่ยง (Risk Management Analysis)",
    riskDoLabel: "สิ่งที่ควรทำเพื่อป้องกันความเสี่ยง (Risk Do's)",
    riskAvoidLabel: "สิ่งที่ควรหลีกเลี่ยงเพื่อจำกัดความเสี่ยง (Risk Avoids)",
    downloadReport: "ดาวน์โหลดรายงาน PDF",
    downloadingReport: "กำลังสร้าง PDF...",
    downloadSuccess: "ดาวน์โหลดรายงาน PDF สำเร็จแล้ว!"
  }
};

const tailwindColors: Record<string, string> = {
  'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1', 'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155', 'slate-800': '#1e293b', 'slate-900': '#0f172a', 'slate-950': '#020617',
  'zinc-50': '#fafafa', 'zinc-100': '#f4f4f5', 'zinc-200': '#e4e4e7', 'zinc-300': '#d4d4d8', 'zinc-400': '#a1a1aa', 'zinc-500': '#71717a', 'zinc-600': '#52525b', 'zinc-700': '#3f3f46', 'zinc-800': '#27272a', 'zinc-900': '#18181b', 'zinc-950': '#09090b',
  'neutral-50': '#fafafa', 'neutral-100': '#f5f5f5', 'neutral-200': '#e5e5e5', 'neutral-300': '#d4d4d4', 'neutral-400': '#a3a3a3', 'neutral-500': '#737373', 'neutral-600': '#525252', 'neutral-700': '#404040', 'neutral-800': '#262626', 'neutral-900': '#171717', 'neutral-950': '#0a0a0a',
  'emerald-50': '#ecfdf5', 'emerald-100': '#d1fae5', 'emerald-200': '#a7f3d0', 'emerald-300': '#6ee7b7', 'emerald-400': '#34d399', 'emerald-500': '#10b981', 'emerald-600': '#059669', 'emerald-700': '#047857', 'emerald-800': '#065f46', 'emerald-900': '#064e3b', 'emerald-950': '#022c22',
  'rose-50': '#fff1f2', 'rose-100': '#ffe4e6', 'rose-200': '#fecdd3', 'rose-300': '#fda4af', 'rose-400': '#fb7185', 'rose-500': '#f43f5e', 'rose-600': '#e11d48', 'rose-700': '#be123c', 'rose-800': '#9f1239', 'rose-900': '#881337', 'rose-950': '#4c051e',
  'red-50': '#fef2f2', 'red-100': '#fee2e2', 'red-200': '#fecaca', 'red-300': '#fca5a5', 'red-400': '#f87171', 'red-500': '#ef4444', 'red-600': '#dc2626', 'red-700': '#b91c1c', 'red-800': '#991b1b', 'red-900': '#7f1d1d', 'red-950': '#450a0a',
  'orange-50': '#fff7ed', 'orange-100': '#ffedd5', 'orange-200': '#fed7aa', 'orange-300': '#fdba74', 'orange-400': '#fb923c', 'orange-500': '#f97316', 'orange-600': '#ea580c', 'orange-700': '#c2410c', 'orange-800': '#9a3412', 'orange-900': '#7c2d12', 'orange-950': '#431407',
  'amber-50': '#fffbeb', 'amber-100': '#fef3c7', 'amber-200': '#fde68a', 'amber-300': '#fcd34d', 'amber-400': '#fbbf24', 'amber-500': '#f59e0b', 'amber-600': '#d97706', 'amber-700': '#b45309', 'amber-800': '#92400e', 'amber-900': '#78350f', 'amber-950': '#451a03',
  'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd', 'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'blue-700': '#1d4ed8', 'blue-800': '#1e40af', 'blue-900': '#1e3a8a', 'blue-950': '#172554',
};

function cleanCssOfUnsupportedColors(css: string): string {
  if (!css) return '';
  
  // 1. Map Tailwind v4 CSS variables
  let sanitized = css.replace(/--color-([a-z]+)-([0-9]+)\s*:\s*(?:oklch|oklab)\([^;\}]+\)/g, (match, color, shade) => {
    const key = `${color}-${shade}`;
    const hex = tailwindColors[key];
    return hex ? `--color-${color}-${shade}: ${hex}` : match;
  });

  // 2. Map standard tailwindColors keys explicitly to prevent variable resolver issues
  for (const [key, hex] of Object.entries(tailwindColors)) {
    const regex = new RegExp(`--color-${key}\\s*:\\s*(?:oklch|oklab|color-mix|light-dark)\\([^;\\}]+\\)`, 'g');
    sanitized = sanitized.replace(regex, `--color-${key}: ${hex}`);
  }

  // 3. Replace traditional oklch(...), oklab(...), color-mix(...), and light-dark(...) with static fallbacks
  // We'll replace them using a robust parser that handles nested parens
  const colorFunctions = ['oklch(', 'oklab(', 'color-mix(', 'light-dark('];
  for (const func of colorFunctions) {
    let index = sanitized.indexOf(func);
    while (index !== -1) {
      let depth = 1;
      let i = index + func.length;
      while (i < sanitized.length && depth > 0) {
        if (sanitized[i] === '(') depth++;
        else if (sanitized[i] === ')') depth--;
        i++;
      }
      if (depth === 0) {
        sanitized = sanitized.substring(0, index) + '#1a1a1a' + sanitized.substring(i);
      } else {
        break;
      }
      index = sanitized.indexOf(func);
    }
  }

  // 4. Remove any CSS declarations (property: value;) that still contain 'oklch', 'oklab', 'color-mix', or 'light-dark'
  // This is a safety fallback to completely clear out anything the parser missed
  sanitized = sanitized.replace(/[^:;{}]+:\s*[^;{}]+(?:oklch|oklab|color-mix|light-dark)[^;{}]*(?:;|$)/g, '');

  return sanitized;
}

const prepareSanitizedStyles = async () => {
  const nodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
  const sanitizedReplacements: (string | null)[] = new Array(nodes.length).fill(null);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    try {
      let cssText = '';
      if (node.tagName.toLowerCase() === 'style') {
        const styleEl = node as HTMLStyleElement;
        // Try getting rules first (handles CSSOM)
        if (styleEl.sheet) {
          try {
            const rules = styleEl.sheet.cssRules || styleEl.sheet.rules;
            if (rules && rules.length > 0) {
              cssText = Array.from(rules).map(rule => rule.cssText).join('\n');
            }
          } catch (e) {
            // CSSOM rule reading might throw security error for some external/cross-origin sheets loaded via style tags
          }
        }
        if (!cssText) {
          cssText = styleEl.textContent || '';
        }
      } else if (node.tagName.toLowerCase() === 'link') {
        const linkEl = node as HTMLLinkElement;
        if (linkEl.sheet) {
          try {
            const rules = linkEl.sheet.cssRules || linkEl.sheet.rules;
            if (rules && rules.length > 0) {
              cssText = Array.from(rules).map(rule => rule.cssText).join('\n');
            }
          } catch (e) {
            // ignore CORS errors
          }
        }
        if (!cssText && linkEl.href && linkEl.href.startsWith(window.location.origin)) {
          try {
            const res = await fetch(linkEl.href);
            if (res.ok) {
              cssText = await res.text();
            }
          } catch (e) {
            console.warn("Could not fetch href:", linkEl.href, e);
          }
        }
      }

      if (cssText) {
        let sanitized = cleanCssOfUnsupportedColors(cssText);
        sanitizedReplacements[i] = sanitized;
      }
    } catch (err) {
      console.warn("Error processing style node:", node, err);
    }
  }

  return sanitizedReplacements;
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
    return localStorage.getItem('ai_summary_selected_language') || 'my';
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [rawResult, setResult] = useState<AIResult | null>(null);
  const result = useMemo(() => {
    if (!rawResult) return null;
    
    const filteredTrades = trades.filter(t => selectedAccountIds.includes(t.account_id));
    const totalTradesCount = filteredTrades.length;
    
    if (totalTradesCount === 0) return rawResult;
    
    const winningTradesCount = filteredTrades.filter(t => (Number(t.pnl) || 0) > 0).length;
    const losingTradesCount = filteredTrades.filter(t => (Number(t.pnl) || 0) <= 0).length;
    const overallWinRate = totalTradesCount > 0 ? Math.round((winningTradesCount / totalTradesCount) * 100) : 0;
    const overallNetPnL = filteredTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    
    return {
      ...rawResult,
      totalTrades: totalTradesCount,
      winningTrades: winningTradesCount,
      losingTrades: losingTradesCount,
      winRate: overallWinRate,
      totalPnL: overallNetPnL,
    };
  }, [rawResult, trades, selectedAccountIds]);
  const [profileName, setProfileName] = useState('TRADER');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const hasAttemptedInitialLoad = useRef(false);

  // Simulated progress bar controller
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          // Decelerating growth: faster at first, then slows down
          const increment = (95 - prev) * 0.06;
          return parseFloat((prev + Math.max(0.4, increment)).toFixed(1));
        });
      }, 150);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const t = translations[selectedLanguage || 'my'];

  // Sync selections with localStorage (only after initial load has finished)
  useEffect(() => {
    if (loading) return;
    localStorage.setItem('ai_summary_selected_accounts', JSON.stringify(selectedAccountIds));
  }, [selectedAccountIds, loading]);

  useEffect(() => {
    if (loading || !selectedLanguage) return;
    localStorage.setItem('ai_summary_selected_language', selectedLanguage);
  }, [selectedLanguage, loading]);

  // Load initial accounts, trades and profile name
  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    const initializeData = async () => {
      try {
        setLoading(true);

        // Fetch user profile username (full_name) first and fallback gracefully
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (isSubscribed) {
          if (!profErr && prof && prof.full_name) {
            setProfileName(prof.full_name);
          } else {
            setProfileName(user.email?.split('@')[0] || 'TRADER');
          }
        }

        // Fetch accounts
        const { data: accts, error: acctsErr } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
        
        if (acctsErr) throw acctsErr;
        
        const fetchedAccounts = accts || [];
        if (isSubscribed) {
          setAccounts(fetchedAccounts);
        }

        // Fetch closed trades
        const { data: trds, error: trdsErr } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'CLOSED');

        if (trdsErr) throw trdsErr;
        if (isSubscribed) {
          setTrades(trds || []);
        }

        // Load saved selection if valid and matches loaded accounts
        let initialSelectedIds: string[] = [];
        const saved = localStorage.getItem('ai_summary_selected_accounts');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (fetchedAccounts.length > 0) {
                initialSelectedIds = parsed.filter(id => fetchedAccounts.some(a => a.id === id));
              } else {
                initialSelectedIds = parsed;
              }
            }
          } catch {
            // ignore
          }
        }

        if (isSubscribed && initialSelectedIds.length > 0) {
          setSelectedAccountIds(initialSelectedIds);
        }

        const initialLanguage = localStorage.getItem('ai_summary_selected_language') || 'my';
        if (isSubscribed) {
          setSelectedLanguage(initialLanguage);
        }

      } catch (err: any) {
        console.error("Error loading initial data:", err);
        toast.error(translations['my'].toastErrorLoading);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  const isValidAIResult = (parsed: any): parsed is AIResult => {
    return (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.traderLevel === 'string' &&
      typeof parsed.riskAnalysis === 'string' &&
      parsed.riskAnalysis.trim().length > 0 &&
      Array.isArray(parsed.riskActionsTodo) &&
      parsed.riskActionsTodo.length > 0
    );
  };

  // Cached AI Result loader & robust fallback selector
  useEffect(() => {
    if (loading || !user) return;

    let isSubscribed = true;

    const loadCacheOrFallback = async () => {
      // Setup keys
      const hasSelection = selectedAccountIds.length > 0 && selectedLanguage;
      const specificCacheKey = hasSelection 
        ? `ai_analysis_${user.id}_${[...selectedAccountIds].sort().join('_')}_${selectedLanguage}`
        : null;

      // Part A: If page has NOT initialized its cache yet, find the best available report to show the user
      if (!hasAttemptedInitialLoad.current) {
        let resultLoaded = false;

        // 1. Try specific selection cache from localStorage
        if (specificCacheKey) {
          const cached = localStorage.getItem(specificCacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (isValidAIResult(parsed)) {
                if (isSubscribed) {
                  setResult(parsed);
                  resultLoaded = true;
                }
              } else {
                localStorage.removeItem(specificCacheKey);
              }
            } catch (e) {
              localStorage.removeItem(specificCacheKey);
            }
          }
        }

        // 2. Try specific selection cache from Supabase database
        if (!resultLoaded && hasSelection && specificCacheKey) {
          try {
            const dateRangeKey = `ai_summary_${[...selectedAccountIds].sort().join('_')}_${selectedLanguage}`;
            const { data: dbData } = await supabase
              .from('news_analyses')
              .select('*')
              .eq('user_id', user.id)
              .eq('date_range', dateRangeKey)
              .order('created_at', { ascending: false })
              .limit(1);

            if (dbData && dbData.length > 0) {
              const parsed = dbData[0].analysis_json as any;
              if (isValidAIResult(parsed)) {
                if (isSubscribed) {
                  setResult(parsed);
                  resultLoaded = true;
                  localStorage.setItem(specificCacheKey, JSON.stringify(parsed));
                }
              }
            }
          } catch (dbErr) {
            console.error("Failed to query specific AI summary from Supabase:", dbErr);
          }
        }

        // 3. Fallback to the latest analysis from localStorage fallback
        if (!resultLoaded) {
          const fallbackKey = `ai_analysis_latest_${user.id}`;
          const fallbackCached = localStorage.getItem(fallbackKey);
          if (fallbackCached) {
            try {
              const parsed = JSON.parse(fallbackCached);
              if (isValidAIResult(parsed)) {
                if (isSubscribed) {
                  setResult(parsed);
                  resultLoaded = true;

                  // Restore selections to match the loaded fallback
                  if (parsed.selectedAccountIds && Array.isArray(parsed.selectedAccountIds) && parsed.selectedAccountIds.length > 0) {
                    const currentJoined = [...selectedAccountIds].sort().join('_');
                    const savedJoined = [...parsed.selectedAccountIds].sort().join('_');
                    
                    // Always cache the restored report under the target specific cache key so Part B finds it instantly
                    const targetSpecificKey = `ai_analysis_${user.id}_${savedJoined}_${parsed.selectedLanguage || selectedLanguage}`;
                    localStorage.setItem(targetSpecificKey, JSON.stringify(parsed));

                    if (currentJoined !== savedJoined) {
                      setSelectedAccountIds(parsed.selectedAccountIds);
                    }
                  }
                  if (parsed.selectedLanguage && selectedLanguage !== parsed.selectedLanguage) {
                    setSelectedLanguage(parsed.selectedLanguage);
                  }
                }
              }
            } catch (e) {
              // ignore
            }
          }
        }

        // 4. Fallback to latest analysis from Supabase database (across any accounts)
        if (!resultLoaded) {
          try {
            const { data: dbLatest } = await supabase
              .from('news_analyses')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (dbLatest && dbLatest.length > 0) {
              const parsed = dbLatest[0].analysis_json as any;
              if (isValidAIResult(parsed)) {
                if (isSubscribed) {
                  setResult(parsed);
                  resultLoaded = true;

                  const fallbackKey = `ai_analysis_latest_${user.id}`;
                  localStorage.setItem(fallbackKey, JSON.stringify(parsed));

                  if (parsed.selectedAccountIds && Array.isArray(parsed.selectedAccountIds) && parsed.selectedAccountIds.length > 0) {
                    const newCacheKey = `ai_analysis_${user.id}_${[...parsed.selectedAccountIds].sort().join('_')}_${parsed.selectedLanguage || selectedLanguage}`;
                    localStorage.setItem(newCacheKey, JSON.stringify(parsed));

                    const currentJoined = [...selectedAccountIds].sort().join('_');
                    const savedJoined = [...parsed.selectedAccountIds].sort().join('_');
                    if (currentJoined !== savedJoined) {
                      setSelectedAccountIds(parsed.selectedAccountIds);
                    }
                  }
                  if (parsed.selectedLanguage && selectedLanguage !== parsed.selectedLanguage) {
                    setSelectedLanguage(parsed.selectedLanguage);
                  }
                }
              }
            }
          } catch (dbErr) {
            console.error("Failed to query latest fallback AI summary from Supabase:", dbErr);
          }
        }

        // Complete initial cache load attempt
        if (isSubscribed) {
          hasAttemptedInitialLoad.current = true;
          if (!resultLoaded) {
            setResult(null);
          }
        }

      } else {
        // Part B: The user has already initialized the page and is now actively changing selections
        let matched = false;

        if (specificCacheKey) {
          const cached = localStorage.getItem(specificCacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (isValidAIResult(parsed)) {
                if (isSubscribed) {
                  setResult(parsed);
                  matched = true;
                }
              }
            } catch (e) {
              // ignore
            }
          }

          if (!matched) {
            // Check DB for this specific selection
            try {
              const dateRangeKey = `ai_summary_${[...selectedAccountIds].sort().join('_')}_${selectedLanguage}`;
              const { data: dbData } = await supabase
                .from('news_analyses')
                .select('*')
                .eq('user_id', user.id)
                .eq('date_range', dateRangeKey)
                .order('created_at', { ascending: false })
                .limit(1);

              if (dbData && dbData.length > 0) {
                const parsed = dbData[0].analysis_json as any;
                if (isValidAIResult(parsed)) {
                  if (isSubscribed) {
                    setResult(parsed);
                    matched = true;
                    localStorage.setItem(specificCacheKey, JSON.stringify(parsed));
                  }
                }
              }
            } catch (err) {
              console.error("Error loading specific cache from DB:", err);
            }
          }
        }

        if (isSubscribed && !matched) {
          setResult(null);
        }
      }
    };

    loadCacheOrFallback();

    return () => {
      isSubscribed = false;
    };
  }, [selectedAccountIds, selectedLanguage, loading, user]);

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
          language: selectedLanguage,
          profileName: profileName
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMessage = errData.error;
          } else if (errData && errData.message) {
            errorMessage = errData.message;
          }
        } catch (e) {
          try {
            const rawText = await response.text();
            if (rawText && rawText.trim().length > 0 && rawText.length < 300) {
              errorMessage = `${errorMessage}: ${rawText.trim()}`;
            }
          } catch (textErr) {
            // retain standard message
          }
        }
        throw new Error(errorMessage);
      }

      const data: AIResult = await response.json();
      
      // Inject metadata to support accurate fallback loading
      const dataWithMetadata = {
        ...data,
        selectedAccountIds,
        selectedLanguage
      };
      
      // Save result to cache
      const cacheKey = `ai_analysis_${user.id}_${[...selectedAccountIds].sort().join('_')}_${selectedLanguage}`;
      localStorage.setItem(cacheKey, JSON.stringify(dataWithMetadata));

      // Also save to global latest fallback cache
      const fallbackKey = `ai_analysis_latest_${user.id}`;
      localStorage.setItem(fallbackKey, JSON.stringify(dataWithMetadata));

      // Save to Supabase news_analyses table for cloud persistent database storage
      try {
        const dateRangeKey = `ai_summary_${[...selectedAccountIds].sort().join('_')}_${selectedLanguage}`;
        await supabase.from('news_analyses').insert([{
          user_id: user.id,
          date_range: dateRangeKey,
          analysis_json: dataWithMetadata,
          summary_text: data.overview || ''
        }]);
      } catch (dbErr) {
        console.error("Failed to save AI summary to Supabase database:", dbErr);
      }

      setProgress(100);
      toast.success(t.toastSuccessAnalysis, { id: toastId });
      
      setTimeout(() => {
        setResult(dataWithMetadata);
        setAnalyzing(false);
      }, 800);
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      toast.error(error.message || t.toastErrorAnalyzing, { id: toastId });
      setAnalyzing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result || !reportRef.current) return;
    setDownloading(true);
    const toastId = toast.loading(t.downloadingReport || "Generating PDF report...");

    let tempStyleEl: HTMLStyleElement | null = null;
    let clonedContainer: HTMLDivElement | null = null;

    try {
      // 1. Prepare and apply sanitized styles to the document head temporarily
      const sanitizedStyles = await prepareSanitizedStyles();
      tempStyleEl = document.createElement('style');
      tempStyleEl.id = 'pdf-temp-sanitized-styles';
      tempStyleEl.textContent = sanitizedStyles.filter(Boolean).join('\n');
      document.head.appendChild(tempStyleEl);

      // 2. Clone the report container and force consistent desktop layout for premium formatting
      const originalElement = reportRef.current;
      clonedContainer = document.createElement('div');
      clonedContainer.id = 'pdf-cloned-container';
      clonedContainer.innerHTML = originalElement.innerHTML;
      
      // Style the offscreen container to render as desktop width (1024px)
      clonedContainer.style.width = '1024px';
      clonedContainer.style.position = 'fixed';
      clonedContainer.style.left = '-9999px';
      clonedContainer.style.top = '0';
      clonedContainer.style.padding = '24px';
      clonedContainer.style.backgroundColor = '#0a0a0a';
      clonedContainer.style.boxSizing = 'border-box';
      clonedContainer.style.display = 'flex';
      clonedContainer.style.flexDirection = 'column';
      clonedContainer.style.gap = '24px'; // Matches 'space-y-6'
      
      document.body.appendChild(clonedContainer);

      // 3. Extract all direct child card/section elements from the cloned container
      const children = Array.from(clonedContainer.children) as HTMLElement[];

      // 4. Initialize jsPDF (A4 is 210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const marginX = 12;
      const marginY = 12;
      const imgWidth = 210 - (marginX * 2); // 186mm width
      const pageHeight = 297;
      const maxContentHeight = pageHeight - marginY; // 285mm
      const cardGap = 5; // 5mm spacing between elements on the PDF page

      let currentY = marginY;
      let isFirstPage = true;

      // Helper function to paint dark theme background on a PDF page
      const paintDarkBackground = (doc: jsPDF) => {
        doc.setFillColor(10, 10, 10); // #0a0a0a
        doc.rect(0, 0, 210, 297, 'F');
      };

      // Paint dark theme background for the very first page
      paintDarkBackground(pdf);

      // 5. Render each child block using html2canvas and append intelligently
      for (const child of children) {
        if (!child || child.offsetHeight === 0) continue;

        // Strip unsupported color formats inside the cloned child elements
        const allSubElements = child.getElementsByTagName('*');
        for (let i = 0; i < allSubElements.length; i++) {
          const el = allSubElements[i] as HTMLElement;
          const styleAttr = el.getAttribute('style');
          if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix') || styleAttr.includes('light-dark'))) {
            el.setAttribute('style', cleanCssOfUnsupportedColors(styleAttr));
          }
          const fillAttr = el.getAttribute('fill');
          if (fillAttr && (fillAttr.includes('oklch') || fillAttr.includes('oklab') || fillAttr.includes('color-mix') || fillAttr.includes('light-dark'))) {
            el.setAttribute('fill', '#1a1a1a');
          }
          const strokeAttr = el.getAttribute('stroke');
          if (strokeAttr && (strokeAttr.includes('oklch') || strokeAttr.includes('oklab') || strokeAttr.includes('color-mix') || strokeAttr.includes('light-dark'))) {
            el.setAttribute('stroke', '#1a1a1a');
          }
        }

        // Render the single card/block to a high-resolution canvas (scale 2.0 for crisp text/borders)
        const canvas = await html2canvas(child, {
          scale: 2.0,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#141414', // Default dark card color
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // If this element exceeds the remaining height on the current page, start a fresh page
        if (currentY + imgHeight > maxContentHeight && !isFirstPage) {
          pdf.addPage();
          paintDarkBackground(pdf);
          currentY = marginY;
        }

        // Add the image to the current PDF page
        pdf.addImage(imgData, 'PNG', marginX, currentY, imgWidth, imgHeight, undefined, 'FAST');
        currentY += imgHeight + cardGap;
        isFirstPage = false;
      }

      // 6. Filename: account_name + Date_Timestamp
      const selectedAccounts = accounts.filter(a => selectedAccountIds.includes(a.id));
      const accountName = selectedAccounts.length > 0 
        ? selectedAccounts.map(a => a.name.trim().replace(/[^a-zA-Z0-9_-]/g, '_')).join('_')
        : 'Accounts';
      
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
      const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const timestamp = `${dateStr}_${timeStr}`;
      
      const filename = `${accountName}_${timestamp}.pdf`;
      
      pdf.save(filename);
      toast.success(t.downloadSuccess || "PDF Report downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Failed to generate PDF download.", { id: toastId });
    } finally {
      // Clean up temporary elements and restore styles
      if (tempStyleEl) {
        tempStyleEl.remove();
      }
      if (clonedContainer) {
        clonedContainer.remove();
      }
      setDownloading(false);
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

          <div className="flex items-center gap-3">
            {result && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white border border-orange-700/50 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  <FileDown className="w-4 h-4" />
                  {t.downloadReport}
                </motion.button>

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
              </>
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
                    <p className="text-neutral-400 max-w-sm mx-auto text-sm leading-relaxed">
                      {t.analyzingDesc}
                    </p>
                  </div>
                  <div className="space-y-4 w-full max-w-[280px] flex flex-col items-center">
                    <div className="w-full bg-[#1b1b1b] h-2 rounded-full overflow-hidden p-[1px] border border-[#2d2d2d] relative shadow-inner">
                      <motion.div 
                        className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 h-full rounded-full relative"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 40, damping: 12 }}
                      >
                        {/* Shimmer laser effect */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ['-100%', '100%'],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            ease: 'linear',
                          }}
                        />
                      </motion.div>
                    </div>
                    <div className="text-[11px] font-bold text-orange-400 tracking-widest uppercase flex items-center gap-1">
                      <span>Analyzing Data</span>
                      <span className="w-12 text-right">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  ref={reportRef}
                  data-pdf-content="true"
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

                  {/* Trading Edge Performance Indicator */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Has Edge Card */}
                    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
                      <div className="space-y-1.5 z-10">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.hasEdgeLabel}</span>
                        <div className="flex items-center gap-2.5">
                          {result.hasTradingEdge ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xl font-extrabold text-emerald-400 uppercase tracking-tight">{t.hasEdgeYes}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                              <span className="text-xl font-extrabold text-rose-400 uppercase tracking-tight">{t.hasEdgeNo}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-medium">
                          {result.hasTradingEdge 
                            ? (selectedLanguage === 'my' ? "စာရင်းဇယားအရ ဈေးကွက်ထက် သာလွန်သော အားသာချက်ရှိသည်" : "Statistical data confirms positive market expectancy")
                            : (selectedLanguage === 'my' ? "စာရင်းဇယားအရ ဈေးကွက်ထက် သာလွန်သော အားသာချက် မတွေ့ရှိသေးပါ" : "No distinct positive expectancy identified in this period")
                          }
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-[#1b1b1b] border border-[#2d2d2d] rounded-xl flex items-center justify-center">
                        {result.hasTradingEdge ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-rose-500" />
                        )}
                      </div>
                    </div>

                    {/* Edge Score Card */}
                    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 flex flex-col justify-between space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.tradingEdgeScoreLabel}</span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                          result.tradingEdgePercentage >= 76 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                          result.tradingEdgePercentage >= 51 ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                          result.tradingEdgePercentage >= 36 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                          "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        )}>
                          {result.tradingEdgePercentage >= 76 ? (selectedLanguage === 'my' ? "အလွန်ကောင်းမွန်" : "Outstanding") :
                           result.tradingEdgePercentage >= 51 ? (selectedLanguage === 'my' ? "အားကောင်းသော" : "Strong") :
                           result.tradingEdgePercentage >= 36 ? (selectedLanguage === 'my' ? "အသင့်အတင့်" : "Incipient") :
                           (selectedLanguage === 'my' ? "မရှိသေးပါ" : "No Edge")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-black text-white tracking-tight leading-none">
                          {result.tradingEdgePercentage || 0}%
                        </span>
                        <div className="flex-1 bg-[#1a1a1a] h-2.5 rounded-full overflow-hidden p-[1px] border border-[#2a2a2a] relative">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              result.tradingEdgePercentage >= 76 ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                              result.tradingEdgePercentage >= 51 ? "bg-gradient-to-r from-cyan-500 to-blue-500" :
                              result.tradingEdgePercentage >= 36 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                              "bg-gradient-to-r from-rose-500 to-red-500"
                            )}
                            style={{ width: `${result.tradingEdgePercentage || 0}%` }}
                          />
                        </div>
                      </div>
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
                        <p className="text-sm text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap">
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
                            {selectedLanguage === 'my' ? "Unsuitable Time (မသင့်တော်သောအချိန်)" : "Unsuitable Time (Worst Trading Time)"}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap">
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
                      <p className="text-sm text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap">
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
                           <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300 leading-relaxed font-medium">
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
                          <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300 leading-relaxed font-medium">
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
                    <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                      {result.tradingEdge}
                    </p>
                  </div>

                  {/* Trading Edge Improvement Actions (Do's & Don'ts) */}
                  <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-6">
                    <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                      <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/15">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        {t.edgeImprovementTitle}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Do's (ဆောင်ရန်များ) */}
                      <div className="bg-[#101914] border border-emerald-950/40 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-emerald-950/30 pb-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
                            {t.edgeDoLabel}
                          </h4>
                        </div>
                        <ul className="space-y-3">
                          {(result.edgeActionsTodo || []).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200 leading-relaxed font-medium">
                              <span className="text-emerald-400 font-bold block mt-0.5">•</span>
                              <span className="flex-1">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Don'ts / Avoids (ရှောင်ရန်များ) */}
                      <div className="bg-[#1c1214] border border-rose-950/40 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-rose-950/30 pb-2.5">
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-widest">
                            {t.edgeAvoidLabel}
                          </h4>
                        </div>
                        <ul className="space-y-3">
                          {(result.edgeActionsAvoid || []).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200 leading-relaxed font-medium">
                              <span className="text-rose-400 font-bold block mt-0.5">•</span>
                              <span className="flex-1">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Trader Psychology Analysis Block */}
                  <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-5">
                    <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                      <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/10">
                        <Brain className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        {t.psychologyTitle}
                      </h3>
                    </div>
                    <div className="p-5 bg-[#0b0c10] border border-[#1a1b22] rounded-2xl relative overflow-hidden">
                      <div className="absolute right-4 top-4 opacity-[0.02]">
                        <Brain className="w-36 h-36 text-indigo-400" />
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap relative z-10">
                        {result.psychologyAnalysis}
                      </p>
                    </div>
                  </div>

                  {/* Risk Management Analysis Block */}
                  <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 space-y-6">
                    <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
                      <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/15">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        {t.riskTitle}
                      </h3>
                    </div>

                    {/* Detailed Analysis Paragraph */}
                    <div className="p-5 bg-[#0b0c10] border border-[#1a1b22] rounded-2xl relative overflow-hidden">
                      <p className="text-sm text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap relative z-10">
                        {result.riskAnalysis}
                      </p>
                    </div>

                    {/* Do's & Don'ts grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Risk Do's */}
                      <div className="bg-[#101914] border border-emerald-950/40 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-emerald-950/30 pb-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
                            {t.riskDoLabel}
                          </h4>
                        </div>
                        <ul className="space-y-3">
                          {(result.riskActionsTodo || []).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200 leading-relaxed font-medium">
                              <span className="text-emerald-400 font-bold block mt-0.5">•</span>
                              <span className="flex-1">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Risk Don'ts / Avoids */}
                      <div className="bg-[#1c1214] border border-rose-950/40 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-rose-950/30 pb-2.5">
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-widest">
                            {t.riskAvoidLabel}
                          </h4>
                        </div>
                        <ul className="space-y-3">
                          {(result.riskActionsAvoid || []).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200 leading-relaxed font-medium">
                              <span className="text-rose-400 font-bold block mt-0.5">•</span>
                              <span className="flex-1">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
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
                          <p className="text-sm text-neutral-300 leading-relaxed font-medium flex-1 m-0">{rec}</p>
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
                      <p className="text-sm text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap">
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
                    <p className="text-neutral-500 max-w-sm mx-auto text-sm leading-relaxed">
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
