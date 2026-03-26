import React from 'react';
import { Brain, Target, Zap, Shield, TrendingUp, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Strategy() {
  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[48px] bg-[#0a0a0a] border border-[#262626] p-12 md:p-20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 rounded-full text-sky-500 text-xs font-black uppercase tracking-[0.2em] mb-8"
          >
            <Brain className="w-4 h-4" />
            Trading Strategy
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.9] mb-8"
          >
            Master Your <span className="text-sky-500">Edge</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-neutral-500 font-medium leading-relaxed"
          >
            Define, refine, and execute your trading plan with surgical precision. 
            Consistency is the bridge between goals and accomplishment.
          </motion.p>
        </div>
      </div>

      {/* Strategy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: Target,
            title: "Setup Definition",
            desc: "Clear entry criteria based on market structure and volume profile.",
            color: "sky"
          },
          {
            icon: Shield,
            title: "Risk Parameters",
            desc: "Defined stop loss and position sizing rules to protect capital.",
            color: "emerald"
          },
          {
            icon: Zap,
            title: "Execution Rules",
            desc: "Step-by-step guide for entering and managing active positions.",
            color: "orange"
          }
        ].map((pillar, i) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className="p-10 bg-[#0a0a0a] border border-[#262626] rounded-[40px] hover:border-sky-500/30 transition-all group"
          >
            <div className={`w-16 h-16 bg-${pillar.color}-500/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
              <pillar.icon className={`w-8 h-8 text-${pillar.color}-500`} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">{pillar.title}</h3>
            <p className="text-neutral-500 font-medium leading-relaxed">{pillar.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Detailed Strategy Content (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-8"
        >
          <div className="p-12 bg-[#0a0a0a] border border-[#262626] rounded-[48px]">
            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-sky-500" />
              Market Context
            </h2>
            <div className="space-y-6">
              <div className="p-6 bg-[#141414] rounded-3xl border border-[#262626]">
                <h4 className="text-sky-500 text-xs font-black uppercase tracking-widest mb-2">Primary Trend</h4>
                <p className="text-neutral-400 font-medium">Identify the higher time frame direction before looking for entries.</p>
              </div>
              <div className="p-6 bg-[#141414] rounded-3xl border border-[#262626]">
                <h4 className="text-sky-500 text-xs font-black uppercase tracking-widest mb-2">Key Levels</h4>
                <p className="text-neutral-400 font-medium">Mark supply/demand zones and previous day's high/low.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-8"
        >
          <div className="p-12 bg-[#0a0a0a] border border-[#262626] rounded-[48px]">
            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
              <BarChart2 className="w-8 h-8 text-emerald-500" />
              Performance Metrics
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-[#141414] rounded-3xl border border-[#262626] text-center">
                <div className="text-4xl font-black text-white mb-2">0%</div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Win Rate</div>
              </div>
              <div className="p-8 bg-[#141414] rounded-3xl border border-[#262626] text-center">
                <div className="text-4xl font-black text-white mb-2">0.0</div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Profit Factor</div>
              </div>
              <div className="p-8 bg-[#141414] rounded-3xl border border-[#262626] text-center">
                <div className="text-4xl font-black text-white mb-2">0</div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Trades</div>
              </div>
              <div className="p-8 bg-[#141414] rounded-3xl border border-[#262626] text-center">
                <div className="text-4xl font-black text-white mb-2">$0</div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Avg. Profit</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Call to Action */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="p-12 bg-sky-500 rounded-[48px] text-center"
      >
        <h2 className="text-4xl font-black text-black mb-4">Ready to refine your edge?</h2>
        <p className="text-sky-900 font-bold text-lg mb-8 max-w-2xl mx-auto">
          The most successful traders are those who treat their strategy like a business. 
          Start documenting your rules today.
        </p>
        <button className="px-12 py-5 bg-black text-white rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
          Edit Strategy Rules
        </button>
      </motion.div>
    </div>
  );
}
