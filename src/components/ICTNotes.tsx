import React, { useState, useEffect } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { 
  Zap, 
  Clock, 
  Target, 
  Layers, 
  TrendingUp, 
  ArrowRight, 
  Info, 
  Calendar, 
  Activity, 
  Globe, 
  ShieldCheck, 
  MousePointer2, 
  ChevronRight,
  Download,
  Copy,
  Check,
  FileCode,
  Video,
  FileText,
  ExternalLink,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal } from './ScrollReveal';
import { cn } from '../lib/utils';
import FVGChart, { CandlestickData } from './FVGChart';

const SIBI_DATA: CandlestickData[] = [
  { time: '10:00', open: 120, high: 122, low: 115, close: 118 },
  { time: '10:01', open: 118, high: 119, low: 105, close: 106 }, // C1: Low 115
  { time: '10:02', open: 106, high: 107, low: 95, close: 96 },
  { time: '10:03', open: 96, high: 110, low: 95, close: 108 }, // C3: High 110. SIBI: [110, 115]
  { time: '10:04', open: 108, high: 109, low: 102, close: 104 },
];

const BISI_DATA: CandlestickData[] = [
  { time: '11:00', open: 80, high: 85, low: 78, close: 82 },
  { time: '11:01', open: 82, high: 95, low: 81, close: 94 }, // C1: High 95
  { time: '11:02', open: 94, high: 105, low: 93, close: 104 },
  { time: '11:03', open: 104, high: 105, low: 100, close: 102 }, // C3: Low 100. BISI: [95, 100]
  { time: '11:04', open: 102, high: 106, low: 101, close: 105 },
];

const INVERSION_DATA: CandlestickData[] = [
  { time: '09:30', open: 100, high: 105, low: 98, close: 102 },
  { time: '09:31', open: 102, high: 103, low: 95, close: 96 }, // C1: Low 95
  { time: '09:32', open: 96, high: 97, low: 90, close: 91 },
  { time: '09:33', open: 91, high: 92, low: 85, close: 86 }, // C3: High 92. SIBI: [92, 95]
  { time: '09:34', open: 86, high: 88, low: 80, close: 82 }, // HUNT
  { time: '09:35', open: 82, high: 98, low: 81, close: 97 }, // Breakthrough (Close 97 > 95)
  { time: '09:36', open: 97, high: 98, low: 93, close: 94 }, // Retouch (Low 93 is in [92, 95])
  { time: '09:37', open: 94, high: 102, low: 93, close: 101 }, // Continuation
  { time: '09:38', open: 101, high: 105, low: 100, close: 104 },
];

interface SessionInfo {
  name: string;
  time: string;
  liquidity: string[];
  note?: string;
  color: string;
}

const SESSIONS: SessionInfo[] = [
  {
    name: "Asia Session",
    time: "7:00 PM -> 9:00 PM",
    liquidity: ["Yesterday's RTH Closing Price", "NDOPG (4:59 PM -> 6:00 PM)", "REHs/RELs", "Yesterday's AM/PM session 1st P.FVG"],
    color: "sky"
  },
  {
    name: "London Session",
    time: "2:00 AM -> 5:00 AM",
    liquidity: ["Asia Session Liquidity", "London 1st P.FVG (within 30 min)", "REHs/RELs"],
    note: "3:30 AM can be a stop hunt or distribution.",
    color: "emerald"
  },
  {
    name: "Pre NY Session",
    time: "7:00 AM -> 9:29 AM",
    liquidity: ["Asia/London Liquidity", "REHs/RELs after 7:00 AM"],
    note: "High volatility around 8:30 AM.",
    color: "amber"
  },
  {
    name: "NY AM Session",
    time: "9:30 AM -> 11:30 AM",
    liquidity: ["Pre-Market Liquidity", "ORG (Opening Range Gap)", "OR (Opening Range)", "1st P.FVG", "1st Hour Dealing Range"],
    color: "rose"
  },
  {
    name: "PM Session",
    time: "1:30 PM -> 3:30 PM",
    liquidity: ["AM's 1st P.FVG", "PM 1st P.FVG", "REHs/RELs", "All previous session liquidity"],
    color: "violet"
  }
];

const FALLBACK_RTFT_SCRIPT = `//@version=5
indicator("RTFT Time windows", overlay=true)

// Group & Input settings
show_asia     = input.bool(true, "Show Asia Session", group="Time Windows")
asia_time     = input.string("1900-2100", "Asia Hours (NY Time)", group="Time Windows")
asia_color    = input.color(color.new(#0ea5e9, 95), "Asia BG Color", group="Time Windows")

show_london   = input.bool(true, "Show London Session", group="Time Windows")
london_time   = input.string("0200-0500", "London Hours (NY Time)", group="Time Windows")
london_color  = input.color(color.new(#10b981, 95), "London BG Color", group="Time Windows")

show_preny    = input.bool(true, "Show Pre-NY Session", group="Time Windows")
preny_time    = input.string("0700-0930", "Pre-NY Hours (NY Time)", group="Time Windows")
preny_color   = input.color(color.new(#f59e0b, 95), "Pre-NY BG Color", group="Time Windows")

show_nyam     = input.bool(true, "Show NY AM Session", group="Time Windows")
nyam_time     = input.string("0930-1130", "NY AM Hours (NY Time)", group="Time Windows")
nyam_color    = input.color(color.new(#ef4444, 95), "NY AM BG Color", group="Time Windows")

show_pm       = input.bool(true, "Show PM Session", group="Time Windows")
pm_time       = input.string("1330-1530", "PM Hours (NY Time)", group="Time Windows")
pm_color      = input.color(color.new(#8b5cf6, 95), "PM BG Color", group="Time Windows")

// Time-based check (America/New_York is standard)
in_session(sess_time) =>
    not na(time(timeframe.period, sess_time + ":23456", "America/New_York"))

// Background coloring for each session
bgcolor(in_session(asia_time) and show_asia ? asia_color : na, title="Asia Session")
bgcolor(in_session(london_time) and show_london ? london_color : na, title="London Session")
bgcolor(in_session(preny_time) and show_preny ? preny_color : na, title="Pre-NY Session")
bgcolor(in_session(nyam_time) and show_nyam ? nyam_color : na, title="NY AM Session")
bgcolor(in_session(pm_time) and show_pm ? pm_color : na, title="PM Session")
`;

const FALLBACK_SESSION_SCRIPT = `//@version=5
indicator("Session indicator", overlay=true, max_boxes_count=500, max_lines_count=500)

// Inputs
show_asia     = input.bool(true, "Show Asia Session", group="Asia Session")
asia_time     = input.string("1900-0000", "Asia Time Range", group="Asia Session")
asia_color    = input.color(color.new(#0ea5e9, 93), "Asia Box Color", group="Asia Session")

show_london   = input.bool(true, "Show London Session", group="London Session")
london_time   = input.string("0200-0500", "London Time Range", group="London Session")
london_color  = input.color(color.new(#10b981, 93), "London Box Color", group="London Session")

show_ny       = input.bool(true, "Show NY Session", group="NY Session")
ny_time       = input.string("0800-1200", "NY Time Range", group="NY Session")
ny_color      = input.color(color.new(#ef4444, 93), "NY Box Color", group="NY Session")

show_nyop     = input.bool(true, "Show True Day Open (NY Midnight Open)", group="True Day Open")
nyop_color    = input.color(color.white, "NYOP Line Color", group="True Day Open")

// Checking session time
in_session_range(sess_time) =>
    not na(time(timeframe.period, sess_time + ":23456", "America/New_York"))

// Function to draw session boxes
draw_session_box(show, sess_time, sess_color) =>
    var box s_box = na
    in_sess = in_session_range(sess_time) and show
    is_new = in_sess and not in_sess[1]
    
    if is_new
        s_box := box.new(left=bar_index, top=high, right=bar_index, bottom=low, bgcolor=sess_color, border_color=color.new(sess_color, 40), border_style=line.style_solid)
    else if in_sess and not na(s_box)
        box.set_right(s_box, bar_index)
        box.set_top(s_box, math.max(box.get_top(s_box), high))
        box.set_bottom(s_box, math.min(box.get_bottom(s_box), low))

draw_session_box(show_asia, asia_time, asia_color)
draw_session_box(show_london, london_time, london_color)
draw_session_box(show_ny, ny_time, ny_color)

// NY Midnight Open (00:00 New York Time)
var float nyop_price = na
var line nyop_line = na

// Detect 00:00 NY open
ny_midnight = time(timeframe.period, "0000-0005:23456", "America/New_York")
is_new_ny_day = not na(ny_midnight) and na(ny_midnight[1])

if is_new_ny_day
    nyop_price := open
    if show_nyop
        nyop_line := line.new(bar_index, nyop_price, bar_index + 15, nyop_price, color=nyop_color, width=1, style=line.style_dashed)
        label.new(bar_index, nyop_price, "True Day Open (NYOP)", color=color.new(color.black, 100), textcolor=nyop_color, style=label.style_label_lower_left, size=size.small)
else if not na(nyop_line) and show_nyop
    line.set_right(nyop_line, bar_index + 5)
`;

export default function ICTNotes() {
  const [activeSession, setActiveSession] = useState<string>(SESSIONS[0].name);
  const [showSeasonalInfo, setShowSeasonalInfo] = useState(false);
  const [rtftScriptContent, setRtftScriptContent] = useState<string>(FALLBACK_RTFT_SCRIPT);
  const [sessionScriptContent, setSessionScriptContent] = useState<string>(FALLBACK_SESSION_SCRIPT);
  const [downloadingRtft, setDownloadingRtft] = useState(false);
  const [downloadingSession, setDownloadingSession] = useState(false);
  const [copiedRtft, setCopiedRtft] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);
  const [customICTResources, setCustomICTResources] = useState<any[]>([]);

  useEffect(() => {
    const fetchICTResources = async () => {
      try {
        const localResources = JSON.parse(localStorage.getItem('rtft_admin_resources') || '[]');
        const filteredLocal = localResources.filter((r: any) => r.category === 'ICT Notes');

        let dbResources: any[] = [];
        if (isConfigured) {
          const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('category', 'ICT Notes');
          if (!error && data) {
            dbResources = data;
          }
        }

        const merged = [...dbResources];
        filteredLocal.forEach((lr: any) => {
          if (!merged.some(m => m.id === lr.id)) {
            merged.push(lr);
          }
        });
        setCustomICTResources(merged);
      } catch (err) {
        console.warn('Failed to fetch ICT resources:', err);
      }
    };

    fetchICTResources();
  }, []);

  // Dynamically fetch both indicator scripts from user's Supabase bucket
  React.useEffect(() => {
    const fetchOfficialScripts = async () => {
      // 1. Fetch RTFT Time windows
      try {
        const fileUrl = 'https://ewhzqililvghhbhhsosy.supabase.co/storage/v1/object/public/indicator%20scripts/RTFT%20Time%20windows.txt';
        const response = await fetch(`/api/news-proxy?url=${encodeURIComponent(fileUrl)}`);
        if (response.ok) {
          const content = await response.text();
          if (content && content.trim().length > 0 && !content.includes('<!DOCTYPE html>')) {
            setRtftScriptContent(content);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote RTFT script, using fallback:", err);
      }

      // 2. Fetch Session indicator
      try {
        const fileUrl = 'https://ewhzqililvghhbhhsosy.supabase.co/storage/v1/object/public/indicator%20scripts/Session%20indicator.txt';
        const response = await fetch(`/api/news-proxy?url=${encodeURIComponent(fileUrl)}`);
        if (response.ok) {
          const content = await response.text();
          if (content && content.trim().length > 0 && !content.includes('<!DOCTYPE html>')) {
            setSessionScriptContent(content);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote Session script, using fallback:", err);
      }
    };
    fetchOfficialScripts().catch(err => console.error("fetchOfficialScripts error:", err));
  }, []);

  const triggerLocalDownload = (filename: string, contentToDownload: string) => {
    const blob = new Blob([contentToDownload], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadRtft = async () => {
    setDownloadingRtft(true);
    try {
      const fileUrl = 'https://ewhzqililvghhbhhsosy.supabase.co/storage/v1/object/public/indicator%20scripts/RTFT%20Time%20windows.txt';
      const response = await fetch(`/api/news-proxy?url=${encodeURIComponent(fileUrl)}`);
      if (response.ok) {
        const content = await response.text();
        if (content && content.trim().length > 0 && !content.includes('<!DOCTYPE html>')) {
          triggerLocalDownload('RTFT_Time_windows.pine', content);
          return;
        }
      }

      const { data, error } = await supabase.storage
        .from('indicator scripts')
        .download('RTFT Time windows.txt');

      if (error) {
        console.warn("Could not fetch RTFT file from Supabase storage API:", error.message);
        triggerLocalDownload('RTFT_Time_windows.pine', rtftScriptContent);
      } else if (data) {
        const text = await data.text();
        triggerLocalDownload('RTFT_Time_windows.pine', text || rtftScriptContent);
      } else {
        triggerLocalDownload('RTFT_Time_windows.pine', rtftScriptContent);
      }
    } catch (err) {
      console.error("Supabase Storage error:", err);
      triggerLocalDownload('RTFT_Time_windows.pine', rtftScriptContent);
    } finally {
      setDownloadingRtft(false);
    }
  };

  const handleDownloadSession = async () => {
    setDownloadingSession(true);
    try {
      const fileUrl = 'https://ewhzqililvghhbhhsosy.supabase.co/storage/v1/object/public/indicator%20scripts/Session%20indicator.txt';
      const response = await fetch(`/api/news-proxy?url=${encodeURIComponent(fileUrl)}`);
      if (response.ok) {
        const content = await response.text();
        if (content && content.trim().length > 0 && !content.includes('<!DOCTYPE html>')) {
          triggerLocalDownload('Session_indicator.pine', content);
          return;
        }
      }

      const { data, error } = await supabase.storage
        .from('indicator scripts')
        .download('Session indicator.txt');

      if (error) {
        console.warn("Could not fetch Session file from Supabase storage API:", error.message);
        triggerLocalDownload('Session_indicator.pine', sessionScriptContent);
      } else if (data) {
        const text = await data.text();
        triggerLocalDownload('Session_indicator.pine', text || sessionScriptContent);
      } else {
        triggerLocalDownload('Session_indicator.pine', sessionScriptContent);
      }
    } catch (err) {
      console.error("Supabase Storage error:", err);
      triggerLocalDownload('Session_indicator.pine', sessionScriptContent);
    } finally {
      setDownloadingSession(false);
    }
  };

  const handleCopyRtft = () => {
    navigator.clipboard.writeText(rtftScriptContent);
    setCopiedRtft(true);
    setTimeout(() => setCopiedRtft(false), 2000);
  };

  const handleCopySession = () => {
    navigator.clipboard.writeText(sessionScriptContent);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  // Determine current time standard (DST vs ST)
  // DST in US: 2nd Sunday of March to 1st Sunday of Nov
  // For April 4, 2026, it is DST (UTC-4)
  const isDST = true; 

  return (
    <div className="space-y-16 pb-20">
      {/* NY Time Zone Header */}
      <ScrollReveal>
        <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-8 relative group">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-sky-500 uppercase tracking-tighter italic">NY Time Zone</h2>
                <div className="relative">
                  <button 
                    onMouseEnter={() => setShowSeasonalInfo(true)}
                    onMouseLeave={() => setShowSeasonalInfo(false)}
                    onClick={() => setShowSeasonalInfo(!showSeasonalInfo)}
                    className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-black transition-all cursor-help"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  
                  <AnimatePresence>
                    {showSeasonalInfo && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-6 bg-[#1a1a1a] border border-sky-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
                      >
                        <div className="relative z-10">
                          <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3">Seasonal Adjustments</h4>
                          <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            Standard Time (ST) is usually from Nov to March (UTC-5). Daylight Saving Time (DST) is from March to Nov (UTC-4). Algorithms readjust their delivery based on these shifts.
                          </p>
                        </div>
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-r border-b border-sky-500/30 rotate-45" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Standard vs Daylight Savings</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              {/* Standard Card */}
              <div className={cn(
                "p-6 rounded-2xl border transition-all relative overflow-hidden",
                !isDST ? "bg-sky-500/10 border-sky-500/50 shadow-lg shadow-sky-500/10" : "bg-[#0a0a0a] border-[#262626]"
              )}>
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Standard (ST)</span>
                    {!isDST && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                        <span className="text-[8px] font-black text-sky-500 uppercase">Active</span>
                      </div>
                    )}
                  </div>
                  <h3 className={cn("text-2xl font-black", !isDST ? "text-white" : "text-neutral-700")}>UTC-5</h3>
                </div>
              </div>

              {/* Daylight Card */}
              <div className={cn(
                "p-6 rounded-2xl border transition-all relative overflow-hidden",
                isDST ? "bg-sky-500/10 border-sky-500/50 shadow-lg shadow-sky-500/10" : "bg-[#0a0a0a] border-[#262626]"
              )}>
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Daylight (DST)</span>
                    {isDST && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                        <span className="text-[8px] font-black text-sky-500 uppercase">Active</span>
                      </div>
                    )}
                  </div>
                  <h3 className={cn("text-2xl font-black", isDST ? "text-white" : "text-neutral-700")}>UTC-4</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 1. Entry Models Section */}
      <section className="space-y-8">
        <ScrollReveal>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-sky-500" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic">Entry Models</h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "FVG Entry",
              desc: "Entry model using Fair Value Gaps (FVG) to identify market imbalances.",
              icon: Layers,
              color: "sky"
            },
            {
              title: "Time-based Liquidity",
              desc: "Anticipating moves to opposite liquidity after clearing Relative Equal Highs/Lows.",
              icon: Clock,
              color: "emerald"
            },
            {
              title: "Context Decision",
              desc: "Making decisions by considering fresh liquidity and Higher Time Frame (HTF) liquidity.",
              icon: Globe,
              color: "amber"
            },
            {
              title: "HTF Context Filter",
              desc: "Based on Geopolitical data + Economic Data + Price Action confluence.",
              icon: ShieldCheck,
              color: "rose"
            }
          ].map((model, i) => (
            <ScrollReveal key={model.title} delay={i * 0.1}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-4 group hover:border-sky-500/30 transition-all h-full"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  model.color === 'sky' ? "bg-sky-500/10 text-sky-500 group-hover:bg-sky-500 group-hover:text-black" :
                  model.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black" :
                  model.color === 'amber' ? "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black" :
                  "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-black"
                )}>
                  <model.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">{model.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{model.desc}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 2. Trading Sessions Section */}
      <section className="space-y-8">
        <ScrollReveal>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic">Trading Sessions (NY Time)</h2>
          </div>
        </ScrollReveal>

        <div className="bg-[#141414] border border-[#262626] rounded-[32px] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-4 border-r border-[#262626] p-4 space-y-2">
              {SESSIONS.map((session) => (
                <button
                  key={session.name}
                  onClick={() => setActiveSession(session.name)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all group",
                    activeSession === session.name 
                      ? "bg-sky-500 text-black shadow-lg" 
                      : "text-neutral-500 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase tracking-widest">{session.name}</span>
                    <p className={cn(
                      "text-[10px] font-bold",
                      activeSession === session.name ? "text-black/70" : "text-neutral-600"
                    )}>{session.time}</p>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    activeSession === session.name ? "translate-x-1" : "opacity-0"
                  )} />
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8 p-8 md:p-12 bg-[#0a0a0a]/50">
              <AnimatePresence mode="wait">
                {SESSIONS.map((session) => session.name === activeSession && (
                  <motion.div
                    key={session.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-2">
                      <h3 className="text-3xl font-bold text-white">{session.name}</h3>
                      <p className="text-sky-500 font-mono text-sm">{session.time}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Fresh Liquidity Pools</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {session.liquidity.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 bg-[#141414] border border-[#262626] rounded-xl group hover:border-sky-500/30 transition-all">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 group-hover:scale-150 transition-transform" />
                            <span className="text-sm text-neutral-300 font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {session.note && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-4">
                        <Info className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-sm text-neutral-400 italic leading-relaxed">{session.note}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* TradingView Pine Script Indicators Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: RTFT Time windows */}
          <ScrollReveal>
            <div className="h-full bg-gradient-to-br from-[#141414] to-[#0d0d0d] border border-[#262626] hover:border-sky-500/20 rounded-[32px] p-6 md:p-8 space-y-6 transition-all relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/10 transition-colors" />
              <div className="space-y-6 relative z-10 flex-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-500/20">
                      Indicator Tool
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                      Pine Script v5
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic">
                    RTFT Time windows
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                    သင့်ရဲ့ TradingView chart ပေါ်မှာ RTFT (Real Time Frame Trading) ရဲ့ အဓိက Time windows အချိန်အပိုင်းအခြားတွေကို အလိုအလျောက် သတ်မှတ်ပြသပေးမယ့် Indicator Pine Script ဖြစ်ပါတယ်။
                  </p>
                </div>

                <div className="flex flex-row gap-3 w-full">
                  <button
                    onClick={handleDownloadRtft}
                    disabled={downloadingRtft}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-sky-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-sky-400 transition-all shadow-[0_4px_20px_rgba(14,165,233,0.25)] active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {downloadingRtft ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyRtft}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#181818] border border-[#262626] text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-[#1c1c1c] hover:border-[#1c1c1c] transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedRtft ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Script
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instruction Steps */}
              <div className="border-t border-[#262626]/60 pt-6 mt-auto">
                <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-sky-500" />
                  How to use in TradingView (အသုံးပြုနည်း)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { step: "01", text: "Download သို့မဟုတ် Copy နှိပ်ပြီး ကုဒ်များကို ရယူပါ။" },
                    { step: "02", text: "TradingView တွင် 'Pine Editor' Tab ကို ဖွင့်ပါ။" },
                    { step: "03", text: "ကုဒ်ဟောင်းများကို ဖြတ်ပြီး အသစ်ကို Paste လုပ်ပါ။" },
                    { step: "04", text: "'Add to chart' နှိပ်ပြီး အသုံးပြုနိုင်ပါပြီ။" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#0d0d0d]/40 border border-[#262626]/40 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-sky-500 font-mono tracking-widest">{item.step}</span>
                      <p className="text-[11px] text-neutral-400 font-medium leading-tight">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: Session indicator */}
          <ScrollReveal>
            <div className="h-full bg-gradient-to-br from-[#141414] to-[#0d0d0d] border border-[#262626] hover:border-violet-500/20 rounded-[32px] p-6 md:p-8 space-y-6 transition-all relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
              <div className="space-y-6 relative z-10 flex-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                      Classic Tool
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                      Pine Script v5
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic">
                    Session indicator
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                    စတင်သင်ယူစဉ်က အသုံးပြုခဲ့သော Indicator ဖြစ်ပြီး Asia, London, NY Session များကို Box များနှင့်အတူ True Day Open (NY Midnight Open - NYOP) ကိုပါ တပါတည်း ဖော်ပြပေးမှာ ဖြစ်ပါတယ်။
                  </p>
                </div>

                <div className="flex flex-row gap-3 w-full">
                  <button
                    onClick={handleDownloadSession}
                    disabled={downloadingSession}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-violet-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-violet-400 transition-all shadow-[0_4px_20px_rgba(139,92,246,0.25)] active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {downloadingSession ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopySession}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#181818] border border-[#262626] text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-[#1c1c1c] hover:border-[#1c1c1c] transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedSession ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Script
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instruction Steps */}
              <div className="border-t border-[#262626]/60 pt-6 mt-auto">
                <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-violet-500" />
                  How to use in TradingView (အသုံးပြုနည်း)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { step: "01", text: "Download သို့မဟုတ် Copy နှိပ်ပြီး ကုဒ်များကို ရယူပါ။" },
                    { step: "02", text: "TradingView တွင် 'Pine Editor' Tab ကို ဖွင့်ပါ။" },
                    { step: "03", text: "ကုဒ်ဟောင်းများကို ဖြတ်ပြီး အသစ်ကို Paste လုပ်ပါ။" },
                    { step: "04", text: "'Add to chart' နှိပ်ပြီး အသုံးပြုနိုင်ပါပြီ။" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#0d0d0d]/40 border border-[#262626]/40 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-violet-500 font-mono tracking-widest">{item.step}</span>
                      <p className="text-[11px] text-neutral-400 font-medium leading-tight">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. Liquidity Concepts Section */}
      <section className="space-y-12">
        <ScrollReveal>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic">Understand The Liquidity</h2>
          </div>
        </ScrollReveal>

        <div className="space-y-10">
          {/* NDOG & NWOG Card */}
          <ScrollReveal>
            <div className="bg-sky-900/20 border border-sky-500/20 rounded-[32px] md:rounded-[40px] p-6 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Calendar className="w-64 h-64 text-sky-500" />
              </div>
              
              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-widest">NDOG (New Day Opening Gap) & NWOG</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-sky-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Time:</div>
                      <p className="text-lg font-bold text-white ml-2">4:59 PM (Closing) -{">"} 6:00 PM (Opening)</p>
                    </div>

                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-sky-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Definition:</div>
                      <p className="text-sm text-neutral-300 leading-relaxed ml-2">
                        Gaps between previous day's close and next day's open. <span className="text-sky-400 font-bold">NWOG</span> is for the weekend (Friday to Monday). These represent institutional positioning and act as high-probability magnets.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="inline-block px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">How to Apply?</div>
                    <ul className="space-y-4 ml-2">
                      {[
                        "NWOG acts as a weekly magnet for price action.",
                        "NDOG used for daily markups and generating trade ideas.",
                        "Daily gaps stay fresh for about 5 days of trading.",
                        "If gap > 20 points, observe C.E (Consequent Encroachment) level."
                      ].map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm text-neutral-400 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* ORG Card */}
          <ScrollReveal delay={0.1}>
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-[32px] md:rounded-[40px] p-6 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <TrendingUp className="w-64 h-64 text-emerald-500" />
              </div>
              
              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-widest">ORG (Opening Range Gap)</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Time:</div>
                      <p className="text-lg font-bold text-white ml-2">RTH 4:14 PM (Closing) -{">"} RTH 9:30 AM (Opening)</p>
                    </div>

                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Theory:</div>
                      <p className="text-sm text-neutral-300 leading-relaxed ml-2">
                        The gap created between the previous session's RTH close and the current day's RTH open. This gap sets the tone for the morning session.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="inline-block px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Application Rules:</div>
                    <ul className="space-y-4 ml-2">
                      {[
                        "If ORG > 170 points: Trend continuation is highly likely.",
                        "Premium Gap: Anticipate LONG; Discount Gap: Anticipate SHORT.",
                        "If ORG < 75 points: Not tradable (Consolidation risk).",
                        "75 < ORG < 170: 70% probability of trading back to C.E level."
                      ].map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm text-neutral-400 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* OR Card */}
          <ScrollReveal>
            <div className="bg-sky-900/20 border border-sky-500/20 rounded-[32px] md:rounded-[40px] p-6 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Clock className="w-64 h-64 text-sky-500" />
              </div>
              
              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-widest">OR (Opening Range)</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-sky-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Time:</div>
                      <p className="text-lg font-bold text-white ml-2">9:30 AM -{">"} 10:00 AM</p>
                    </div>

                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-sky-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Definition:</div>
                      <p className="text-sm text-neutral-300 leading-relaxed ml-2">
                        Opening Range is distinct from ORG. It defines the High and Low range of the first 30 minutes of the trading day. It represents the initial balance of the market.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="inline-block px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">How to Apply?</div>
                    <ul className="space-y-4 ml-2">
                      {[
                        "After 10:00 AM, monitor the market regime.",
                        "Does it return to the OR for a retest or continue its trend?",
                        "This context is vital for Silver Bullet setups.",
                        "Observe if the OR High/Low acts as support or resistance."
                      ].map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm text-neutral-400 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* 1st Hour Card */}
          <ScrollReveal delay={0.1}>
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-[32px] md:rounded-[40px] p-6 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Target className="w-64 h-64 text-emerald-500" />
              </div>
              
              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-widest">1st Hour Dealing Range</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Time:</div>
                      <p className="text-lg font-bold text-white ml-2">9:30 AM -{">"} 10:30 AM</p>
                    </div>

                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Definition:</div>
                      <p className="text-sm text-neutral-300 leading-relaxed ml-2">
                        The absolute High and Low established during the first 60 minutes of the market opening. It encapsulates the most volatile period of the morning session.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="inline-block px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">How to Apply?</div>
                    <ul className="space-y-4 ml-2">
                      {[
                        "Primarily used for PM session context and lunch hour analysis.",
                        "Look for pullbacks into this range during the lunch hour (12:00 PM - 1:00 PM).",
                        "If the market respects the 1st P.FVG and trades one-sided after 10:30 AM, a return to the 1st Hour Dealing Range often provides a high-probability continuation entry.",
                        "Use it to confirm context for PM session trend continuation."
                      ].map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm text-neutral-400 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* One-Sided Trading Card */}
          <ScrollReveal delay={0.2}>
            <div className="bg-rose-900/20 border border-rose-500/20 rounded-[32px] md:rounded-[40px] p-6 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Zap className="w-64 h-64 text-rose-500" />
              </div>
              
              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-widest">One-Sided Trading</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-rose-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Time:</div>
                      <p className="text-lg font-bold text-white ml-2">9:30 AM -{">"} 10:30 AM</p>
                    </div>

                    <div className="space-y-4">
                      <div className="inline-block px-4 py-1 bg-rose-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">Definition:</div>
                      <p className="text-sm text-neutral-300 leading-relaxed ml-2">
                        Characterized by two distinct behaviors. <span className="text-rose-400 font-bold">Type 1:</span> Market respects the 1st P.FVG as a Breakaway Gap and never returns. <span className="text-rose-400 font-bold">Type 2:</span> Market creates a gap or respects an Inversion FVG for a shallow internal pullback before trending.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="inline-block px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md">How to Apply?</div>
                    <ul className="space-y-4 ml-2">
                      {[
                        "Type 1: High-conviction trend days. Use P/D arrays and follow orderflow.",
                        "Type 1: Do not wait for deep pullbacks; the market is in a hurry.",
                        "Type 2: Focus on the 1st Hour Dealing Range for entry context.",
                        "Type 2: Look for internal pullbacks that respect key imbalances."
                      ].map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm text-neutral-400 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* FVG & Inversion Section */}
          <ScrollReveal>
            <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 md:p-12 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Layers className="w-6 h-6 text-sky-500" />
                    <h3 className="text-xl font-bold text-white">Fair Value Gap (FVG) Liquidity</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-[#0a0a0a] border border-rose-500/20 rounded-2xl space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest">SIBI</h4>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          Sellside Imbalance Buyside Inefficiency. Used for <span className="text-rose-400 font-bold">SHORT</span> opportunities in downtrends.
                        </p>
                      </div>
                      {/* SIBI Dynamic Chart */}
                      <FVGChart 
                        data={SIBI_DATA} 
                        type="SIBI" 
                        height={200}
                        className="shadow-lg"
                      />
                    </div>
                    <div className="p-6 bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest">BISI</h4>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          Buyside Imbalance Sellside Inefficiency. Used for <span className="text-emerald-400 font-bold">LONG</span> opportunities in uptrends.
                        </p>
                      </div>
                      {/* BISI Dynamic Chart */}
                      <FVGChart 
                        data={BISI_DATA} 
                        type="BISI" 
                        height={200}
                        className="shadow-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-bold text-white">Inversion FVG (iFVG)</h3>
                  </div>
                  <div className="space-y-6">
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      When an FVG's original function is broken and it acts as a reference for the opposite direction.
                    </p>
                    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        <MousePointer2 className="w-4 h-4" />
                        <span>Application</span>
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        Often happens after a <span className="text-amber-400 font-bold">Liquidity Hunt (Turtle Soup)</span>. It serves as a powerful reversal pattern confirming the new direction.
                      </p>
                      {/* Dynamic Inversion FVG Chart */}
                      <FVGChart 
                        data={INVERSION_DATA} 
                        type="INVERSION"
                        height={280}
                        className="shadow-2xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Custom Uploaded Admin ICT Resources */}
          {customICTResources.length > 0 && (
            <ScrollReveal>
              <div className="space-y-8 mt-12">
                <div className="flex items-center gap-3">
                  <Video className="w-8 h-8 text-sky-500 animate-pulse" />
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-white">Admin Published Lectures & Cheat Sheets</h3>
                    <p className="text-xs text-neutral-500 uppercase font-bold tracking-widest mt-1">
                      EXCLUSIVE LEARNING MATERIALS & RECENT UPDATES
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customICTResources.map((resource) => {
                    const isVideo = resource.url.includes('youtu.be') || resource.url.includes('youtube.com');
                    return (
                      <motion.div
                        key={resource.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-[#141414] border border-[#262626] hover:border-sky-500/30 rounded-3xl overflow-hidden p-6 flex flex-col justify-between space-y-6 transition-all group relative"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-[10px] font-black uppercase tracking-wider text-sky-400 rounded-lg">
                              {isVideo ? 'VIDEO LECTURE' : 'DOCUMENT / SHEET'}
                            </span>
                            <div className="text-neutral-500 hover:text-sky-400 transition-all">
                              {isVideo ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-2">
                              {resource.title}
                            </h4>
                            {resource.description && (
                              <p className="text-xs text-neutral-500 leading-relaxed mt-2 line-clamp-3">
                                {resource.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#1f1f1f]">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            referrerPolicy="no-referrer"
                            className="flex items-center justify-between w-full px-4 py-2.5 bg-[#1b1b1b] border border-[#262626] hover:border-sky-500/40 hover:bg-sky-500/10 text-xs font-bold text-white hover:text-sky-400 rounded-xl transition-all"
                          >
                            <span className="flex items-center gap-2">
                              {isVideo ? <Play className="w-3.5 h-3.5 fill-current" /> : <Download className="w-3.5 h-3.5" />}
                              {isVideo ? 'Watch Lesson' : 'Open / Download'}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
