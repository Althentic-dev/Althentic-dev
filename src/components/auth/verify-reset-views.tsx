"use client";

// VerifyEmailView - ?v=verify&token=... (SPEC-05-02: link 24 jam, bisa kirim ulang)
// ResetPasswordView - ?v=reset&token=... (SPEC-05-03: sekali pakai 1 jam)
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { CircleAlert } from "@/components/animate-ui/icons/circle-alert";
import { KeyRound } from "@/components/animate-ui/icons/key-round";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { MailCheck } from "@/components/animate-ui/icons/mail-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { navigateTo } from "@/lib/router";
import { useAppStore } from "@/lib/store";

export function VerifyEmailView({ token }: { token?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const { user, openAuthDialog } = useAppStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Tautan verifikasi tidak valid.");
      return;
    }
    (async () => {
      try {
        const res = await api<{ email: string }>("/api/auth/verify-email", {
          method: "POST",
          json: { token },
        });
        setState("ok");
        setMessage(`Email ${res.email} berhasil diverifikasi.`);
      } catch (err) {
        setState("error");
        setMessage((err as Error).message);
      }
    })();
  }, [token]);

  const resend = async () => {
    if (!user) {
      openAuthDialog("login", "Masuk dulu untuk kirim ulang tautan verifikasi.");
      return;
    }
    setResending(true);
    try {
      const res = await api<{ devVerifyToken?: string }>("/api/auth/resend-verification", { method: "POST" });
      toast({
        title: "Tautan baru dikirim",
        description: res.devVerifyToken
          ? `Tautan dev: /?v=verify&token=${res.devVerifyToken}`
          : "Cek email kamu (berlaku 24 jam).",
      });
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 text-center"
      >
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-bold">Memverifikasi email…</h1>
          </>
        )}
        {state === "ok" && (
          <>
            <BadgeCheck className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-4 text-xl font-bold">Email terverifikasi</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Checkout pertama kamu sekarang sudah terbuka.
            </p>
            <Button className="mt-6 rounded-full" onClick={() => navigateTo({ v: "catalog" }, { reset: true })}>
              Jelajahi Katalog
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <CircleAlert className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-bold">Verifikasi gagal</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={resend} disabled={resending}>
              {resending && <Loader2 className="h-4 w-4 animate-spin" />}
              <MailCheck className="h-4 w-4" /> Kirim ulang tautan
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export function ResetPasswordView({ token }: { token?: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", json: { token, password } });
      setDone(true);
      toast({
        title: "Password direset",
        description: "Semua session lama sudah diturunkan - silakan masuk kembali.",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="glass-card w-full max-w-md p-8 text-center">
          <BadgeCheck className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="mt-4 text-xl font-bold">Password berhasil direset</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Token sekali-pakai sudah hangus. Masuk kembali dengan password baru.
          </p>
          <Button className="mt-6 rounded-full" onClick={() => navigateTo({ v: "home" }, { reset: true })}>
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="glass-card w-full max-w-md space-y-4 p-8"
      >
        <div className="flex items-center gap-3">
          <span className="bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold">Reset password</h1>
            <p className="text-xs text-muted-foreground">Tautan sekali pakai, berlaku 1 jam.</p>
          </div>
        </div>
        {!token && <p className="text-sm text-destructive">Tautan reset tidak valid.</p>}
        <div className="space-y-1.5">
          <Label htmlFor="rp-pass">Password baru (min. 8 karakter)</Label>
          <Input
            id="rp-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={!token}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rp-confirm">Konfirmasi password</Label>
          <Input
            id="rp-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={!token}
          />
        </div>
        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full rounded-xl" disabled={loading || !token}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Reset Password
        </Button>
      </motion.form>
    </div>
  );
}
