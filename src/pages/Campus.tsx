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
import TradeReference from '../components/TradeReference';

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
            <h3 className={cn(
              "font-bold transition-colors text-sm",
              isOpen ? "text-sky-400" : "text-white"
            )}>{title}</h3>
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
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setResources(data);
      }
      setLoading(false);
    };

    fetchResources();
  }, []);

  const categories = [
    '2026 Future Mentorship',
    'VIP-1 Courses', 
    'VIP-2 Courses', 
    'Day Trading Strategy', 
    'Introduction about Crypto',
    'Fundamental',
    'Technical Analysis'
  ];
  
  const filteredResources = resources.filter(r => 
    r.category === filter && 
    (r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-10">
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

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 pb-4 border-b border-[#262626]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setFilter(cat);
              setOpenVideoId(null);
            }}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 relative overflow-hidden group",
              filter === cat 
                ? "bg-sky-500 text-black shadow-xl shadow-sky-500/20 scale-105" 
                : "bg-[#141414] text-neutral-500 hover:text-white border border-[#262626] hover:border-neutral-700"
            )}
          >
            <span className="relative z-10">{cat}</span>
            {cat === '2026 Future Mentorship' && (
              <span className={cn(
                "w-2 h-2 rounded-full animate-pulse relative z-10",
                filter === cat ? "bg-black" : "bg-sky-500"
              )} />
            )}
            {filter === cat && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-sky-400 to-sky-600 opacity-50"
              />
            )}
          </button>
        ))}
      </div>

      {/* Conditional Rendering */}
      {filter === 'Technical Analysis' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TradeReference />
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
      ) : filter === 'VIP-1 Courses' ? (
        <div className="max-w-4xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">VIP-1 Curriculum</h2>
            <p className="text-neutral-500">Master the basics and build a solid foundation for your trading journey.</p>
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">VIP-2 Advanced Curriculum</h2>
            <p className="text-neutral-500">Advanced strategies and deep market insights for professional traders.</p>
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Day Trading Strategy</h2>
            <p className="text-neutral-500">Master the art of intraday trading with our proven strategies.</p>
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Introduction about Crypto</h2>
            <p className="text-neutral-500">Learn the fundamentals of cryptocurrency and blockchain technology.</p>
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Fundamental Analysis</h2>
            <p className="text-neutral-500">Understand the economic forces that drive global markets.</p>
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
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-[40vh]">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
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
          )}
        </>
      )}
    </div>
  );
}
