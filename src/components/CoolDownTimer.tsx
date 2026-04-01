import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export const CoolDownTimer = ({ lastError }: { lastError: number }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      // Midnight Pacific Time (PDT) is 07:00 UTC
      const reset = new Date();
      reset.setUTCHours(7, 0, 0, 0);
      
      if (now > reset) {
        reset.setUTCDate(reset.getUTCDate() + 1);
      }

      const diff = reset.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-6 bg-amber-500/5 border border-amber-500/20 rounded-[32px] text-center">
      <div className="flex items-center justify-center gap-2 text-amber-500">
        <Zap className="w-4 h-4 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Daily Quota Exhausted</span>
      </div>
      <div className="text-2xl font-black text-white font-mono tracking-tighter">
        {timeLeft}
      </div>
      <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed">
        Next Quota Reset at Midnight Pacific Time
      </p>
    </div>
  );
};
