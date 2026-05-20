"use client";

import { motion } from "framer-motion";
import React from "react";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#14b8a6"];

export const Confetti = React.memo(function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" aria-hidden="true">
      {Array.from({ length: 60 }).map((_, i) => {
        const color = COLORS[i % COLORS.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 2.5;
        const duration = 2.5 + Math.random() * 3;
        const size = 5 + Math.random() * 10;
        const isCircle = Math.random() > 0.5;
        return (
          <motion.div
            key={i}
            className={isCircle ? "absolute rounded-full" : "absolute rounded-sm"}
            style={{
              left: `${left}%`,
              top: -20,
              width: size,
              height: isCircle ? size : size * 0.6,
              backgroundColor: color,
            }}
            initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
            animate={{ y: "110vh", opacity: 0, rotate: 720 + Math.random() * 360, scale: 0.5 }}
            transition={{ duration, delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
});
