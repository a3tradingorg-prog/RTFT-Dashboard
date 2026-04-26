import React from 'react';
import { Sparkles, Brain, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { ScrollReveal } from '../components/ScrollReveal';

export default function AISummary() {
  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <ScrollReveal>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">AI Analysis</h1>
            </div>
            <p className="text-neutral-400">System is currently being optimized for production.</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] border border-[#262626] rounded-[32px] p-20 flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="w-20 h-20 bg-amber-500/5 rounded-[24px] flex items-center justify-center border border-amber-500/10">
              <Brain className="w-10 h-10 text-amber-500/40" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">ပြုပြင်နေဆဲ (Under Maintenance)</h2>
              <p className="text-neutral-500 max-w-sm mx-auto leading-relaxed">
                AI Summary လုပ်ဆောင်ချက်အား ပိုမိုကောင်းမွန်အောင် ပြန်လည်ပြုပြင်နေပါသည်။ မကြာမီ ပြန်လည်အသုံးပြုနိုင်ပါမည်။
              </p>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-[#141414] border border-[#262626] rounded-[32px] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-neutral-500" />
              <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest">Server Status</h3>
            </div>
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Maintenance Mode</span>
              </div>
              <p className="text-xs text-amber-200/60 leading-relaxed font-medium">
                စနစ်ပိုင်းဆိုင်ရာ ပိုမိုမြန်ဆန် တိကျစေရန်အတွက် Update ပြုလုပ်နေပါသည်။
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
