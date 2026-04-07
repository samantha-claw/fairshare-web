"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InfiniteSliderProps {
  children: React.ReactNode;
  speed?: number;
  speedOnHover?: number;
  gap?: number;
  className?: string;
}

export function InfiniteSlider({
  children,
  speed = 40,
  speedOnHover = 20,
  gap = 48,
  className,
}: InfiniteSliderProps) {
  // We need to duplicate the content for seamless looping
  const content = children;
  
  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        className="flex"
        animate={{ x: [0, "-50%"] }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          },
        }}
        whileHover={{
          transition: {
            x: {
              duration: speedOnHover,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            },
          },
        }}
        style={{}}
      >
        {/* First set */}
        <div className="flex" style={{ gap: `${gap}px`, paddingRight: `${gap}px` }}>
          {children}
        </div>
        {/* Duplicate for seamless loop */}
        <div className="flex" style={{ gap: `${gap}px`, paddingRight: `${gap}px` }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
