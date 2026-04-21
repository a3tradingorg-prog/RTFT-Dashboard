import React, { useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RippleProps {
  color?: string;
  duration?: number;
}

interface RippleCircle {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const Ripple: React.FC<RippleProps> = ({ 
  color = 'rgba(14, 165, 233, 0.3)', 
  duration = 600 
}) => {
  const [ripples, setRipples] = useState<RippleCircle[]>([]);

  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = event.currentTarget.getBoundingClientRect();
    const size = Math.max(container.width, container.height) * 2;
    const x = event.clientX - container.left - size / 2;
    const y = event.clientY - container.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);
  };

  useLayoutEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [ripples, duration]);

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-auto"
      onMouseDown={addRipple}
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000, ease: "easeOut" }}
            style={{
              position: 'absolute',
              top: ripple.y,
              left: ripple.x,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              backgroundColor: color,
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
