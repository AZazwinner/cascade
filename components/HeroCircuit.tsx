"use client";

import { useEffect, useRef } from "react";

const TIER_RGB = ["34,199,138", "76,149,234", "228,119,47"];
const LINE_RGB = "255,255,255";

const SPLIT_T = 0.42;
const EDGE_FADE = 0.1;

interface Stream {
  startY: number;
  branchX: number;
  wobble: number;
  spread: number;
  duration: number;
  phase: number;
}

function makeStreams(count: number): Stream[] {
  return Array.from({ length: count }, (_, i) => ({
    startY: (i + 0.5) / count + (Math.random() - 0.5) * 0.1,
    branchX: 0.3 + Math.random() * 0.25,
    wobble: 16 + Math.random() * 20,
    spread: 0.14 + Math.random() * 0.1,
    duration: 7000 + Math.random() * 5000,
    phase: Math.random() * 12000,
  }));
}

function cubicPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

export function HeroCircuit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const streams = makeStreams(6);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;

    function resize() {
      const rect = canvas!.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    function trunkControlPoints(s: Stream) {
      const y0 = s.startY * height;
      return {
        x0: 0,
        y0,
        x1: s.branchX * width * 0.35,
        y1: y0 + s.wobble,
        x2: s.branchX * width * 0.7,
        y2: y0 - s.wobble * 0.6,
        x3: s.branchX * width,
        y3: y0,
      };
    }

    function branchTargetY(s: Stream, branchIndex: 0 | 1 | 2): number {
      const offsets = [-s.spread, 0, s.spread];
      return (s.startY + offsets[branchIndex]) * height;
    }

    function drawStatic() {
      for (const s of streams) {
        const t = trunkControlPoints(s);

        ctx!.strokeStyle = `rgba(${LINE_RGB},0.13)`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(t.x0, t.y0);
        ctx!.bezierCurveTo(t.x1, t.y1, t.x2, t.y2, t.x3, t.y3);
        ctx!.stroke();

        for (let b = 0; b < 3; b++) {
          const targetY = branchTargetY(s, b as 0 | 1 | 2);
          const midX = t.x3 + (width - t.x3) * 0.5;
          ctx!.strokeStyle = `rgba(${TIER_RGB[b]},0.14)`;
          ctx!.beginPath();
          ctx!.moveTo(t.x3, t.y3);
          ctx!.bezierCurveTo(midX, t.y3, midX, targetY, width, targetY);
          ctx!.stroke();
        }
      }
    }

    function drawPulses(now: number) {
      for (const s of streams) {
        const localT = ((now + s.phase) % s.duration) / s.duration;
        const t = trunkControlPoints(s);

        if (localT < SPLIT_T) {
          const p = localT / SPLIT_T;
          const x = cubicPoint(t.x0, t.x1, t.x2, t.x3, p);
          const y = cubicPoint(t.y0, t.y1, t.y2, t.y3, p);
          const alpha = Math.min(1, localT / 0.06) * 0.55;
          ctx!.fillStyle = `rgba(${LINE_RGB},${alpha})`;
          ctx!.beginPath();
          ctx!.arc(x, y, 2, 0, Math.PI * 2);
          ctx!.fill();
          continue;
        }

        const bp = (localT - SPLIT_T) / (1 - SPLIT_T);
        const fadeIn = Math.min(1, bp / EDGE_FADE);
        const fadeOut = Math.min(1, (1 - bp) / EDGE_FADE);
        const alpha = Math.min(fadeIn, fadeOut) * 0.9;
        if (alpha <= 0.01) continue;

        const midX = t.x3 + (width - t.x3) * 0.5;
        for (let b = 0; b < 3; b++) {
          const targetY = branchTargetY(s, b as 0 | 1 | 2);
          const x = cubicPoint(t.x3, midX, midX, width, bp);
          const y = cubicPoint(t.y3, t.y3, targetY, targetY, bp);
          ctx!.fillStyle = `rgba(${TIER_RGB[b]},${alpha})`;
          ctx!.shadowColor = `rgba(${TIER_RGB[b]},${alpha})`;
          ctx!.shadowBlur = 5;
          ctx!.beginPath();
          ctx!.arc(x, y, 2.25, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      }
    }

    function frame(now: number) {
      ctx!.clearRect(0, 0, width, height);
      drawStatic();
      if (!reduceMotion) drawPulses(now);
      rafId = requestAnimationFrame(frame);
    }

    let rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
    />
  );
}
