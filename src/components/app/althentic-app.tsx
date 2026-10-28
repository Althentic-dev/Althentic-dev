"use client";

// =============================================================================
// AlthenticApp — kerangka SPA (route "/" tunggal di sandbox; navigasi via query).
// Bootstrapping session + notifikasi, navbar auto-hide, footer sticky (mt-auto),
// Lenis smooth scroll, Framer Motion entrance per view.
// =============================================================================

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAppRouter } from "@/lib/router";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { Navbar } from "@/components/app/navbar";
import { Footer } from "@/components/app/footer";
import { AuthDialog } from "@/components/auth/auth-dialog";
import type { SessionUser } from "@/lib/types";

import { LandingPage } from "@/components/landing/landing-page";
import { DocsPage } from "@/components/docs/docs-page";
import { GeneratorPage } from "@/components/generator/generator-page";
import { VerifyEmailView, ResetPasswordView } from "@/components/auth/verify-reset-views";
import { CatalogView } from "@/components/catalog/catalog-view";
import { ProductView } from "@/components/product/product-view";
import { StoreView } from "@/components/store-profile/store-view";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { OrdersView } from "@/components/checkout/orders-view";
import { CollectionView } from "@/components/collection/collection-view";
import { NotificationsView } from "@/components/notifications/notifications-view";
import { OnboardingView } from "@/components/onboarding/onboarding-view";
import { SellerDashboard } from "@/components/seller/seller-dashboard";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { SettingsView } from "@/components/settings/settings-view";
import { StatusView } from "@/components/misc/status-view";
import { LegalView } from "@/components/misc/legal-view";
import { NotFoundView } from "@/components/misc/not-found-view";

export default function AlthenticApp() {
  const { view, query } = useAppRouter();
  const { user, setUser } = useAppStore();

  // Bootstrap session (SPEC-05-07: cookie session 30 hari / 1 hari)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ user: SessionUser | null }>("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const requiresAuth = ["checkout", "orders", "collection", "onboarding", "dashboard", "settings", "notifications"].includes(view);
  const isAdminView = view === "admin";
  const effectiveUser = user;
  const blocked = (requiresAuth || isAdminView) && effectiveUser === null ? null : effectiveUser;

  let content: React.ReactNode;
  let fullBleed = false; // view yang sembunyikan footer (dashboard admin/seller)

  if ((requiresAuth || isAdminView) && effectiveUser === null) {
    content = <NotAuthenticatedView view={view} />;
  } else if (isAdminView && effectiveUser && !effectiveUser.isSuperAdmin) {
    content = <NotFoundView message="Area ini khusus Super-Admin." />;
  } else {
    switch (view) {
      case "home":
        content = <LandingPage />;
        break;
      case "docs":
        content = <DocsPage />;
        break;
      case "generator":
        content = <GeneratorPage />;
        break;
      case "verify":
        content = <VerifyEmailView token={query.token} />;
        break;
      case "reset":
        content = <ResetPasswordView token={query.token} />;
        break;
      case "catalog":
        content = <CatalogView />;
        break;
      case "product":
        content = <ProductView slug={query.id} />;
        break;
      case "store":
        content = <StoreView slug={query.id} />;
        break;
      case "checkout":
        content = <CheckoutView orderId={query.id} />;
        break;
      case "orders":
        content = <OrdersView />;
        break;
      case "collection":
        content = <CollectionView />;
        break;
      case "notifications":
        content = <NotificationsView />;
        break;
      case "onboarding":
        content = <OnboardingView />;
        break;
      case "dashboard":
        // Buyer belum punya toko → arahkan ke onboarding (SPEC-05-05)
        content = effectiveUser && !effectiveUser.hasStore && !effectiveUser.isSuperAdmin ? (
          <OnboardingView />
        ) : (
          <SellerDashboard />
        );
        fullBleed = true;
        break;
      case "admin":
        content = <AdminDashboard />;
        fullBleed = true;
        break;
      case "settings":
        content = <SettingsView />;
        break;
      case "status":
        content = <StatusView />;
        break;
      case "legal":
        content = <LegalView doc={query.doc || "tos"} />;
        break;
      default:
        content = <NotFoundView />;
    }
  }
  void blocked;

  return (
    <LenisProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar activeView={view} />
        <main id="main" className="flex-1">
          <motion.div
            key={view + (query.id ?? "") + (query.tab ?? "")}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {content}
          </motion.div>
        </main>
        {!fullBleed && <Footer />}
        <AuthDialog />
      </div>
    </LenisProvider>
  );
}

function NotAuthenticatedView({ view }: { view: string }) {
  const { openAuthDialog } = useAppStore();
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-bold">Masuk dulu untuk melanjutkan</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Halaman <span className="font-medium text-foreground">{view}</span> membutuhkan akun
        Althentic. Daftar gratis — verifikasi email hanya perlu sekali sebelum checkout pertama.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          onClick={() => openAuthDialog("login")}
        >
          Masuk
        </button>
        <button
          className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold"
          onClick={() => openAuthDialog("register")}
        >
          Daftar Gratis
        </button>
      </div>
    </div>
  );
}
