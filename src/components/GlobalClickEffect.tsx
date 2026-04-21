import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ClickPulse {
  x: number;
  y: number;
  id: number;
}

export const GlobalClickEffect: React.FC = () => {
  const [pulses, setPulses] = useState<ClickPulse[]>([]);

  const handleClick = useCallback((e: MouseEvent) => {
    const newPulse = {
      x: e.clientX,
      y: e.clientY,
      id: Date.now() + Math.random(),
    };
    
    setPulses((prev) => [...prev, newPulse]);

    // Cleanup after animation
    setTimeout(() => {
      setPulses((prev) => prev.filter(p => p.id !== newPulse.id));
    }, 600);
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [handleClick]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {pulses.map((pulse) => (
          <React.Fragment key={pulse.id}>
            {/* Outer Glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                position: 'absolute',
                left: pulse.x,
                top: pulse.y,
                width: 60,
                height: 60,
                marginLeft: -30,
                marginTop: -30,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)',
              }}
            />
            {/* Star Sparkle */}
            <motion.div
              initial={{ scale: 0, rotate: -45, opacity: 1 }}
              animate={{ scale: 1, rotate: 45, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: 'absolute',
                left: pulse.x,
                top: pulse.y,
                width: 32,
                height: 32,
                marginLeft: -16,
                marginTop: -16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#0ea5e9" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                className="w-full h-full drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]"
              >
                {/* 8-Pronged Star Sparkle */}
                <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
              </svg>
            </motion.div>
          </React.Fragment>
        ))}
      </AnimatePresence>
    </div>
  );
};
