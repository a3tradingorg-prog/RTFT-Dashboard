import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';

export function LoadingState({ message = "Analyzing market data..." }: { message?: string }) {
  const logoUrl = (import.meta as any).env.VITE_SUPABASE_URL 
    ? `${(import.meta as any).env.VITE_SUPABASE_URL}/storage/v1/object/public/brand-assets/logo.jpg`
    : 'https://picsum.photos/seed/trading/200/200';

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 space-y-8">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Pulsing outer rings */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border-2 border-sky-500/30"
        />
        <motion.div 
          animate={{ scale: [1.2, 1.4, 1.2], opacity: [0.2, 0.05, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute inset-x-[-10px] inset-y-[-10px] rounded-full border border-sky-500/20"
        />
        
        {/* Orbiting particles */}
        <div className="absolute inset-0">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
            </motion.div>
          ))}
        </div>

        {/* Center Icons */}
        <div className="relative z-10 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-[#141414] border border-[#262626] rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden"
          >
            <img 
              src={logoUrl} 
              alt="RTFT Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <motion.div 
            animate={{ 
              y: [-5, 5, -5],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20"
          >
            <TrendingUp className="w-4 h-4 text-black" />
          </motion.div>
          
          <motion.div 
            animate={{ 
              x: [-5, 5, -5],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-2 -left-2 w-8 h-8 bg-[#1f1f1f] border border-[#262626] rounded-xl flex items-center justify-center"
          >
            <BarChart2 className="w-4 h-4 text-sky-400" />
          </motion.div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs font-black text-sky-500 uppercase tracking-[0.3em]"
        >
          {message}
        </motion.p>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div 
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              className="w-1 h-1 rounded-full bg-sky-500"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
