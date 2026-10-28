"use client";

// =============================================================================
// AuthDialog — login/register (SPEC-05-01, SPEC-14-03/05)
// Checkbox ToS + Privacy + usia 17+ wajib saat daftar; konteks checkout
// dipertahankan (dialog, bukan pindah halaman — SPEC-04-01).
// =============================================================================

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hexagon } from "@/components/animate-ui/icons/hexagon";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { Lock } from "@/components/animate-ui/icons/lock";
import { Mail } from "@/components/animate-ui/icons/mail";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { UserRound } from "@/components/animate-ui/icons/user-round";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import type { SessionUser } from "@/lib/types";

export function AuthDialog() {
  const { authDialog, closeAuthDialog, setUser } = useAppStore();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [tos, setTos] = useState(false);
  const [age, setAge] = useState(false);

  useEffect(() => {
    if (authDialog.open) {
      setMode(authDialog.mode);
      setError(null);
      setForgotSent(null);
    }
  }, [authDialog]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await api<{ user: SessionUser; devVerifyToken?: string }>("/api/auth/register", {
          method: "POST",
          json: {
            name,
            email,
            password,
            remember,
            tosAgreed: tos,
            ageAgreed: age,
          },
        });
        setUser(res.user);
        closeAuthDialog();
        toast({
          title: "Akun dibuat",
          description: res.devVerifyToken
            ? "Verifikasi email: tautan dev ditampilkan di Pengaturan Akun (sandbox tanpa SMTP)."
            : "Cek email untuk verifikasi (wajib sebelum checkout pertama).",
        });
      } else {
        const res = await api<{ user: SessionUser }>("/api/auth/login", {
          method: "POST",
          json: { email, password, remember },
        });
        setUser(res.user);
        closeAuthDialog();
        toast({ title: `Selamat datang, ${res.user.name.split(" ")[0]}!` });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      setError("Isi email dulu untuk reset password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ message: string; devResetToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        json: { email },
      });
      setForgotSent(res.devResetToken ? `Tautan reset dev: /?v=reset&token=${res.devResetToken}` : res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "h-11 rounded-xl border-input bg-background/60 pl-10 text-sm transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

  return (
    <Dialog open={authDialog.open} onOpenChange={(v) => !v && closeAuthDialog()}>
      <DialogContent className="glass-strong max-w-md rounded-3xl p-0 overflow-hidden">
        {/* Header brand */}
        <div className="bg-brand-gradient px-6 pb-6 pt-7 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Hexagon className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="text-lg font-semibold">
              Althentic<span className="opacity-80">.Dev</span>
            </span>
          </div>
          <DialogHeader className="mt-4 space-y-1 text-left">
            <DialogTitle className="text-xl font-bold text-white">
              {mode === "login" ? "Masuk ke akunmu" : "Daftar gratis"}
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {mode === "login"
                ? "Email + password, atau lanjutkan dengan Google."
                : "Semua akun otomatis berperan buyer — jadi seller kapan saja tanpa approval."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {/* Toggle mode */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setMode("login")}
            >
              Masuk
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={`rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "register" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setMode("register")}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">Nama lengkap</Label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="auth-name"
                    className={inputCls}
                    placeholder="Nama kamu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  className={inputCls}
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-password">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={forgotPassword}
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-password"
                  type="password"
                  className={inputCls}
                  placeholder={mode === "register" ? "Minimal 8 karakter" : "Password kamu"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "register" ? 8 : 1}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </div>
            </div>

            {forgotSent && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary break-all"
              >
                {forgotSent}
              </motion.p>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="auth-remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <Label htmlFor="auth-remember" className="text-sm font-normal text-muted-foreground">
                Ingat saya di perangkat ini (30 hari)
              </Label>
            </div>

            {mode === "register" && (
              <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/40 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="auth-tos"
                    checked={tos}
                    onCheckedChange={(v) => setTos(v === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="auth-tos" className="text-xs font-normal leading-relaxed text-muted-foreground">
                    Saya menyetujui <span className="font-medium text-foreground">Syarat &amp; Ketentuan</span> dan{" "}
                    <span className="font-medium text-foreground">Kebijakan Privasi</span> Althentic.Dev.
                  </Label>
                </div>
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="auth-age"
                    checked={age}
                    onCheckedChange={(v) => setAge(v === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="auth-age" className="text-xs font-normal leading-relaxed text-muted-foreground">
                    Saya menyatakan berusia minimal <span className="font-medium text-foreground">17 tahun</span>.
                  </Label>
                </div>
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="h-11 w-full rounded-xl font-semibold" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Masuk" : "Buat Akun Gratis"}
            </Button>
          </form>

          {/* Google OAuth (aktif saat deployment — sandbox tanpa kredensial OAuth) */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">atau</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl font-medium"
            onClick={() =>
              toast({
                title: "Lanjutkan dengan Google",
                description:
                  "Login Google aktif pada deployment production (butuh kredensial OAuth). Akun Google & email yang sama akan digabung otomatis.",
              })
            }
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.5 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            Lanjutkan dengan Google
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Data transaksi dienkripsi & bukti transfer disimpan maksimal 90 hari.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
