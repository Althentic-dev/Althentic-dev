"use client";

// Althentic.Dev - Zustand store global (session, notifikasi, dialog auth)

import { create } from "zustand";
import type { NotificationDTO, SessionUser } from "@/lib/types";

interface AuthDialogState {
  open: boolean;
  mode: "login" | "register";
  message?: string;
}

interface AppState {
  user: SessionUser | null;
  userLoaded: boolean;
  setUser: (u: SessionUser | null) => void;
  notifications: NotificationDTO[];
  unreadCount: number;
  setNotifications: (n: NotificationDTO[]) => void;
  authDialog: AuthDialogState;
  openAuthDialog: (mode: "login" | "register", message?: string) => void;
  closeAuthDialog: () => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  userLoaded: false,
  setUser: (u) =>
    set({
      user: u,
      userLoaded: true,
      notifications: [],
      unreadCount: 0,
    }),
  notifications: [],
  unreadCount: 0,
  setNotifications: (n) =>
    set({ notifications: n, unreadCount: n.filter((x) => !x.readAt).length }),
  authDialog: { open: false, mode: "login" },
  openAuthDialog: (mode, message) => set({ authDialog: { open: true, mode, message } }),
  closeAuthDialog: () => set({ authDialog: { open: false, mode: "login" } }),
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
}));
