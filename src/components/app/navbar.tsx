"use client";

// =============================================================================
// Navbar - desktop auto-hide saat scroll down / muncul saat scroll up;
// mobile TIDAK auto-hide (sticky + hamburger). Konteks Terkunci DESIGN.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { LogOut } from "@/components/animate-ui/icons/log-out";
import { Menu } from "@/components/animate-ui/icons/menu";
import { Moon } from "@/components/animate-ui/icons/moon";
import { Package } from "@/components/animate-ui/icons/package";
import { Settings } from "@/components/animate-ui/icons/settings";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { ShoppingBag } from "@/components/animate-ui/icons/shopping-bag";
import { Store } from "@/components/animate-ui/icons/store";
import { Sun } from "@/components/animate-ui/icons/sun";
import { UserRound } from "@/components/animate-ui/icons/user-round";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { navigateTo } from "@/lib/router";
import { NotificationBell } from "@/components/app/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { label: "Katalog", query: { v: "catalog" } },
  { label: "Generator", query: { v: "generator" } },
  { label: "Dokumentasi", query: { v: "docs" } },
  { label: "Status", query: { v: "status" } },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Ganti mode terang/gelap"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full"
    >
      {/* Ikon dikendalikan CSS tema - tanpa state mounting (hindari mismatch) */}
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
      <Moon className="h-[18px] w-[18px] dark:hidden" />
    </Button>
  );
}

export function Navbar({ activeView }: { activeView: string }) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);
  const { user, openAuthDialog } = useAppStore();

  // Auto-hide hanya untuk navbar desktop (lg+)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const delta = y - lastY.current;
      if (y > 140 && delta > 6) setHidden(true);
      else if (delta < -4 || y <= 140) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  void activeView;
  const go = (query: Record<string, string>) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    navigateTo(query, { reset: true });
  };

  return (
    <header
      className={`nav-auto-hide sticky top-0 z-50 w-full border-b ${
        scrolled ? "glass-strong border-border/60" : "border-transparent bg-transparent"
      } ${hidden ? "lg:nav-hidden" : ""}`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-3">
        {/* Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo({ v: "home" }, { reset: true });
          }}
          className="flex items-center gap-2.5 font-semibold tracking-tight"
          aria-label="Althentic.Dev - beranda"
        >
          <Image
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-xl shadow-lg shadow-black/25"
          />
          <span className="text-[17px] leading-none">
            Althentic<span className="text-primary">.Dev</span>
          </span>
        </a>

        {/* Nav desktop */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={`/?${new URLSearchParams(l.query).toString()}`}
              onClick={go(l.query)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeView === l.query.v
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Aksi kanan */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user && <NotificationBell />}
          {user ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" onClick={() => openAuthDialog("login")}>
                Masuk
              </Button>
              <Button size="sm" className="rounded-full" onClick={() => openAuthDialog("register")}>
                Daftar Gratis
              </Button>
            </div>
          )}
          {/* Hamburger mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Menu mobile (sticky, tidak auto-hide) */}
      {mobileOpen && (
        <nav
          aria-label="Navigasi mobile"
          className="glass-strong lg:hidden border-t border-border/60"
        >
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={`/?${new URLSearchParams(l.query).toString()}`}
                onClick={go(l.query)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                {l.label}
              </a>
            ))}
            {!user && (
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthDialog("login");
                  }}
                >
                  Masuk
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthDialog("register");
                  }}
                >
                  Daftar Gratis
                </Button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function UserMenu() {
  const { user, setUser } = useAppStore();
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
      navigateTo({ v: "home" }, { reset: true });
    }
  };
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 rounded-full pl-1.5 pr-3">
          <span className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">
            {user.name.split(" ")[0]}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            {user.isSuperAdmin && (
              <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                <ShieldCheck className="h-3 w-3" /> Super Admin
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.isSuperAdmin && (
          <DropdownMenuItem onClick={() => navigateTo({ v: "admin" }, { reset: true })}>
            <ShieldCheck className="h-4 w-4" /> Dashboard Super Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigateTo({ v: "orders" }, { reset: true })}>
          <Package className="h-4 w-4" /> Pesanan Saya
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigateTo({ v: "collection" }, { reset: true })}>
          <ShoppingBag className="h-4 w-4" /> Koleksi Saya
        </DropdownMenuItem>
        {user.hasStore ? (
          <DropdownMenuItem onClick={() => navigateTo({ v: "dashboard" }, { reset: true })}>
            <Store className="h-4 w-4" /> Dashboard Seller
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => navigateTo({ v: "onboarding" }, { reset: true })}>
            <Store className="h-4 w-4" /> Buka Toko
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigateTo({ v: "generator" }, { reset: true })}>
          <UserRound className="h-4 w-4" /> Prompt Generator
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigateTo({ v: "settings" }, { reset: true })}>
          <Settings className="h-4 w-4" /> Pengaturan Akun
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
