import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Resource } from '../types';
import { 
  BookOpen, 
  Video, 
  FileText, 
  ExternalLink, 
  Search,
  PlayCircle,
  ChevronDown,
  Clock,
  Sparkles,
  Award,
  TrendingUp,
  Coins,
  Globe,
  Languages,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal } from '../components/ScrollReveal';
import PDFLibrary from '../components/PDFLibrary';
import ICTNotes from '../components/ICTNotes';

const VIP1_VIDEOS = [
  { id: '1', title: 'VIP-1 Course: Lesson 1', url: 'https://youtu.be/c2AH-wDneIU', description: 'Introduction to the VIP-1 curriculum.' },
  { id: '2', title: 'VIP-1 Course: Lesson 2', url: 'https://youtu.be/BtBA8djwjW4', description: 'Core concepts and fundamental principles.' },
  { id: '3', title: 'VIP-1 Course: Lesson 3', url: 'https://youtu.be/IEoSsxSO4pU', description: 'Advanced market analysis techniques.' },
  { id: '4', title: 'VIP-1 Course: Lesson 4', url: 'https://youtu.be/ffbUxv22580', description: 'Strategy implementation and execution.' },
  { id: '5', title: 'VIP-1 Course: Lesson 5', url: 'https://youtu.be/kWm8npzOIDI', description: 'Risk management and trade protection.' },
  { id: '6', title: 'VIP-1 Course: Lesson 6', url: 'https://youtu.be/eYZrJF2WQN0', description: 'Trading psychology and mindset development.' },
  { id: '7', title: 'VIP-1 Course: Lesson 7', url: 'https://youtu.be/A-M-Q21Ko6Y', description: 'Live market review and setup analysis.' },
  { id: '8', title: 'VIP-1 Course: Lesson 8', url: 'https://youtu.be/qApErJM78WI', description: 'Interactive Q&A and trade breakdowns.' },
  { id: '9', title: 'VIP-1 Course: Lesson 9', url: 'https://youtu.be/p1Hwn8DqWFo', description: 'Case study: Detailed winning trade analysis.' },
  { id: '10', title: 'VIP-1 Course: Lesson 10', url: 'https://youtu.be/a917QVeCWqs', description: 'Case study: Lessons from losing trades.' },
  { id: '11', title: 'VIP-1 Course: Lesson 11', url: 'https://youtu.be/AG-bofmyrEI', description: 'Final review and key takeaways.' },
  { id: '12', title: 'VIP-1 Course: Lesson 12', url: 'https://youtu.be/BvJR194OFF4', description: 'Preparation for advanced mentorship.' },
];

const CRYPTO_INTRO_VIDEOS = [
  { id: 'c1', title: 'Introduction to Crypto: Part 1', url: 'https://youtu.be/R4VLdcW3xvA', description: 'Getting started with digital assets.' },
  { id: 'c2', title: 'Introduction to Crypto: Part 2', url: 'https://youtu.be/aAnL4V93xdw', description: 'Understanding blockchain technology.' },
  { id: 'c3', title: 'Introduction to Crypto: Part 3', url: 'https://youtu.be/5J8QmFJhCyo', description: 'Security and wallet management.' },
  { id: 'c4', title: 'Introduction to Crypto: Part 4', url: 'https://youtu.be/VoH00WdOp-A', description: 'Trading and exchange basics.' },
];

const FUNDAMENTAL_VIDEOS = [
  { id: 'f1', title: 'Fundamental Analysis: Part 1', url: 'https://youtu.be/-KPz3c1jNnk', description: 'Economic indicators and market drivers.' },
  { id: 'f2', title: 'Fundamental Analysis: Part 2', url: 'https://youtu.be/7RfEx0ekCv4', description: 'Central bank policies and interest rates.' },
  { id: 'f3', title: 'Fundamental Analysis: Part 3', url: 'https://youtu.be/qBzeWpXt2Tk', description: 'Sentiment and news trading.' },
  { id: 'f4', title: 'Fundamental Analysis: Part 4', url: 'https://youtu.be/nmisRz_d6wI', description: 'Advanced fundamental strategies.' },
];

const DAY_TRADING_VIDEOS = [
  { id: 'dt1', title: 'Day Trading Strategy: Lesson 1', url: 'https://youtu.be/epLSYI_EpQg', description: 'Market structure and daily bias.' },
  { id: 'dt2', title: 'Day Trading Strategy: Lesson 2', url: 'https://youtu.be/_589blMVU3U', description: 'Entry models and execution.' },
  { id: 'dt3', title: 'Day Trading Strategy: Lesson 3', url: 'https://youtu.be/xGZHHEqDmRg', description: 'Session timing and liquidity.' },
  { id: 'dt4', title: 'Day Trading Strategy: Lesson 4', url: 'https://youtu.be/qINC6yZzoKI', description: 'Risk management for day traders.' },
  { id: 'dt5', title: 'Day Trading Strategy: Lesson 5', url: 'https://youtu.be/k-EtOqE4FM8', description: 'Volume profile and key levels.' },
  { id: 'dt6', title: 'Day Trading Strategy: Lesson 6', url: 'https://youtu.be/PcXM3qX1cZs', description: 'Price action patterns.' },
  { id: 'dt7', title: 'Day Trading Strategy: Lesson 7', url: 'https://youtu.be/_cMjV6oMVYE', description: 'Daily routine and preparation.' },
  { id: 'dtp1', title: 'Practical Series: Part 1', url: 'https://youtu.be/nw38WdMOD7s', description: 'Live trade application.' },
  { id: 'dtp2', title: 'Practical Series: Part 2', url: 'https://youtu.be/rXIKDBF8PmM', description: 'Advanced practical breakdown.' },
  { id: 'dtp3', title: 'Practical Series: Part 3', url: 'https://youtu.be/4zDRt5MyFu4', description: 'Final practical summary.' },
];

const VIP2_VIDEOS = [
  { id: 'v2ta1', title: 'TA Foundation: Lesson 1', url: 'https://youtu.be/YUtdtqlAbQw', description: 'Advanced support and resistance.' },
  { id: 'v2ta2', title: 'TA Foundation: Lesson 2', url: 'https://youtu.be/ImOsgtDlfJ0', description: 'Fibonacci mastery.' },
  { id: 'v2ta3', title: 'TA Foundation: Lesson 3', url: 'https://youtu.be/_6q7wfOtZ00', description: 'Harmonic patterns.' },
  { id: 'v2ta4', title: 'TA Foundation: Lesson 4', url: 'https://youtu.be/GK4oewjdj9w', description: 'Multi-timeframe confluence.' },
  { id: 'v2ta5', title: 'TA Foundation: Lesson 5', url: 'https://youtu.be/TgwbECBYGG8', description: 'Indicator synergy.' },
  { id: 'v2ta6', title: 'TA Foundation: Lesson 6', url: 'https://youtu.be/UUzO0vULUGU', description: 'Liquidity zones.' },
  { id: 'v2ta7', title: 'TA Foundation: Lesson 7', url: 'https://youtu.be/nQVk8CYXVtg', description: 'Order flow basics.' },
  { id: 'v2ta8', title: 'TA Foundation: Lesson 8', url: 'https://youtu.be/h8fVoaNDueA', description: 'Divergence trading.' },
  { id: 'v2ta9', title: 'TA Foundation: Lesson 9', url: 'https://youtu.be/UYRZGN9bpWI', description: 'Trend exhaustion.' },
  { id: 'v2ta10', title: 'TA Foundation: Lesson 10', url: 'https://youtu.be/860yP2zxDs0', description: 'Volatility analysis.' },
  { id: 'v2ta11', title: 'TA Foundation: Lesson 11', url: 'https://youtu.be/QCGK7Unztp8', description: 'TA summary.' },
  { id: 'v2f1', title: 'Fundamental Foundation: Lesson 1', url: 'https://youtu.be/dmIattB-rSs', description: 'Macro economics.' },
  { id: 'v2f2', title: 'Fundamental Foundation: Lesson 2', url: 'https://youtu.be/TjEAn3P1dIQ', description: 'Interest rate cycles.' },
  { id: 'v2f3', title: 'Fundamental Foundation: Lesson 3', url: 'https://youtu.be/2WJZHpUNgXQ', description: 'Inflation and assets.' },
  { id: 'v2f4', title: 'Fundamental Foundation: Lesson 4', url: 'https://youtu.be/F-9m2h4yTQw', description: 'Geopolitics and trading.' },
  { id: 'v2f5', title: 'Fundamental Foundation: Lesson 5', url: 'https://youtu.be/XmV5Tl6Azjk', description: 'Fundamental summary.' },
  { id: 'v2dt1', title: 'Day Trading 2024: Lesson 1', url: 'https://youtu.be/DZwl5hn6hZw', description: 'New strategies for 2024.' },
  { id: 'v2dt2', title: 'Day Trading 2024: Lesson 2', url: 'https://youtu.be/4xLpR66Y2BI', description: 'Execution pro techniques.' },
  { id: 'v2dt3', title: 'Day Trading 2024: Lesson 3', url: 'https://youtu.be/Jx0pcuB-nI8', description: 'Risk mastery.' },
  { id: 'v2dt4', title: 'Day Trading 2024: Lesson 4', url: 'https://youtu.be/dkUH2yGOluY', description: 'Psychology edge.' },
  { id: 'v2dt5', title: 'Day Trading 2024: Lesson 5', url: 'https://youtu.be/X-Sbwqb5xRE', description: '2024 course summary.' },
];

const THAI_LANGUAGE_VIDEOS = [
  { id: 'th1', title: 'သင်ခန်းစာ ၁ ဝေါဟာရ များ', url: 'https://youtu.be/oGMaZ527OZ0', description: 'နိဒါန်းနှင့် အခြေခံ ဝေါဟာရများ' },
  { id: 'th2', title: 'သင်ခန်းစာ ၂ ကြိယာ အချင်းချင်း ပေါင်းစပ်ခြင်း', url: 'https://youtu.be/_1O8ri69z0w', description: 'ကြိယာများ အသုံးပြုပုံနှင့် ပေါင်းစပ်ပုံ' },
  { id: 'th3', title: 'သင်ခန်းစာ ၃ နာမ်စား အခေါ်အဝေါ် များ', url: 'https://youtu.be/L7Le0AYVLOs', description: 'နာမ်စားများနှင့် အခေါ်အဝေါ်များ' },
  { id: 'th4', title: 'သင်ခန်းစာ ၄ မိသားစု အခေါ်အဝေါ်များ', url: 'https://youtu.be/1fLxa7y4keI', description: 'မိသားစုဝင်များ အခေါ်အဝေါ်များ' },
  { id: 'th5', title: 'သင်ခန်းစာ ၅ အခြေခံ ဝါကျ တည်ဆောက်ပုံ', url: 'https://youtu.be/db6XUxOG3Gw', description: 'အခြေခံ ဝါကျ တည်ဆောက်ပုံများ' },
  { id: 'th6', title: 'သင်ခန်းစာ ၆ အကူကြိယာနှင့် ဝါကျ တည်ဆောက်နည်း', url: 'https://youtu.be/QClgTMabo_c', description: 'အကူကြိယာများ အသုံးပြု၍ ဝါကျ တည်ဆောက်ပုံ' },
  { id: 'th7', title: 'သင်ခန်းစာ ၇ အငြင်းစကားလုံးနှင့် အကူကြိယာ ပေါင်းစပ်ခြင်း', url: 'https://youtu.be/4_dizmZO0TM', description: 'အငြင်းစကားလုံးများနှင့် အကူကြိယာများ ပေါင်းစပ်အသုံးပြုပုံ' },
  { id: 'th8', title: 'သင်ခန်းစာ ၈ တားမြစ်စကားလုံးနှင့် အငြင်း စကားလုံးများ', url: 'https://youtu.be/Wu28U7cvXwo', description: 'ตားမြစ်စကားလုံးများနှင့် အငြင်းစကားလုံးများ' },
  { id: 'th9', title: 'သင်ခန်းစာ ၉ စကားစပ်များ', url: 'https://youtu.be/mZnaLlm3Ug4', description: 'စကားစပ်များ အသုံးပြုပုံ' },
  { id: 'th10', title: 'သင်ခန်းစာ ၁၀ ရက်လနှစ် အခေါ်အဝေါ် များ', url: 'https://youtu.be/0xgVTCVtkn8', description: 'ရက်၊ လ၊ နှစ် အခေါ်အဝေါ်များ' },
  { id: 'th11', title: 'သင်ခန်းစာ ၁၁ ဒေသ အခေါ်အဝေါ် များ', url: 'https://youtu.be/qXjtZ3Uu8AM', description: 'Thai language learning series.' },
  { id: 'th12', title: 'သင်ခန်းစာ ၁၂ အချိန်နှင့် ဝါကျ တည်ဆောက်နည်း', url: 'https://youtu.be/umcATvtbfN8', description: 'Thai language learning series.' },
  { id: 'th13', title: 'သင်ခန်းစာ ၁၃ စကားဆက်နှင့် ဝါကျ တည်ဆောက်နည်း', url: 'https://youtu.be/gpnPZTV1IjY', description: 'Thai language learning series.' },
  { id: 'th14', title: 'သင်ခန်းစာ ၁၄ နေ့စဉ်သုံး စကားစုများ', url: 'https://youtu.be/Ct2UHkW4Ii4', description: 'Thai language learning series.' },
  { id: 'th15', title: 'သင်ခန်းစာ ၁၅ အမေး စကားလုံးများ', url: 'https://youtu.be/jmbvD-jAtRY', description: 'Thai language learning series.' },
  { id: 'th16', title: 'သင်ခန်းစာ ၁၆ စျေးဝယ်ခြင်း ၁', url: 'https://youtu.be/eCWHn4Dvpwk', description: 'Thai language learning series.' },
  { id: 'th17', title: 'သင်ခန်းစာ ၁၇ စျေးဝယ်ခြင်း ၂', url: 'https://youtu.be/kdQljttaPEw', description: 'Thai language learning series.' },
  { id: 'th18', title: 'သင်ခန်းစာ ၁၈ အပြုအမူ နှင့် ဝါကျ တည်ဆောက်ပုံ ၁', url: 'https://youtu.be/S5sUkZKarZQ', description: 'Thai language learning series.' },
  { id: 'th19', title: 'သင်ခန်းစာ ၁၉ အပြုအမူ နှင့် ဝါကျ တည်ဆောက်ပုံ ၂', url: 'https://youtu.be/8kO3l2BOzBQ', description: 'Thai language learning series.' },
  { id: 'th20', title: 'သင်ခန်းစာ ၂၀ မိမိ ကိုယ်ကို မိတ်ဆက်ခြင်း', url: 'https://youtu.be/alsEaKChXtU', description: 'Thai language learning series.' },
  { id: 'th21', title: 'သင်ခန်းစာ ၂၁ အပြန် အလှန် မိတ်ဆက်ခြင်း', url: 'https://youtu.be/ArHdi3t4SdI', description: 'Thai language learning series.' },
  { id: 'th22', title: 'သင်ခန်းစာ ၂၂ အခန်းငှားခြင်း', url: 'https://youtu.be/FeYMibLr32Y', description: 'Thai language learning series.' },
  { id: 'th23', title: 'သင်ခန်းစာ ၂၃ လုပ်ငန်းခွင်သုံး စကားပြော', url: 'https://youtu.be/8jzrgaXgcvQ', description: 'Thai language learning series.' },
  { id: 'th24', title: 'သင်ခန်းစာ ၂၄ ခရီးသွား လမ်းညွှန်', url: 'https://youtu.be/mgAY587e4Bc', description: 'Thai language learning series.' },
  { id: 'th25', title: 'သင်ခန်းစာ ၂၅ ရက်လ မေးမြန်းခြင်း', url: 'https://youtu.be/e8XmnlCKkBY', description: 'Thai language learning series.' },
  { id: 'th26', title: 'သင်ခန်းစာ ၂၆ အချိန် မေးမြန်းခြင်း', url: 'https://youtu.be/_0jCwZWZrrE', description: 'Thai language learning series.' },
  { id: 'th27', title: 'သင်ခန်းစာ ၂၇ ကိန်းဂဏန်း အခေါ်အဝေါ်', url: 'https://youtu.be/14OXAZBgv-U', description: 'Thai language learning series.' },
  { id: 'th28', title: 'သင်ခန်းစာ ၂၈ အရောင်နှင့် နှိုင်ယှဉ်မှု', url: 'https://youtu.be/OPiyfEjsKRU', description: 'Thai language learning series.' },
  { id: 'th29', title: 'သင်ခန်းစာ ၂၉ အလုပ်အကိုင် အခေါ်အဝေါ်များ', url: 'https://youtu.be/PQXY-tWzZI0', description: 'Thai language learning series.' },
  { id: 'th30', title: 'သင်ခန်းစာ ၃၀ နေရာ ဝိဘတ်နှင့် ကြိယာ ဝိသေသန', url: 'https://youtube.com/shorts/Zm2Cp93N7do', description: 'Thai language learning series.' },
  { id: 'th31', title: 'သင်ခန်းစာ ၃၁ အကူကြိယာ ဖြည့်စွက်', url: 'https://youtu.be/VcCuRXZD-iI', description: 'Thai language learning series.' },
  { id: 'th32', title: 'သင်ခန်းစာ ၃၂ ဝိဘတ် အညွှန်း အသုံးပြုပုံ', url: 'https://youtu.be/l6lJ5EeCyAY', description: 'Thai language learning series.' },
  { id: 'th33', title: 'သင်ခန်းစာ ၃၃ ဝိဘတ် အသုံးပြုပုံ', url: 'https://youtu.be/nMVmCUzuK-I', description: 'Thai language learning series.' },
  { id: 'th34', title: 'သင်ခန်းစာ ၃၄ အခန်းငှားခြင်း ဖြည့်စွက်', url: 'https://youtu.be/iEiZHW3SPrA', description: 'Thai language learning series.' },
  { id: 'th35', title: 'သင်ခန်းစာ ၃၅ စားသောက်ဆိုင်သုံး စကားပြော', url: 'https://youtu.be/QGIlOtUKvPo', description: 'Thai language learning series.' },
  { id: 'th36', title: 'သင်ခန်းစာ ၃၆ အချိန်နှင့် ဝါကျ တည်ဆောက်နည်း ဖြည့်စွက်', url: 'https://youtu.be/TxNLk9PIF8U', description: 'Thai language learning series.' },
  { id: 'th37', title: 'သင်ခန်းစာ ၃၇ လမ်းညွှန်နည်းများ', url: 'https://youtu.be/5AATT_Hu1BA', description: 'Thai language learning series.' },
  { id: 'th38', title: 'သင်ခန်းစာ ၃၈ အမေးစကားပြော', url: 'https://youtu.be/5oQQDKQ04dA', description: 'Thai language learning series.' },
];

const FUTURE_MENTORSHIP_VIDEOS = [
  { id: 'fm1', title: '15 Feb 2026', url: 'https://youtu.be/odwT5WJlAjA', description: '2026 Future Mentorship Course session recorded on Feb 15.' },
  { id: 'fm2', title: '16 FEB 2026', url: 'https://youtu.be/TClbTF6NB1Y', description: '2026 Future Mentorship Course session recorded on Feb 16.' },
  { id: 'fm3', title: '17 FEB 2026', url: 'https://youtu.be/mWl13hYFwmE', description: '2026 Future Mentorship Course session recorded on Feb 17.' },
  { id: 'fm4', title: '19 FEB 2026 - Part 1', url: 'https://youtu.be/usH3G1F9lm4', description: '2026 Future Mentorship Course session - Part 1.' },
  { id: 'fm5', title: '19 FEB 2026 - Part 2', url: 'https://youtu.be/ETzof8nXVkk', description: '2026 Future Mentorship Course session - Part 2.' },
  { id: 'fm6', title: '20 FEB 2026', url: 'https://youtu.be/MytrXa5rg_4', description: '2026 Future Mentorship Course session recorded on Feb 20.' },
  { id: 'fm7', title: '3rd Week February Weekly Review - 2026', url: 'https://youtu.be/nnAeG-5Epl0', description: 'Market review of the third week of February 2026.' },
  { id: 'fm8', title: '26 FEB 2026 - Trade Recap and Housekeeping about Gaps grading levels', url: 'https://youtu.be/1qnO4n3Ngec', description: 'Trade recap and comprehensive analysis of Gaps grading levels.' },
  { id: 'fm9', title: '1 March 2026', url: 'https://youtu.be/K_gdLpDaVpI', description: '2026 Future Mentorship Course session recorded on March 1.' },
  { id: 'fm10', title: '6 March 2026', url: 'https://youtu.be/b6ccWeY3AyQ', description: '2026 Future Mentorship Course session recorded on March 6.' },
  { id: 'fm11', title: '11 March 2026', url: 'https://youtu.be/-1NofFZUwBc', description: '2026 Future Mentorship Course session recorded on March 11.' },
  { id: 'fm12', title: '14 March 2026 Weekly Market Review', url: 'https://youtu.be/f2a0qwQKckM', description: 'Weekly market analysis and review from March 14.' },
  { id: 'fm13', title: '2026 Future Mentorship Lecture   Power of Three', url: 'https://youtu.be/8_yZ8fjeL7s', description: 'Essential lecture on the institutional Power of Three (PO3) concept.' },
  { id: 'fm14', title: '5 April 2026 (Future Mentorship Program)', url: 'https://youtu.be/MQw2i2xzRIY', description: 'Future Mentorship Program session from April 5.' },
  { id: 'fm15', title: '20 April 2026  Weekly Recap - 2026 Future Mentorship', url: 'https://youtu.be/2cLeAEIdLJ4', description: 'Weekly recap session for the 2026 Future Mentorship.' },
  { id: 'fm16', title: 'April 22 Liquidity Explanation   2026 Future Mentorship Course', url: 'https://youtu.be/YHKqbaZawIY', description: 'Institutional liquidity delivery and order flow explanation.' },
  { id: 'fm17', title: 'April 23 Pre Market Liquidity Observation - 2026 Future Mentorship Course', url: 'https://youtu.be/TzAFYsyjlZY', description: 'Live pre-market observation session focusing on liquidity pools.' },
  { id: 'fm18', title: 'April fourth Week', url: 'https://youtu.be/zsWVmIOoYXA', description: 'Weekly market dynamics and trading recap for April fourth week.' },
  { id: 'fm19', title: '27 April 2026 Mentorship Course(ORG Trend continuation+1st P FVG)', url: 'https://youtu.be/G0uvhfEklhk', description: 'Session on ORG Trend continuation theory and the 1st P FVG.' },
  { id: 'fm20', title: '29 April 2026 Mentorship Course (ORG + C.E  anticipation theory)', url: 'https://youtu.be/KZtrYE-AGTM', description: 'Session on ORG and Consequent Encroachment (C.E) anticipation theory.' },
  { id: 'fm21', title: '2 May 2026   Backtest Session', url: 'https://youtu.be/tvZwfriEjm8', description: 'Historical price action backtesting and layout analysis.' },
  { id: 'fm22', title: '25 May 2026 (Time window, Liquidity and Algorithmic price Delivery)', url: 'https://youtu.be/sQAW-9UO3mo', description: 'Lecture on time windows, liquidity pools, and algorithmic price delivery.' },
  { id: 'fm23', title: '29 June 2026 Weekly Recap and Suspension Block Liquidity', url: 'https://youtu.be/KKiHw3QPP-A', description: 'Weekly review of market action and deep dive into Suspension Block liquidity.' },
];

const TTT_BASIC = [
  {
    title: "Introduction To The Path",
    videos: [
      { id: "ttt-b-1-1", title: "Introduction to the Course & to trading", url: "https://youtu.be/NHM0u5gn1nA?si=PcPR20cb-fjYUaaF", description: "Course overview and trading basics." },
      { id: "ttt-b-1-2", title: "Who you are competing with", url: "https://youtu.be/vIocgg12jvs?si=NZgKmkC0dPCPxXAg", description: "Understanding market participants." },
      { id: "ttt-b-1-3", title: "Investing Vs Trading", url: "https://youtu.be/Alv4Gy__hzw?si=zWD3fU6vmlp6ETD2", description: "Differences between investing and trading." }
    ]
  },
  {
    title: "Series 100 - Introduction To Trading",
    videos: [
      { id: "ttt-b-2-1", title: "Your trading journey", url: "https://youtu.be/BZ31WpVmsyw?si=3W2_rc0lGs5l5klq", description: "Setting expectations for your journey." },
      { id: "ttt-b-2-2", title: "Understanding CFDs", url: "https://youtu.be/OACazUYigGU?si=LuYrwJCmGM0vqp", description: "Basics of Contract for Difference." },
      { id: "ttt-b-2-3", title: "Understanding Futures", url: "https://youtu.be/fEwXKFTB2OM?si=4Yqk-hrT-q6sHIwl", description: "Basics of Futures trading." },
      { id: "ttt-b-2-4", title: "Tools you will need as a trader", url: "https://youtu.be/Qr5x0Egap-o?si=ZqXGC3YdTLZ2sDih", description: "Essential trading tools." },
      { id: "ttt-b-2-5", title: "Who, what, why, when, where, how", url: "https://youtu.be/JU_Sb5C2fEM?si=RjgvX3iri0pqTAmH", description: "The 5Ws and 1H of trading." },
      { id: "ttt-b-2-6", title: "Introduction to technical analysis", url: "https://youtu.be/UB1f97ViD6Y?si=RZKE5rdM6mupOErV", description: "Basics of TA." },
      { id: "ttt-b-2-7", title: "Trading styles and strategies", url: "https://youtu.be/cJWFBPQc4Xk?si=BKYP8K5qyTkRXgaf", description: "Different approaches to the market." },
      { id: "ttt-b-2-8", title: "How to build your trading strategy", url: "https://youtu.be/Iq5z0KJkWls?si=diYYAEmj0bCygGyc", description: "Strategy development guide." },
      { id: "ttt-b-2-9", title: "How to build your trading success", url: "https://youtu.be/WSBUVqmaeiE?si=2mYfkqe8NECiPTs3", description: "Path to consistent profitability." }
    ]
  },
  {
    title: "Series 200 - Introduction To Technical Analysis",
    videos: [
      { id: "ttt-b-3-1", title: "200 Series - Didactical Objectives", url: "https://youtu.be/Ao_qZp1vNWk?si=tibxBCVyI9e6XMOb", description: "Learning goals for TA series." },
      { id: "ttt-b-3-2", title: "201 - Market Mechanics", url: "https://youtu.be/wQD8oh7cI6g?si=PsAFbwD_PMVVh00A", description: "How markets actually function." },
      { id: "ttt-b-3-3", title: "202 - Volume", url: "https://youtu.be/oNysIXIuuuc?si=Nl_7R3lag5QswG26", description: "Importance of volume in trading." },
      { id: "ttt-b-3-4", title: "203 - Indicators", url: "https://youtu.be/0nWM4DxxGhk?si=F2_szjCBXPSwki1i", description: "Using technical indicators effectively." },
      { id: "ttt-b-3-5", title: "204 - Basic of Price Action Analysis", url: "https://youtu.be/UlCCTvqmN5I?si=cUnb-VLDKBQN6cUV", description: "Introduction to price action." }
    ]
  },
  {
    title: "Series 300 - Introduction To Fundamental Analysis",
    videos: [
      { id: "ttt-b-4-1", title: "300 - Introduction", url: "https://youtu.be/GkC1-KGvVso?si=yTDgnuR2-OXbsruQ", description: "Intro to FA series." },
      { id: "ttt-b-4-2", title: "301 - What is fundamental Analysis", url: "https://youtu.be/1sGLeNXthXY?si=GC_yfwFnJ-u19jeT", description: "Core concepts of FA." },
      { id: "ttt-b-4-3", title: "302 - Brief history of Money", url: "https://youtu.be/Ap06Wf8Vbz8?si=Ft_MiymlqNjEHNMC", description: "Evolution of currency." },
      { id: "ttt-b-4-4", title: "303 - Debt Cycles", url: "https://youtu.be/STwPwThRo40?si=_0I0aJxJxBlbgFh8", description: "Understanding economic cycles." },
      { id: "ttt-b-4-5", title: "304 - Role of Central Banks", url: "https://youtu.be/LGUAW3lPoX4?si=DPeB4qu1NDYRX59c", description: "Monetary policy and central banking." },
      { id: "ttt-b-4-6", title: "305 - Economic Growth", url: "https://youtu.be/0rs31iOPYhM?si=r4Qq36h5lHWs8y2f", description: "GDP and growth indicators." },
      { id: "ttt-b-4-7", title: "306 - Inflation", url: "https://youtu.be/WpKcwXF7dB8?si=AfhlB9wt4Khtq_2o", description: "CPI and inflation dynamics." },
      { id: "ttt-b-4-8", title: "307 - Employment Data", url: "https://youtu.be/Ubh9PSCMjuQ?si=_q__IjGn5TnL7I_H", description: "NFP and unemployment reports." },
      { id: "ttt-b-4-9", title: "308 - Business Sentiment", url: "https://youtu.be/gYDhxLFj5vY?si=eQJGKcfjrVtXGK9U", description: "PMI and business surveys." },
      { id: "ttt-b-4-10", title: "309 - Consumer Sentiment", url: "https://youtu.be/nWuQRmc3Owc?si=losPGtFG48KXoSP_", description: "Consumer confidence metrics." },
      { id: "ttt-b-4-11", title: "310 - The economic calendar", url: "https://youtu.be/IJ50yi-7994?si=u3EG8zsRxgcGMwut", description: "Navigating economic releases." }
    ]
  },
  {
    title: "Series 400 - Volume Profile Mastery, Day Trading & Swing Trading",
    videos: [
      { id: "ttt-b-5-1", title: "400 - Introduction", url: "https://youtu.be/Ceh43DXjdc4?si=Iza_j4eQBC1btfCK", description: "Intro to advanced execution." },
      { id: "ttt-b-5-2", title: "401 - Why is our trading style unique", url: "https://youtu.be/tqb5HwKPZJA?si=hjHZQxlsZvrxNr-d", description: "Our edge in the market." },
      { id: "ttt-b-5-3", title: "402 - What is the volume profile", url: "https://youtu.be/pkgov1VFQOo?si=bcqT5P1OlWLEUqlE", description: "Core concepts of Volume Profile." },
      { id: "ttt-b-5-4", title: "403 - Introduction to intraday Setups", url: "https://youtu.be/osmVzyU4B9U?si=4fNiJlq7xm6WwGdB", description: "Day trading models." },
      { id: "ttt-b-5-5", title: "403 - Summary & Entry_Exit Checklist", url: "https://youtu.be/9M2BHG9CjKc?si=2LctuOwRQbgZiOeO", description: "Execution checklist." },
      { id: "ttt-b-5-6", title: "403 - Variant 1", url: "https://youtu.be/F0-2VJdg4As?si=PYHSAtaeN7WPMYse", description: "Setup Variant 1." },
      { id: "ttt-b-5-7", title: "403 - Variant 1 - Example", url: "https://youtu.be/8IPJY5_ouHA?si=7z4_2-MjhTHWv6Mn", description: "Variant 1 in practice." },
      { id: "ttt-b-5-8", title: "403 - Variant 2", url: "https://youtu.be/uC_v-9JGw1U?si=M2OvjHBS5orJnCZt", description: "Setup Variant 2." },
      { id: "ttt-b-5-9", title: "403 - Variant 2 - Example", url: "https://youtu.be/8LJgwnwWkp0?si=0DhToN2NYQfQ8p5V", description: "Variant 2 in practice." },
      { id: "ttt-b-5-10", title: "403 - Variant 3", url: "https://youtu.be/jb3xdfqtcYg?si=QXlbA9d9i0pfR16j", description: "Setup Variant 3." },
      { id: "ttt-b-5-11", title: "403 - Variant 3 - Example", url: "https://youtu.be/rSFHh2cGgUY?si=eHycXUttT7F6Su4e", description: "Variant 3 in practice." },
      { id: "ttt-b-5-12", title: "403 - Variant 4", url: "https://youtu.be/GtcakiWHMeI?si=Yh7JeQjJtSrEirYH", description: "Setup Variant 4." },
      { id: "ttt-b-5-13", title: "403 - Variant 4 - Example", url: "https://youtu.be/zeNQb_O5tbU?si=nlyMhNTZGHbugvom", description: "Variant 4 in practice." },
      { id: "ttt-b-5-14", title: "404 - Big Picture", url: "https://youtu.be/oQk-AZXixRs?si=qw2F_j9okkKK8eBG", description: "Higher timeframe context." },
      { id: "ttt-b-5-15", title: "404 - Big Picture Example Booking", url: "https://youtu.be/ffP2Hj5YkcI?si=IVlDt2p0TUAm5cSA", description: "Macro context example." },
      { id: "ttt-b-5-16", title: "404 - Big Picture Example CL", url: "https://youtu.be/CMhfOUp9xdE?si=Xa9IY5AKrrFhT3hW", description: "Crude Oil macro example." },
      { id: "ttt-b-5-17", title: "405 - Technical Derivation", url: "https://youtu.be/-5Kx9mVeWWc?si=ZwpM-snak3YQ7Esz", description: "Advanced technical concepts." }
    ]
  },
  {
    title: "Live Q&As",
    videos: [
      { id: "ttt-b-6-1", title: "Q&A - Jonathan", url: "https://youtu.be/0WtQ2hV1YOY?si=IIezK9VMIh3ewkO8", description: "Live Q&A session." },
      { id: "ttt-b-6-2", title: "Q&A - Jonathan", url: "https://youtu.be/MG6E4KXjPfo?si=D-PwvMhmo3HrVC5M", description: "Live Q&A session." }
    ]
  }
];

const TTT_PREMIUM = [
  {
    title: "Introduction Edge Implementation",
    videos: [
      { id: "ttt-p-1-1", title: "Introduction to edges", url: "https://youtu.be/IZvnNP_D_EE?si=K1eDTcLZ4oOZOA4T", description: "Defining market edges." },
      { id: "ttt-p-1-2", title: "Edge 1 Opening Variants", url: "https://youtu.be/y3DmDLSyaIE?si=kmvQQr7WVEPvXVP_", description: "Opening bell strategies." },
      { id: "ttt-p-1-3", title: "Edge 2 Overlaping Levels", url: "https://youtu.be/zCZH3ke5OhY?si=XyxnE4UgImYioK2L", description: "Confluence of levels." },
      { id: "ttt-p-1-4", title: "Edge 3 Mountains & Valley", url: "https://youtu.be/AC9KmTDlJFg?si=I3waQvxWFtEyVHMl", description: "Structural edges." },
      { id: "ttt-p-1-5", title: "Edge 4 Business Zones", url: "https://youtu.be/LXxVpxSb-cA?si=1GaN0tBqr1UNqaIr", description: "High probability zones." },
      { id: "ttt-p-1-6", title: "Backtesting FDAX Edge Examples", url: "https://youtu.be/v0HhUVJpXDY?si=wAKOrRB5jJWcYqrZ", description: "DAX backtesting." },
      { id: "ttt-p-1-7", title: "Building Tradingview Layout From Scratch", url: "https://youtu.be/9rdAjEfAmv8?si=cr1sAH6eYTadJ90Z", description: "Platform setup." },
      { id: "ttt-p-1-8", title: "Tradingview Layout Overview", url: "https://youtu.be/ICZXFxTk6JI?si=33bIBr8FFTZpNaJv", description: "Optimizing your workspace." }
    ]
  },
  {
    title: "Series 5 - Market Profile",
    videos: [
      { id: "ttt-p-2-1", title: "500 - Introduction", url: "https://youtu.be/ckGzGjkImbg?si=6t4ZpiESk13W_aGg", description: "Intro to Market Profile." },
      { id: "ttt-p-2-2", title: "501 - Market Profile", url: "https://youtu.be/RmSNlzp4sh8?si=zaVi0xnFb-UQJR62", description: "Core concepts of MP." },
      { id: "ttt-p-2-3", title: "502 - Symmetric & Asymmetric Profiles", url: "https://youtu.be/MIwkUel-uh8?si=0Y3G780oxtZYUB_W", description: "Profile shapes and meaning." },
      { id: "ttt-p-2-4", title: "503 - Market Openings", url: "https://youtu.be/AdgpCMa6mrQ?si=i9j5KkD4uEKwkE-4", description: "MP opening types." },
      { id: "ttt-p-2-5", title: "504 - Checklist, Context, Timing & Execution", url: "https://youtu.be/7Sefk4nbFPU?si=2fXwZlMviWBPDoC7", description: "Execution framework." },
      { id: "ttt-p-2-6", title: "505 - Business Zones", url: "https://youtu.be/Go1LYqw73vc?si=K1sN3dIhrmciqkLB", description: "MP business zones." }
    ]
  },
  {
    title: "Series 6 - Dynamic Setups",
    videos: [
      { id: "ttt-p-3-1", title: "600 - Introduction", url: "https://youtu.be/XUWQ-wmBzMo?si=3kZgQGUapf-th_lX", description: "Intro to Dynamic Setups." },
      { id: "ttt-p-3-2", title: "601 - Dynamic Setups", url: "https://youtu.be/nFhrEsZLH78?si=VX2ba_vJVv67TGHa", description: "Adaptive trading models." },
      { id: "ttt-p-3-3", title: "602 - Footprint Charts", url: "https://youtu.be/LVeUutCbE7o?si=HdEfrDX6wmHhSgLP", description: "Order flow visualization." },
      { id: "ttt-p-3-4", title: "603 - Footprint Details", url: "https://youtu.be/ZIxdC65kzPg?si=2biS-zEQ6trzjcXX", description: "Deep dive into Footprint." },
      { id: "ttt-p-3-5", title: "604 - Orderflow Basics", url: "https://youtu.be/Ja7ekO_cUkE?si=p50m1zZ5Xg0FmWi2", description: "Introduction to Order Flow." },
      { id: "ttt-p-3-6", title: "605 - Orderflow Speed", url: "https://youtu.be/p4KTDJ-Yr2Q?si=B6WPWbVTSrHHgX-f", description: "Tape reading and speed." },
      { id: "ttt-p-3-7", title: "606 - Technical Setups", url: "https://youtu.be/Vkv5BilH13A?si=S0-uaMH0uG-Oti8M", description: "Advanced technical execution." }
    ]
  },
  {
    title: "Series 7 - Risk & Money Management",
    videos: [
      { id: "ttt-p-4-1", title: "700 - Introduction", url: "https://youtu.be/LEC6KO0JqAo?si=JMcx_YRdxoeUZvdt", description: "Intro to Risk Management." },
      { id: "ttt-p-4-2", title: "701 - Risk Vs Money Management", url: "https://youtu.be/dJujYooTI6o?si=nkD94_4C-QiEQ-P_", description: "Key distinctions." },
      { id: "ttt-p-4-3", title: "702 - Money Management", url: "https://youtu.be/AzaNIQBnec0?si=YhRZs-V7xKHZeX38", description: "Capital preservation." },
      { id: "ttt-p-4-4", title: "703 - Risk Management", url: "https://youtu.be/3PBhiZSqBVQ?si=EubgpISNO-zkP6gM", description: "Trade risk control." },
      { id: "ttt-p-4-5", title: "704 - Hit Rate", url: "https://youtu.be/iuB5n3oT1M8?si=QKUW6_CspPWCLIfd", description: "Understanding win rates." },
      { id: "ttt-p-4-6", title: "705 - Risk to Reward Ratio", url: "https://youtu.be/IZ8WrRpEFeM?si=uQBG9eGhiS1xJTay", description: "Optimizing RR." },
      { id: "ttt-p-4-7", title: "706 - How important is hit rate", url: "https://youtu.be/8H3P02o85_k?si=glnE4gKzjfyCUycF", description: "Win rate vs RR." },
      { id: "ttt-p-4-8", title: "707 - Expectancy", url: "https://youtu.be/OiQGmxoLSCY?si=7XkNGKa29D5958QP", description: "Mathematical edge." },
      { id: "ttt-p-4-9", title: "708 - Montecarlo Simulation", url: "https://youtu.be/JZl3-EN-ShM?si=uYa0LW8LDGR7anh7", description: "Probability modeling." },
      { id: "ttt-p-4-10", title: "709 - Maximum Drawdonw", url: "https://youtu.be/a2ZtomvGZEY?si=Vwtaj8o1Ckrrbae_", description: "Managing drawdowns." },
      { id: "ttt-p-4-11", title: "710 - Maximum Losing Streak & Psychology", url: "https://youtu.be/vKmcJp0pFFg", description: "Mental game during streaks." }
    ]
  },
  {
    title: "Live Sessions",
    videos: [
      { id: "ttt-p-5-1", title: "Friday 17th Jan - Questions & Answers Session", url: "https://youtu.be/5ASQfwR2mYQ?si=2Ww92gbkx1X-tSms", description: "Live Q&A." },
      { id: "ttt-p-5-2", title: "Tuesday 21st January - Market Outlook", url: "https://youtu.be/Ree-smR2Hdw?si=BtLKVI8VuJJf70hP", description: "Live Market Analysis." }
    ]
  }
];

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// High-fidelity metadata for each category, giving a custom name, subtitle, description, icon and color theme
const CATEGORY_META: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  featuredTag?: string;
  badgeStyle: string;
}> = {
  '2026 Future Mentorship': {
    title: 'Future Mentorship Program 2026',
    subtitle: 'High Frequency & Price Delivery',
    description: 'Master algorithmic liquidity delivery, order block grading levels, and daily bias keys with our cutting-edge live modules.',
    icon: Sparkles,
    featuredTag: 'Elite Series',
    badgeStyle: 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
  },
  'TTT': {
    title: 'TTT Ultimate Trading Path',
    subtitle: 'From Fundamentals to Execution Edges',
    description: 'Learn the proprietary TTT trading architecture featuring dynamic setups, complete debt-cycle macroeconomics, and volume profile mastery.',
    icon: Layers,
    featuredTag: 'Masterclass',
    badgeStyle: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  },
  'VIP-1 Courses': {
    title: 'VIP-1 Foundation Suite',
    subtitle: 'Professional Market Core Essentials',
    description: 'Kickstart your trading path with core market structures, basic risk mechanics, and essential quantitative psychology lessons.',
    icon: BookOpen,
    featuredTag: 'Foundational',
    badgeStyle: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
  },
  'VIP-2 Courses': {
    title: 'VIP-2 Pro Advanced Suite',
    subtitle: 'Advanced Confluences & Strategy',
    description: 'Technical and fundamental synergy modules. Deep dive into Fibonacci extension, harmonic structures, and advanced correlations.',
    icon: Award,
    featuredTag: 'Advanced Upgrade',
    badgeStyle: 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
  },
  'Day Trading Strategy': {
    title: 'Day Trading Strategy Blueprint',
    subtitle: 'Intraday Session Scaling',
    description: 'Formulate an institutional daily trading plan based on session liquidity sweeps, volume profiles, and strict high-RR rules.',
    icon: TrendingUp,
    featuredTag: 'Tactical Study',
    badgeStyle: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  },
  'Introduction about Crypto': {
    title: 'Digital Assets & Web3 Intro',
    subtitle: 'Distributed Ledger Trading Fundamentals',
    description: 'A structural overview of blockchain mechanics, wallet governance, exchange security guidelines, and hot/cold custody configurations.',
    icon: Coins,
    featuredTag: 'Tech-Forward',
    badgeStyle: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
  },
  'Fundamental': {
    title: 'Macro & Fundamental Analysis',
    subtitle: 'Central Bank & Economic Mechanics',
    description: 'Model real-world macro dynamics. Master interest rate decisions, non-farm payroll indicators, Sentiment indexes, and CPI-inflation hedging.',
    icon: Globe,
    featuredTag: 'Macroeconomics',
    badgeStyle: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  },
  'Learn Thai': {
    title: 'Thai Language Masterclass',
    subtitle: 'ထိုင်းစကားပြောနှင့် ဝါကျတည်ဆောက်ခြင်း',
    description: 'ထိုင်းဘာသာစကားကို နိဒါန်းမှစတင်ကာ နေ့စဉ်သုံးစကားပြော၊ အလုပ်အကိုင်၊ ဈေးဝယ်ခြင်းနှင့် ခရီးသွားလမ်းညွှန်များအထိ စနစ်တကျ သင်ယူပါ။',
    icon: Languages,
    featuredTag: 'Bilingual Course',
    badgeStyle: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
  },
  'ICT Notes': {
    title: 'ICT Cheat Sheets',
    subtitle: 'Price Delivery Reference Library',
    description: 'Interactive cheatsheets, Fair Value Gap (FVG) guidelines, and institutional orderflow algorithms summarized visually.',
    icon: FileText,
    featuredTag: 'Quick Reference',
    badgeStyle: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
  },
  'PDF': {
    title: 'A3 Trading PDF Library',
    subtitle: 'Curated Institutional Core Handbooks',
    description: 'Downloadable market playbooks, trading plans, journal templates, and key charts customized for instant reference.',
    icon: FileText,
    featuredTag: 'Resource Vault',
    badgeStyle: 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
  }
};

export default function Campus() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('2026 Future Mentorship');
  const [tttSubFilter, setTttSubFilter] = useState<'Basic' | 'Premium'>('Basic');
  const [searchQuery, setSearchQuery] = useState('');
  
  // High-end stateful learning center props
  const [activeVideo, setActiveVideo] = useState<{ id: string; title: string; url: string; description: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);

  // Load persistence completed state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('campus_completed_videos');
      if (stored) {
        setCompletedVideos(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load completed videos state', e);
    }
  }, []);

  const toggleVideoCompleted = (id: string) => {
    setCompletedVideos(prev => {
      const next = prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id];
      localStorage.setItem('campus_completed_videos', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setResources(data);
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources().catch(err => console.error('Initial resources fetch error:', err));
  }, []);

  const categories = [
    { name: '2026 Future Mentorship', count: FUTURE_MENTORSHIP_VIDEOS.length, icon: Sparkles },
    { name: 'TTT', count: TTT_BASIC.reduce((acc, s) => acc + s.videos.length, 0) + TTT_PREMIUM.reduce((acc, s) => acc + s.videos.length, 0), icon: Layers },
    { name: 'VIP-1 Courses', count: VIP1_VIDEOS.length, icon: BookOpen },
    { name: 'VIP-2 Courses', count: VIP2_VIDEOS.length, icon: Award },
    { name: 'Day Trading Strategy', count: DAY_TRADING_VIDEOS.length, icon: TrendingUp },
    { name: 'Introduction about Crypto', count: CRYPTO_INTRO_VIDEOS.length, icon: Coins },
    { name: 'Fundamental', count: FUNDAMENTAL_VIDEOS.length, icon: Globe },
    { name: 'Learn Thai', count: THAI_LANGUAGE_VIDEOS.length, icon: Languages },
    { name: 'ICT Notes', count: 0, icon: FileText },
    { name: 'PDF', count: 0, icon: FileText }
  ];

  const getCategoryCount = (catName: string) => {
    const staticCount = categories.find(c => c.name === catName)?.count || 0;
    const dynamicCount = resources.filter(r => r.category === catName).length;
    return staticCount + dynamicCount;
  };

  const getActiveVideosList = () => {
    let list: { id: string; title: string; url: string; description: string }[] = [];
    if (filter === '2026 Future Mentorship') {
      list = FUTURE_MENTORSHIP_VIDEOS;
    } else if (filter === 'VIP-1 Courses') {
      list = VIP1_VIDEOS;
    } else if (filter === 'VIP-2 Courses') {
      list = VIP2_VIDEOS;
    } else if (filter === 'Day Trading Strategy') {
      list = DAY_TRADING_VIDEOS;
    } else if (filter === 'Introduction about Crypto') {
      list = CRYPTO_INTRO_VIDEOS;
    } else if (filter === 'Fundamental') {
      list = FUNDAMENTAL_VIDEOS;
    } else if (filter === 'Learn Thai') {
      list = THAI_LANGUAGE_VIDEOS;
    } else if (filter === 'TTT') {
      const activeSections = tttSubFilter === 'Basic' ? TTT_BASIC : TTT_PREMIUM;
      list = activeSections.flatMap(s => s.videos);
    } else {
      list = resources.filter(r => r.category === filter).map(r => ({
        id: r.id,
        title: r.title,
        url: r.url,
        description: r.description
      }));
    }

    if (searchQuery.trim()) {
      list = list.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  };

  const activeVideosList = getActiveVideosList();

  // Intelligently sync active video when track/filter shifts
  useEffect(() => {
    if (activeVideosList.length > 0) {
      const alreadyActiveExists = activeVideosList.some(v => v.id === activeVideo?.id);
      if (!alreadyActiveExists) {
        setActiveVideo(activeVideosList[0]);
        setIsPlaying(false);
      }
    } else {
      setActiveVideo(null);
      setIsPlaying(false);
    }
  }, [filter, tttSubFilter, searchQuery, resources]);

  const activeYtId = activeVideo ? getYouTubeId(activeVideo.url) : null;

  // Calculators completion stats
  const currentCategoryCompletedCount = completedVideos.filter(vidId => {
    if (filter === '2026 Future Mentorship') return FUTURE_MENTORSHIP_VIDEOS.some(v => v.id === vidId);
    if (filter === 'VIP-1 Courses') return VIP1_VIDEOS.some(v => v.id === vidId);
    if (filter === 'VIP-2 Courses') return VIP2_VIDEOS.some(v => v.id === vidId);
    if (filter === 'Day Trading Strategy') return DAY_TRADING_VIDEOS.some(v => v.id === vidId);
    if (filter === 'Introduction about Crypto') return CRYPTO_INTRO_VIDEOS.some(v => v.id === vidId);
    if (filter === 'Fundamental') return FUNDAMENTAL_VIDEOS.some(v => v.id === vidId);
    if (filter === 'Learn Thai') return THAI_LANGUAGE_VIDEOS.some(v => v.id === vidId);
    if (filter === 'TTT') return [...TTT_BASIC.flatMap(s => s.videos), ...TTT_PREMIUM.flatMap(s => s.videos)].some(v => v.id === vidId);
    return false;
  }).length;

  const currentCategoryTotalCount = filter === 'TTT' 
    ? TTT_BASIC.reduce((acc, s) => acc + s.videos.length, 0) + TTT_PREMIUM.reduce((acc, s) => acc + s.videos.length, 0)
    : getCategoryCount(filter);

  return (
    <div className="space-y-8">
      {/* Search and Header Section */}
      <ScrollReveal>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#141414]">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">Campus Academy</h1>
            <p className="text-xs font-semibold text-neutral-500 mt-1 uppercase tracking-widest leading-relaxed">
              Premium educational environment tailored for financial markets & trading logic development.
            </p>
          </div>
          <div className="relative group w-full md:w-72 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-sky-500 transition-colors duration-300" />
            <input 
              type="text"
              placeholder="Search lectures & courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/25 transition-all duration-300 placeholder:text-neutral-600"
            />
          </div>
        </header>
      </ScrollReveal>

      {/* Main Grid: Responsive Sidebar + Content stage */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        
        {/* Left Side: Professional Navigation Rail (Scrolls Horizontally on Mobile, Sticky Column on Desktop) */}
        <div className="lg:sticky lg:top-24 space-y-4 max-w-full">
          <div className="hidden lg:block pl-3">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Learning Directory</span>
          </div>

          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none snap-x snap-mandatory">
            {categories.map((cat) => {
              const count = getCategoryCount(cat.name);
              const IconComponent = cat.icon;
              const isActive = filter === cat.name;

              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setFilter(cat.name);
                    setIsPlaying(false);
                  }}
                  className={cn(
                    "snap-center shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden text-left group",
                    isActive 
                      ? "bg-sky-500 text-black font-black shadow-lg shadow-sky-500/10 w-[210px] lg:w-full" 
                      : "bg-[#0a0a0a] text-neutral-400 hover:text-white border border-[#141414] hover:border-[#222] w-[170px] lg:w-full hover:bg-[#0e0e0e]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                      isActive ? "bg-black/10 text-black" : "bg-[#121212] text-neutral-500 group-hover:bg-[#1a1a1a] group-hover:text-white"
                    )}>
                      <IconComponent className="w-3.5 h-3.5 animate-none group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2">
                    {count > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-mono font-black",
                        isActive ? "bg-black/15 text-black" : "bg-sky-500/10 text-sky-400 border border-sky-500/5"
                      )}>
                        {count}
                      </span>
                    )}
                    {cat.name === '2026 Future Mentorship' && (
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        isActive ? "bg-black" : "bg-sky-500"
                      )} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Primary Learning Stage */}
        <div className="min-w-0 flex-1 space-y-4">
          
          {/* Dynamic Track Header Banner */}
          {CATEGORY_META[filter] && (
            <ScrollReveal>
              <div className="relative rounded-2xl overflow-hidden border border-[#141414] py-4 px-5 md:py-5 md:px-7 bg-gradient-to-br from-[#0c0c0c] to-[#040404]">
                {/* Decorative background gradients */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -right-12 w-48 h-48 bg-sky-500/5 rounded-full blur-[85px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {CATEGORY_META[filter].featuredTag && (
                        <span className={cn(
                          "px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg",
                          CATEGORY_META[filter].badgeStyle
                        )}>
                          {CATEGORY_META[filter].featuredTag}
                        </span>
                      )}
                      {filter === '2026 Future Mentorship' && (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20 rounded-lg animate-pulse">
                          Active Series
                        </span>
                      )}
                    </div>
                    <h2 className="text-base md:text-xl font-black text-white tracking-tight uppercase italic">{CATEGORY_META[filter].title}</h2>
                    <p className="text-[11px] md:text-xs text-neutral-400 font-medium leading-relaxed">{CATEGORY_META[filter].description}</p>
                  </div>

                  {/* Completion and Progress metrics box */}
                  {filter !== 'ICT Notes' && filter !== 'PDF' && currentCategoryTotalCount > 0 && (
                    <div className="flex flex-row md:flex-col gap-3 shrink-0 bg-[#070707]/60 p-3 border border-[#141414] rounded-xl items-center text-center justify-between md:justify-center min-w-full md:min-w-[160px]">
                      <div className="text-left md:text-center space-y-0.5">
                        <span className="text-[8px] font-semibold text-neutral-500 uppercase tracking-widest block font-sans">Syllabus Progress</span>
                        <span className="text-[10px] font-black text-white block">
                          {currentCategoryCompletedCount} / {currentCategoryTotalCount} Completed
                        </span>
                      </div>
                      <div className="w-20 md:w-full h-1 bg-[#141414] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-500"
                          style={{ width: `${Math.round((currentCategoryCompletedCount / currentCategoryTotalCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Conditional Workspaces Rendering */}
          {filter === 'ICT Notes' ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ICTNotes />
            </motion.div>
          ) : filter === 'PDF' ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PDFLibrary />
            </motion.div>
          ) : (
            /* Cinematic LMS double panel: Main video screen + interactive playlist */
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
              
              {/* Cinematic Viewing Theater */}
              <div className="space-y-3">
                {activeVideo ? (
                  <div className="bg-[#080808] border border-[#131313] rounded-2xl overflow-hidden p-2.5 md:p-4 space-y-4 shadow-sm">
                    {/* 16:9 Widescreen stage */}
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#181818]">
                      {isPlaying && activeYtId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
                          title={activeVideo.title}
                          className="absolute inset-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full relative group">
                          {activeYtId ? (
                            <>
                              <img 
                                src={`https://img.youtube.com/vi/${activeYtId}/maxresdefault.jpg`} 
                                alt={activeVideo.title}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${activeYtId}/hqdefault.jpg`;
                                }}
                                className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 pointer-events-none" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-[#050505] flex items-center justify-center pointer-events-none" />
                          )}

                          {/* Glowing pulse play hook */}
                          <button 
                            onClick={() => setIsPlaying(true)}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center p-4 md:p-5 rounded-full bg-sky-500 text-black shadow-2xl shadow-sky-500/30 hover:scale-110 hover:bg-sky-400 active:scale-95 transition-all duration-300 z-10"
                          >
                            <PlayCircle className="w-7 h-7 md:w-8 md:h-8 fill-black text-black" />
                          </button>

                          {/* Top Tag */}
                          <div className="absolute top-4 left-4 z-10">
                            <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-widest text-sky-400 border border-sky-500/10">
                              Lecture {activeVideo.id}
                            </span>
                          </div>

                          <div className="absolute bottom-5 left-5 right-5 text-left pointer-events-none z-10">
                            <h4 className="text-xs md:text-base font-black text-white tracking-tight drop-shadow truncate">
                              {activeVideo.title}
                            </h4>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata controls block */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-4">
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">Currently Playing</span>
                          <h3 className="text-base md:text-lg font-bold text-white tracking-tight mt-0.5">{activeVideo.title}</h3>
                        </div>

                        {/* Interactive trigger tools */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleVideoCompleted(activeVideo.id)}
                            className={cn(
                              "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                              completedVideos.includes(activeVideo.id)
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                                : "bg-white/5 text-neutral-400 border-[#1f1f1f] hover:text-white hover:bg-white/10"
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {completedVideos.includes(activeVideo.id) ? "Lesson Done" : "Mark Complete"}
                          </button>

                          <a 
                            href={activeVideo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 bg-[#0c0c0c] hover:bg-[#111] border border-[#1a1a1a] text-neutral-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300"
                          >
                            Watch On YouTube
                            <ExternalLink className="w-3" />
                          </a>
                        </div>
                      </div>

                      {/* Brief description box */}
                      <div className="p-4 bg-[#050505] rounded-2xl border border-[#111]">
                        <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Details & Core Target</span>
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap">
                          {activeVideo.description || "Detailed conceptual breakdown and strategic summary for this specific program module."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#080808] border border-[#131313] rounded-3xl h-[360px] flex flex-col items-center justify-center text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] flex items-center justify-center border border-[#1a1a1a] text-neutral-500 mb-3 animate-pulse">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase italic">No Active Video</h4>
                    <p className="text-[11px] text-neutral-500 max-w-xs mt-1">
                      Choose any session module in the list playlist to begin high-end classroom streaming.
                    </p>
                  </div>
                )}
              </div>

              {/* Course Playlist Pane */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Syllabus Playlist</span>
                  <span className="text-[9px] font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/10 shrink-0 uppercase tracking-widest">
                    {activeVideosList.length} Lessons
                  </span>
                </div>

                {/* Flat structure list for single level categories vs Grouped nested for TTT */}
                {filter === 'TTT' ? (
                  <div className="space-y-5 bg-[#050505] border border-[#131313] rounded-3xl p-3 max-h-[520px] overflow-y-auto scrollbar-none">
                    
                    {/* Chapter toggler/options for TTT */}
                    <div className="flex p-1 bg-[#0a0a0a] border border-[#181818] rounded-2xl shrink-0">
                      {(['Basic', 'Premium'] as const).map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            setTttSubFilter(sub);
                          }}
                          className={cn(
                            "flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                            tttSubFilter === sub 
                              ? "bg-sky-500 text-black shadow-md shadow-sky-500/10 font-black" 
                              : "text-neutral-500 hover:text-white"
                          )}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>

                    {/* Grouped nested TTT layout */}
                    <div className="space-y-5">
                      {(tttSubFilter === 'Basic' ? TTT_BASIC : TTT_PREMIUM).map((section, sIdx) => {
                        return (
                          <div key={section.title} className="space-y-2">
                            <div className="sticky top-0 bg-[#050505]/95 backdrop-blur-md z-10 py-1.5 flex items-center justify-between border-b border-[#121212]">
                              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest truncate max-w-[200px]">
                                {sIdx + 1}. {section.title}
                              </span>
                              <span className="text-[8px] font-black text-neutral-500 bg-[#0e0e0e] px-1.5 py-0.5 rounded border border-[#161616]">
                                {section.videos.length} items
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {section.videos.map((video) => {
                                const isSelected = activeVideo?.id === video.id;
                                const videoYoutubeId = getYouTubeId(video.url);
                                const isDone = completedVideos.includes(video.id);

                                return (
                                  <button
                                    key={video.id}
                                    onClick={() => {
                                      setActiveVideo(video);
                                      setIsPlaying(true);
                                    }}
                                    className={cn(
                                      "w-full p-2 rounded-xl flex items-center gap-3 transition-all duration-300 text-left group border shrink-0",
                                      isSelected
                                        ? "bg-sky-500/10 border-sky-500/25 text-sky-450"
                                        : "bg-[#080808] border-[#101010] hover:border-[#1b1b1b] text-neutral-300 hover:bg-[#0c0c0c] hover:text-white"
                                    )}
                                  >
                                    <div className="relative w-11 h-8 aspect-video rounded-lg overflow-hidden bg-black border border-[#141414] shrink-0">
                                      {videoYoutubeId ? (
                                        <img
                                          src={`https://img.youtube.com/vi/${videoYoutubeId}/hqdefault.jpg`}
                                          alt={video.title}
                                          className="w-full h-full object-cover opacity-50"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-[#121212]" />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <PlayCircle className="w-3.5 h-3.5 text-white opacity-80" />
                                      </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <h5 className={cn(
                                          "text-[10px] font-bold truncate leading-tight",
                                          isSelected ? "text-sky-400 font-extrabold" : "text-white"
                                        )}>
                                          {video.title}
                                        </h5>
                                        {isDone && (
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-[8px] text-neutral-500 truncate mt-0.5">
                                        {video.description || "Video chapter segment."}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#050505] border border-[#131313] rounded-3xl p-2.5 max-h-[480px] overflow-y-auto scrollbar-none space-y-1.5">
                    {activeVideosList.map((video, idx) => {
                      const isSelected = activeVideo?.id === video.id;
                      const videoYoutubeId = getYouTubeId(video.url);
                      const isDone = completedVideos.includes(video.id);

                      return (
                        <button
                          key={video.id}
                          onClick={() => {
                            setActiveVideo(video);
                            setIsPlaying(true);
                          }}
                          className={cn(
                            "w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all duration-300 text-left group border shrink-0",
                            isSelected
                              ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                              : "bg-[#080808] border-[#101010] hover:border-[#1c1c1c] text-neutral-300 hover:bg-[#0c0c0c] hover:text-white"
                          )}
                        >
                          <div className="relative w-12 h-8 aspect-video rounded-xl overflow-hidden bg-black border border-[#141414] shrink-0">
                            {videoYoutubeId ? (
                              <img
                                src={`https://img.youtube.com/vi/${videoYoutubeId}/hqdefault.jpg`}
                                alt={video.title}
                                className="w-full h-full object-cover opacity-60"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#121212]" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <PlayCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-neutral-500 select-none font-mono shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <h5 className={cn(
                                "text-[11px] font-bold truncate leading-tight",
                                isSelected ? "text-sky-400 font-black" : "text-white"
                              )}>
                                {video.title}
                              </h5>
                              {isDone && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[9px] text-neutral-500 truncate mt-0.5">
                              {video.description || "Video master lecture session."}
                            </p>
                          </div>
                          
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white transition-colors ml-auto pl-0.5 shrink-0" />
                        </button>
                      );
                    })}

                    {activeVideosList.length === 0 && (
                      <div className="py-12 text-center">
                        <span className="text-[10px] text-neutral-600 block italic">No matching videos in this playlist.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
