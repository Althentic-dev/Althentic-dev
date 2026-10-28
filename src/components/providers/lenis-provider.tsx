"use client";

// Lenis smooth scroll (kriteria wajib #5) + sinkron scroll-to-top saat navigasi.
// respects prefers-reduced-motion (WCAG).

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { SCROLL_TOP_EVENT } from "@/lib/router";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // fallback native scroll

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onScrollTop = () => {
      lenis.scrollTo(0, { immediate: true });
    };
    window.addEventListener(SCROLL_TOP_EVENT, onScrollTop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(SCROLL_TOP_EVENT, onScrollTop);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}

// Anchor scroll halus ke elemen (dipakai landing section link)
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.dispatchEvent(new CustomEvent("althentic:scrollto", { detail: id }));
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
