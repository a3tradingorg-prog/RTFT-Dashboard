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
  Clock
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
  { id: 'th8', title: 'သင်ခန်းစာ ၈ တားမြစ်စကားလုံးနှင့် အငြင်း စကားလုံးများ', url: 'https://youtu.be/Wu28U7cvXwo', description: 'တားမြစ်စကားလုံးများနှင့် အငြင်းစကားလုံးများ' },
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
  { id: 'fm1', title: '15 FEB 2026', url: 'https://youtu.be/odwT5WJlAjA', description: 'Mentorship session recorded on Feb 15.' },
  { id: 'fm2', title: '16 FEB 2026', url: 'https://youtu.be/TClbTF6NB1Y', description: 'Mentorship session recorded on Feb 16.' },
  { id: 'fm3', title: '17 FEB 2026', url: 'https://youtu.be/mWl13hYFwmE', description: 'Mentorship session recorded on Feb 17.' },
  { id: 'fm4', title: '19 FEB 2026 - Part 1', url: 'https://youtu.be/usH3G1F9lm4', description: 'First part of the Feb 19 session.' },
  { id: 'fm5', title: '19 FEB 2026 - Part 2', url: 'https://youtu.be/ETzof8nXVkk', description: 'Second part of the Feb 19 session.' },
  { id: 'fm6', title: '20 FEB 2026 - HRLRD and LRLRD Lecture', url: 'https://youtu.be/MytrXa5rg_4', description: 'Special lecture on HRLRD and LRLRD.' },
  { id: 'fm7', title: 'February 3rd Week: Weekly Market Review', url: 'https://youtu.be/nnAeG-5Epl0', description: 'Review of the third week of February.' },
  { id: 'fm8', title: '26 FEB 2026 - Trade Recap & Grading Levels', url: 'https://youtu.be/1qnO4n3Ngec', description: 'Recap and defining grading levels in Gaps, OBs, etc.' },
  { id: 'fm9', title: '1 March 2026 - March Q1 Homework', url: 'https://youtu.be/K_gdLpDaVpI', description: 'Includes homework for the first week of March.' },
  { id: 'fm10', title: '1st Week of March: Trade Reviews & Model Deep Dive', url: 'https://youtu.be/b6ccWeY3AyQ', description: 'Deep dive into the model and trade reviews.' },
  { id: 'fm11', title: '3 March 2026: Future Mentorship Course', url: 'https://youtu.be/-1NofFZUwBc', description: 'Mentorship session recorded on March 3.' },
  { id: 'fm12', title: 'March 2nd Week: Weekly Market Review', url: 'https://youtu.be/f2a0qwQKckM', description: 'Review of the second week of March.' },
  { id: 'fm13', title: 'Future Mentorship 2026: Power of Three', url: 'https://youtu.be/8_yZ8fjeL7s', description: 'Lecture episode about the "Power of Three" concept.' },
  { id: 'fm17', title: 'April Fourth Week', url: 'https://youtu.be/zsWVmIOoYXA', description: 'Essential risk management principles and capital protection.' },
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
      { id: "ttt-b-2-2", title: "Understanding CFDs", url: "https://youtu.be/OACazUYigGU?si=LuYrwJCmPFGM0vqp", description: "Basics of Contract for Difference." },
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

function AccordionItem({ title, description, url, isOpen, onToggle }: { title: string, description: string, url: string, isOpen: boolean, onToggle: () => void }) {
  const youtubeId = getYouTubeId(url);
  
  return (
    <div className={cn(
      "border transition-all duration-300 rounded-2xl overflow-hidden mb-4",
      isOpen ? "border-sky-500/30 bg-[#1a1a1a] shadow-lg shadow-sky-500/5" : "border-[#262626] bg-[#141414] hover:border-neutral-700"
    )}>
      <button 
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between transition-colors text-left group"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
            isOpen ? "bg-sky-500 text-black" : "bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20"
          )}>
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className={cn(
                "font-bold transition-colors text-sm",
                isOpen ? "text-sky-400" : "text-white"
              )}>{title}</h3>
            </div>
            <p className="text-[10px] text-neutral-500 mt-0.5">{description}</p>
          </div>
        </div>
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-sky-500/20 text-sky-400 rotate-180" : "bg-neutral-800 text-neutral-500"
        )}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-6 pt-0 border-t border-[#262626]">
              <div className="aspect-video rounded-xl overflow-hidden bg-black mt-4">
                {youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-800">
                    <PlayCircle className="w-16 h-16" />
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-black uppercase tracking-widest text-sky-500 hover:text-sky-400 flex items-center gap-2"
                >
                  Watch on YouTube
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Campus() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('2026 Future Mentorship');
  const [tttSubFilter, setTttSubFilter] = useState<'Basic' | 'Premium'>('Basic');
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    { name: '2026 Future Mentorship', count: FUTURE_MENTORSHIP_VIDEOS.length },
    { name: 'TTT', count: TTT_BASIC.reduce((acc, s) => acc + s.videos.length, 0) + TTT_PREMIUM.reduce((acc, s) => acc + s.videos.length, 0) },
    { name: 'VIP-1 Courses', count: VIP1_VIDEOS.length },
    { name: 'VIP-2 Courses', count: VIP2_VIDEOS.length },
    { name: 'Day Trading Strategy', count: DAY_TRADING_VIDEOS.length },
    { name: 'Introduction about Crypto', count: CRYPTO_INTRO_VIDEOS.length },
    { name: 'Fundamental', count: FUNDAMENTAL_VIDEOS.length },
    { name: 'Learn Thai', count: THAI_LANGUAGE_VIDEOS.length },
    { name: 'ICT Notes', count: 0 }, // Handled separately
    { name: 'PDF', count: 0 } // Handled separately
  ];

  const getCategoryCount = (catName: string) => {
    const staticCount = categories.find(c => c.name === catName)?.count || 0;
    const dynamicCount = resources.filter(r => r.category === catName).length;
    return staticCount + dynamicCount;
  };
  
  const filteredResources = resources.filter(r => 
    r.category === filter && 
    (r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-10">
      <ScrollReveal>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase tracking-tighter italic">Campus</h1>
            <p className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-widest">Exclusive educational content and market outlooks.</p>
          </div>
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 group-focus-within:text-sky-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-neutral-600"
            />
          </div>
        </header>
      </ScrollReveal>

      {/* Category Filter */}
      <ScrollReveal delay={0.1}>
        <div className="flex flex-wrap gap-3 pb-4 border-b border-[#262626]">
          {categories.map((cat) => {
            const count = getCategoryCount(cat.name);
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setFilter(cat.name);
                  setOpenVideoId(null);
                }}
                className={cn(
                  "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 relative overflow-hidden group",
                  filter === cat.name 
                    ? "bg-sky-500 text-black shadow-xl shadow-sky-500/20 scale-105" 
                    : "bg-[#141414] text-neutral-500 hover:text-white border border-[#262626] hover:border-neutral-700"
                )}
              >
                <span className="relative z-10">{cat.name}</span>
                {count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-black relative z-10",
                    filter === cat.name ? "bg-black/20 text-black" : "bg-sky-500/10 text-sky-500"
                  )}>
                    {count}
                  </span>
                )}
                {cat.name === '2026 Future Mentorship' && (
                  <span className={cn(
                    "w-2 h-2 rounded-full animate-pulse relative z-10",
                    filter === cat.name ? "bg-black" : "bg-sky-500"
                  )} />
                )}
                {filter === cat.name && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-sky-400 to-sky-600 opacity-50"
                  />
                )}
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* Conditional Rendering */}
      {filter === 'ICT Notes' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ICTNotes />
        </motion.div>
      ) : filter === 'PDF' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PDFLibrary />
        </motion.div>
      ) : filter === '2026 Future Mentorship' ? (
        <div className="max-w-5xl space-y-12">
          {/* Featured Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-sky-500/20 via-sky-500/5 to-transparent border border-sky-500/20 p-8 md:p-12"
          >
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-sky-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Featured Course
                </span>
                <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20 rounded-lg animate-pulse">
                  In Progress
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">2026 Future Mentorship Program</h2>
              <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
                Join our most comprehensive mentorship program yet. Live sessions, deep-dive lectures, and real-time market analysis updated weekly.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  <Video className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-white">{FUTURE_MENTORSHIP_VIDEOS.length} Lessons</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-white">Updated Weekly</span>
                </div>
              </div>
            </div>
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-500/20 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Curriculum</h3>
              <p className="text-xs text-neutral-500 font-black uppercase tracking-widest">
                {FUTURE_MENTORSHIP_VIDEOS.length} Recorded Sessions
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {FUTURE_MENTORSHIP_VIDEOS.map((video) => (
                <AccordionItem 
                  key={video.id}
                  title={video.title}
                  description={video.description}
                  url={video.url}
                  isOpen={openVideoId === video.id}
                  onToggle={() => setOpenVideoId(openVideoId === video.id ? null : video.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : filter === 'TTT' ? (
        <div className="max-w-5xl space-y-12">
          {/* TTT Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-sky-500/20 via-sky-500/5 to-transparent border border-sky-500/20 p-8 md:p-12"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-sky-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Mentorship Program
                </span>
                <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20 rounded-lg">
                  Complete Series
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">TTT Mentorship Program</h2>
              <p className="text-lg text-neutral-400 mb-8 leading-relaxed max-w-2xl">
                Master the markets with the TTT path. From basic introduction to advanced volume profile mastery and dynamic setups.
              </p>
              
              {/* Sub-filter Toggle */}
              <div className="flex p-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl w-fit">
                {(['Basic', 'Premium'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setTttSubFilter(sub);
                      setOpenVideoId(null);
                    }}
                    className={cn(
                      "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      tttSubFilter === sub 
                        ? "bg-sky-500 text-black shadow-lg shadow-sky-500/20" 
                        : "text-neutral-500 hover:text-white"
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
          </motion.div>

          {/* TTT Curriculum */}
          <div className="space-y-12">
            {(tttSubFilter === 'Basic' ? TTT_BASIC : TTT_PREMIUM).map((section, sIdx) => {
              const totalVideos = section.videos.length;
              return (
                <div key={section.title} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 font-bold text-xs">
                        0{sIdx + 1}
                      </div>
                      <h3 className="text-xl font-bold text-white">{section.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                      {totalVideos} Videos
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {section.videos.map((video) => (
                      <AccordionItem 
                        key={video.id}
                        title={video.title}
                        description={video.description}
                        url={video.url}
                        isOpen={openVideoId === video.id}
                        onToggle={() => setOpenVideoId(openVideoId === video.id ? null : video.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : filter === 'VIP-1 Courses' ? (
        <div className="max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">VIP-1 Curriculum</h2>
                  <p className="text-neutral-500">Master the basics and build a solid foundation for your trading journey.</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Complete
                </span>
              </div>
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                {VIP1_VIDEOS.length} Videos
              </span>
            </div>
            {VIP1_VIDEOS.map((video) => (
              <AccordionItem 
                key={video.id}
                title={video.title}
                description={video.description}
                url={video.url}
                isOpen={openVideoId === video.id}
                onToggle={() => setOpenVideoId(openVideoId === video.id ? null : video.id)}
              />
            ))}
        </div>
      ) : filter === 'VIP-2 Courses' ? (
        <div className="max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">VIP-2 Advanced Curriculum</h2>
                  <p className="text-neutral-500">Advanced strategies and deep market insights for professional traders.</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Complete
                </span>
              </div>
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                {VIP2_VIDEOS.length} Videos
              </span>
            </div>
            {VIP2_VIDEOS.map((video) => (
              <AccordionItem 
                key={video.id}
                title={video.title}
                description={video.description}
                url={video.url}
                isOpen={openVideoId === video.id}
                onToggle={() => setOpenVideoId(openVideoId === video.id ? null : video.id)}
              />
            ))}
        </div>
      ) : filter === 'Day Trading Strategy' ? (
        <div className="max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Day Trading Strategy</h2>
                  <p className="text-neutral-500">Master the art of intraday trading with our proven strategies.</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Complete
                </span>
              </div>
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                {DAY_TRADING_VIDEOS.length} Videos
              </span>
            </div>
            {DAY_TRADING_VIDEOS.map((video) => (
              <AccordionItem 
                key={video.id}
                title={video.title}
                description={video.description}
                url={video.url}
                isOpen={openVideoId === video.id}
                onToggle={() => setOpenVideoId(openVideoId === video.id ? null : video.id)}
              />
            ))}
        </div>
      ) : filter === 'Introduction about Crypto' ? (
        <div className="max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Introduction about Crypto</h2>
                  <p className="text-neutral-500">Learn the fundamentals of cryptocurrency and blockchain technology.</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Complete
                </span>
              </div>
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                {CRYPTO_INTRO_VIDEOS.length} Videos
              </span>
            </div>
            {CRYPTO_INTRO_VIDEOS.map((video) => (
              <AccordionItem 
                key={video.id}
                title={video.title}
                description={video.description}
                url={video.url}
                isOpen={openVideoId === video.id}
                onToggle={() => setOpenVideoId(openVideoId === video.id ? null : video.id)}
              />
            ))}
        </div>
      ) : filter === 'Fundamental' ? (
        <div className="max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Fundamental Analysis</h2>
                  <p className="text-neutral-500">Understand the economic forces that drive global markets.</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Complete
                </span>
              </div>
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                {FUNDAMENTAL_VIDEOS.length} Videos
              </span>
            </div>
            {FUNDAMENTAL_VIDEOS.map((video) => (
              <AccordionItem 
                key={video.id}
                title={video.title}
                description={video.description}
                url={video.url}
                isOpen={openVideoId === video.id}
                onToggle={() => setOpenVideoId(openVideoId === video.id ? null : video.id)}
              />
            ))}
        </div>
      ) : filter === 'Learn Thai' ? (
        <div className="max-w-5xl space-y-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent border border-emerald-500/20 p-8 md:p-12 text-center"
          >
            <div className="relative z-10 mx-auto max-w-2xl">
              <div className="flex items-center justify-center gap-3 mb-6">
                <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter italic">Learn Thai Language</h2>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Complete
                </span>
              </div>
              <p className="text-lg text-neutral-400 mb-0 leading-relaxed font-medium">
                မြန်မာနိုင်ငံသားများအတွက် မြန်မာဘာသာဖြင့် ထိုင်းဘာသာစကားကို အလွယ်တကူ လေ့လာသင်ယူနိုင်ရန် ဖော်ပြပေးထားသော နေရာဖြစ်ပါသည်။
              </p>
            </div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <PlayCircle className="w-6 h-6 text-emerald-500" />
                Video Lessons
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                {THAI_LANGUAGE_VIDEOS.length} Videos
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {THAI_LANGUAGE_VIDEOS.map((video) => (
                <AccordionItem 
                  key={video.id}
                  title={video.title}
                  description={video.description}
                  url={video.url}
                  isOpen={openVideoId === video.id}
                  onToggle={() => setOpenVideoId(openVideoId === video.id ? null : video.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-[40vh]">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic">{filter}</h2>
                <span className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded text-[10px] font-black uppercase tracking-widest">
                  {filteredResources.length} Resources
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredResources.map((resource) => {
                const youtubeId = getYouTubeId(resource.url);
                
                return (
                  <div key={resource.id} className="group bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden hover:border-sky-500/30 transition-all flex flex-col shadow-sm hover:shadow-xl hover:shadow-sky-500/5">
                    <div className="relative aspect-video bg-[#0a0a0a] overflow-hidden">
                      {youtubeId ? (
                        <div className="w-full h-full relative">
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title={resource.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : resource.thumbnail_url ? (
                        <img 
                          src={resource.thumbnail_url} 
                          alt={resource.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-800">
                          <PlayCircle className="w-16 h-16" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-sky-400 border border-sky-500/20">
                          {resource.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-sky-400 transition-colors line-clamp-1">{resource.title}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-2 mb-8 flex-1 leading-relaxed">{resource.description}</p>
                      
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 w-full py-4 bg-[#0a0a0a] border border-[#262626] hover:bg-sky-500 hover:text-black hover:border-sky-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-all transform group-hover:translate-y-[-2px]"
                      >
                        {youtubeId ? 'Watch on YouTube' : 'View Resource'}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}

              {filteredResources.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#141414] mb-4">
                    <BookOpen className="w-8 h-8 text-neutral-600" />
                  </div>
                  <p className="text-neutral-500 italic">No resources found in this category yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )}
  </div>
);
}
