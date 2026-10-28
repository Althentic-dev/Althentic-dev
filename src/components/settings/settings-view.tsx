"use client";

// SettingsView — pengaturan akun (SPEC-05-06, SPEC-13-03):
// ubah nama, ganti password, ganti email (re-verifikasi), preferensi notifikasi,
// tema Dark/Light/System, bahasa email ID/EN, hapus akun (soft-delete 30 hari).
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { Bell } from "@/components/animate-ui/icons/bell";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { Mail } from "@/components/animate-ui/icons/mail";
import { Monitor } from "@/components/animate-ui/icons/monitor";
import { Moon } from "@/components/animate-ui/icons/moon";
import { Palette } from "@/components/animate-ui/icons/palette";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Sun } from "@/components/animate-ui/icons/sun";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { UserRound } from "@/components/animate-ui/icons/user-round";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import type { SessionUser } from "@/lib/types";

export function SettingsView() {
  const { user, setUser } = useAppStore();
  const { navigate } = useAppRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [devVerifyToken, setDevVerifyToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const saveName = async () => {
    setLoading("name");
    try {
      await api("/api/account", { method: "PUT", json: { name } });
      setUser({ ...user!, name });
      toast({ title: "Nama diperbarui" });
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const changePassword = async () => {
    setLoading("password");
    try {
      await api("/api/account/password", { method: "PUT", json: { password } });
      setPassword("");
      toast({ title: "Password diganti", description: "Session lain diturunkan demi keamanan." });
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const resendVerification = async () => {
    setLoading("verify");
    try {
      const res = await api<{ devVerifyToken?: string }>("/api/auth/resend-verification", { method: "POST" });
      setDevVerifyToken(res.devVerifyToken ?? null);
      toast({ title: "Tautan verifikasi dikirim", description: "Berlaku 24 jam." });
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const savePrefs = async (patch: Record<string, unknown>) => {
    try {
      await api("/api/account", { method: "PUT", json: patch });
      toast({ title: "Preferensi disimpan" });
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Hapus akun? Akun dinonaktifkan dengan masa tenggang 30 hari, lalu dihapus permanen. Toko/order histori tetap ada (dianonymized) untuk audit; piutang komisi tetap tercatat.")) {
      return;
    }
    try {
      await api("/api/account", { method: "DELETE" });
      setUser(null);
      navigate({ v: "home" }, { reset: true });
      toast({ title: "Akun dijadwalkan untuk dihapus", description: "Masuk dalam 30 hari untuk membatalkan." });
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (!user) {
    return <div className="container-page py-10"><Skeleton className="h-96 rounded-3xl" /></div>;
  }

  return (
    <div className="container-page max-w-2xl py-8 md:py-12">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pengaturan Akun</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

      <div className="mt-8 space-y-6">
        {/* Verifikasi email */}
        {!user.emailVerified && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card border-amber-500/40 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Mail className="h-4 w-4 text-amber-500" /> Verifikasi Email
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Wajib terverifikasi sebelum checkout pertama. Tautan berlaku 24 jam dan bisa dikirim ulang.
            </p>
            {devVerifyToken && (
              <p className="mt-2 break-all rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary">
                Tautan dev (sandbox tanpa SMTP): <a className="underline" href={`/?v=verify&token=${devVerifyToken}`}>verifikasi sekarang</a>
              </p>
            )}
            <Button variant="outline" className="mt-3 rounded-full" onClick={resendVerification} disabled={loading === "verify"}>
              {loading === "verify" && <Loader2 className="h-4 w-4 animate-spin" />} Kirim ulang tautan
            </Button>
          </motion.div>
        )}

        {/* Nama */}
        <section className="glass-card p-5" aria-labelledby="set-nama">
          <h2 id="set-nama" className="flex items-center gap-2 text-sm font-bold">
            <UserRound className="h-4 w-4" /> Nama
          </h2>
          <div className="mt-3 flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" aria-label="Nama" />
            <Button className="h-11 rounded-xl" onClick={saveName} disabled={loading === "name" || name.length < 2}>
              {loading === "name" && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </div>
        </section>

        {/* Password */}
        <section className="glass-card p-5" aria-labelledby="set-pass">
          <h2 id="set-pass" className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4" /> Ganti Password
          </h2>
          <div className="mt-3 flex gap-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password baru (min. 8 karakter)"
              className="h-11 rounded-xl"
              aria-label="Password baru"
            />
            <Button className="h-11 rounded-xl" onClick={changePassword} disabled={loading === "password" || password.length < 8}>
              {loading === "password" && <Loader2 className="h-4 w-4 animate-spin" />} Ganti
            </Button>
          </div>
        </section>

        {/* Tema (SPEC-13-03) */}
        <section className="glass-card p-5" aria-labelledby="set-tema">
          <h2 id="set-tema" className="flex items-center gap-2 text-sm font-bold">
            <Palette className="h-4 w-4" /> Tema Tampilan
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pilih tema">
            {[
              { id: "light", label: "Terang", icon: Sun },
              { id: "dark", label: "Gelap", icon: Moon },
              { id: "system", label: "Sistem", icon: Monitor },
            ].map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={theme === t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-sm font-medium transition-all ${
                  theme === t.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                }`}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Preferensi email */}
        <section className="glass-card p-5" aria-labelledby="set-email">
          <h2 id="set-email" className="flex items-center gap-2 text-sm font-bold">
            <Bell className="h-4 w-4" /> Preferensi Email
          </h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Bahasa email notifikasi</p>
                <p className="text-xs text-muted-foreground">Bahasa untuk semua email transaksi.</p>
              </div>
              <div className="flex rounded-xl bg-muted p-1">
                {["id", "en"].map((l) => (
                  <button
                    key={l}
                    onClick={() => savePrefs({ emailLang: l })}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase transition-all ${
                      l === "id" ? "bg-background shadow-sm" : "text-muted-foreground"
                    }`}
                    aria-pressed={l === "id"}
                  >
                    {l === "id" ? "ID" : "EN"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Email promosi</p>
                <p className="text-xs text-muted-foreground">
                  Bisa dimatikan — email transaksi tetap terkirim.
                </p>
              </div>
              <Switch defaultChecked onCheckedChange={(v) => savePrefs({ promoEmails: v })} aria-label="Email promosi" />
            </div>
          </div>
        </section>

        {/* Hapus akun (soft-delete 30 hari — GAP-17) */}
        <section className="glass-card border-destructive/30 p-5" aria-labelledby="set-hapus">
          <h2 id="set-hapus" className="flex items-center gap-2 text-sm font-bold text-destructive">
            <Trash2 className="h-4 w-4" /> Hapus Akun
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Soft-delete dengan masa tenggang 30 hari (bisa dibatalkan dengan masuk kembali), lalu hard-delete
            permanen. Histori toko/order tetap ada (dianonymized) untuk audit. Piutang komisi tetap tercatat
            meski akun dihapus.
          </p>
          <Button variant="destructive" className="mt-3 rounded-full" onClick={deleteAccount}>
            <Trash2 className="h-4 w-4" /> Hapus Akun Saya
          </Button>
        </section>

        {user.emailVerified && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <BadgeCheck className="h-4 w-4 text-emerald-500" /> Email kamu sudah terverifikasi.
          </p>
        )}
      </div>
    </div>
  );
}
