import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  className?: string;
}

export const ScrollReveal = ({ 
  children, 
  width = "100%", 
  delay = 0.2,
  direction = "up",
  distance = 40,
  className
}: ScrollRevealProps) => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <div className={className} style={{ position: "relative", width, overflow: "visible" }}>
      <motion.div
        variants={{
          hidden: { 
            opacity: 0, 
            ...directions[direction]
          },
          visible: { 
            opacity: 1, 
            x: 0, 
            y: 0 
          },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        transition={{ 
          duration: 0.6, 
          delay,
          ease: [0.21, 0.47, 0.32, 0.98] 
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
