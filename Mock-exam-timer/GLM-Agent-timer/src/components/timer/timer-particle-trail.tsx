"use client";

import React, { useEffect, useRef } from "react";

interface TimerParticleTrailProps {
  isRunning: boolean;
  stageProgress: number;
  isUrgent: boolean;
  isWarning: boolean;
}

interface Particle {
  angle: number;
  speed: number;
  size: number;
  opacity: number;
  trail: Array<{ x: number; y: number }>;
}

export const TimerParticleTrail = React.memo(function TimerParticleTrail({
  isRunning,
  stageProgress,
  isUrgent,
  isWarning,
}: TimerParticleTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!isRunning) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    // Initialize particles
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 4 }, () => ({
        angle: Math.random() * 360,
        speed: 0.3 + Math.random() * 0.4,
        size: 2 + Math.random() * 2,
        opacity: 0.4 + Math.random() * 0.4,
        trail: [],
      }));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.parentElement?.clientWidth || 280;
    canvas.width = size;
    canvas.height = size;

    const center = size / 2;
    const radius = (size / 320) * 120; // Match SVG radius scale

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      // Speed based on urgency
      const speedMult = isWarning ? 3 : isUrgent ? 2 : 1;

      particlesRef.current.forEach((p) => {
        p.angle += p.speed * speedMult;
        if (p.angle >= 360) p.angle -= 360;

        const rad = ((p.angle - 90) * Math.PI) / 180;
        const x = center + radius * Math.cos(rad);
        const y = center + radius * Math.sin(rad);

        // Add to trail
        p.trail.push({ x, y });
        if (p.trail.length > 8) p.trail.shift();

        // Draw trail
        for (let i = 0; i < p.trail.length; i++) {
          const t = p.trail[i];
          const trailOpacity = (i / p.trail.length) * p.opacity * 0.5;
          const trailSize = p.size * (i / p.trail.length) * 0.6;
          ctx.beginPath();
          ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = isWarning
            ? `rgba(239, 68, 68, ${trailOpacity})`
            : isUrgent
            ? `rgba(245, 158, 11, ${trailOpacity})`
            : `rgba(16, 185, 129, ${trailOpacity})`;
          ctx.fill();
        }

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isWarning
          ? `rgba(239, 68, 68, ${p.opacity})`
          : isUrgent
          ? `rgba(245, 158, 11, ${p.opacity})`
          : `rgba(16, 185, 129, ${p.opacity})`;
        ctx.shadowColor = isWarning
          ? "rgba(239, 68, 68, 0.6)"
          : isUrgent
          ? "rgba(245, 158, 11, 0.6)"
          : "rgba(16, 185, 129, 0.6)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRunning, isUrgent, isWarning]);

  // Reset particles when not running
  useEffect(() => {
    if (!isRunning) {
      particlesRef.current = [];
    }
  }, [isRunning]);

  if (!isRunning) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
});
