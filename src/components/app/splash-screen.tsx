"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ParticleText = dynamic(
  () => import("@/components/ui/particle-text"),
  {
    ssr: false,
  },
);

const SPLASH_DURATION_MS = 2100;
const FADE_DURATION_MS = 300;

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const fadeDelay = prefersReducedMotion
      ? 0
      : SPLASH_DURATION_MS - FADE_DURATION_MS;
    const hideDelay = prefersReducedMotion ? 80 : SPLASH_DURATION_MS;

    const fadeTimer = window.setTimeout(() => setExiting(true), fadeDelay);
    const hideTimer = window.setTimeout(() => setVisible(false), hideDelay);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-atomic="true"
      aria-label="Memuat Althentic"
      className={`pointer-events-auto fixed inset-0 z-[9999] grid place-items-center bg-background transition-opacity duration-300 motion-reduce:transition-none ${exiting ? "opacity-0" : "opacity-100"}`}
      role="status"
    >
      <ParticleText
        text="Althentic"
        particleSize={2.2}
        density={5}
        color="#3B82F6"
        highlightColor="#93C5FD"
        highlightMode="gradient"
        shape="circle"
        intro="gather"
        scatter={120}
        gatherDuration={1350}
        stagger={180}
        clickBurst={false}
        pointerRepel={0}
        repelRadius={0}
        idleDrift={0}
        trigger="mount"
        fontSize="clamp(3rem, 12vw, 7rem)"
        fontWeight={800}
        fontFamily="inherit"
        glow
        className="h-60 w-full max-w-4xl"
      />
    </div>
  );
}
