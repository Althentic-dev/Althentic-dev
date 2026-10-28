"use client";

// =============================================================================
// Althentic.Dev - SPA Router (sandbox: seluruh platform hidup di route "/").
// Navigasi berbasis query (?v=view&id=...) memakai History API sehingga:
// - Filter katalog tersimpan di URL & bisa dibagikan (SPEC-03-02)
// - Tombol back browser berfungsi (popstate)
// =============================================================================

import { useCallback, useMemo, useSyncExternalStore } from "react";

export type QueryState = Record<string, string>;

export const NAVIGATE_EVENT = "althentic:navigate";
export const SCROLL_TOP_EVENT = "althentic:scrolltop";

function parseQuery(): QueryState {
  if (typeof window === "undefined") return { v: "home" };
  return parseQueryFromString(window.location.search);
}

function parseQueryFromString(search: string): QueryState {
  const sp = new URLSearchParams(search);
  const q: QueryState = {};
  sp.forEach((v, k) => {
    if (v !== "") q[k] = v;
  });
  return q;
}

export function navigateTo(
  next: Record<string, string | null | undefined>,
  opts?: { replace?: boolean; keepScroll?: boolean; reset?: boolean }
) {
  const current = parseQuery();
  const merged: QueryState = opts?.reset ? {} : { ...current };
  for (const [k, v] of Object.entries(next)) {
    if (v === null || v === undefined || v === "") delete merged[k];
    else merged[k] = String(v);
  }
  // view ganti → parameter lama yang spesifik view dibuang
  if (next.v && next.v !== current.v) {
    const viewScopedKeys = ["id", "tab", "step", "page", "cat", "type", "price", "rating", "sort", "q", "mode"];
    if (opts?.reset || !Object.keys(next).some((k) => ["cat", "type", "price", "rating", "sort", "q", "page"].includes(k))) {
      viewScopedKeys.forEach((k) => {
        if (!(k in next)) delete merged[k];
      });
    }
  }
  const sp = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => sp.set(k, v));
  const qs = sp.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  if (opts?.replace) window.history.replaceState({}, "", url);
  else window.history.pushState({}, "", url);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  if (!opts?.keepScroll) window.dispatchEvent(new Event(SCROLL_TOP_EVENT));
}

// URL adalah external store - subscribe via useSyncExternalStore (juga
// menjaga konsistensi SSR/hydration).
function subscribeUrl(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(NAVIGATE_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(NAVIGATE_EVENT, cb);
  };
}

export function useAppRouter() {
  const search = useSyncExternalStore(
    subscribeUrl,
    () => window.location.search,
    () => ""
  );
  const query = useMemo(() => parseQueryFromString(search), [search]);

  const navigate = useCallback(
    (next: Record<string, string | null | undefined>, opts?: { replace?: boolean; keepScroll?: boolean; reset?: boolean }) => {
      navigateTo(next, opts);
    },
    []
  );

  const view = query.v || "home";
  return { query, view, navigate };
}

export function backOrHome() {
  if (window.history.length > 1) window.history.back();
  else navigateTo({ v: "home" }, { reset: true });
}
