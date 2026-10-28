"use client";

// =============================================================================
// AlthenticApp - kerangka SPA (route "/" tunggal di sandbox; navigasi via query).
// Bootstrapping session + notifikasi, navbar auto-hide, footer sticky (mt-auto),
// Lenis smooth scroll, Framer Motion entrance per view.
// =============================================================================

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useAppRouter } from "@/lib/router";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { Navbar } from "@/components/app/navbar";
import { Footer } from "@/components/app/footer";
import { AuthDialog } from "@/components/auth/auth-dialog";
import type { SessionUser } from "@/lib/types";

const viewOptions = { loading: ViewLoading };
const LandingPage = dynamic(() => import("@/components/landing/landing-page").then((m) => m.LandingPage), viewOptions);
const DocsPage = dynamic(() => import("@/components/docs/docs-page").then((m) => m.DocsPage), viewOptions);
const GeneratorPage = dynamic(() => import("@/components/generator/generator-page").then((m) => m.GeneratorPage), viewOptions);
const VerifyEmailView = dynamic(() => import("@/components/auth/verify-reset-views").then((m) => m.VerifyEmailView), viewOptions);
const ResetPasswordView = dynamic(() => import("@/components/auth/verify-reset-views").then((m) => m.ResetPasswordView), viewOptions);
const CatalogView = dynamic(() => import("@/components/catalog/catalog-view").then((m) => m.CatalogView), viewOptions);
const ProductView = dynamic(() => import("@/components/product/product-view").then((m) => m.ProductView), viewOptions);
const StoreView = dynamic(() => import("@/components/store-profile/store-view").then((m) => m.StoreView), viewOptions);
const CheckoutView = dynamic(() => import("@/components/checkout/checkout-view").then((m) => m.CheckoutView), viewOptions);
const OrdersView = dynamic(() => import("@/components/checkout/orders-view").then((m) => m.OrdersView), viewOptions);
const CollectionView = dynamic(() => import("@/components/collection/collection-view").then((m) => m.CollectionView), viewOptions);
const NotificationsView = dynamic(() => import("@/components/notifications/notifications-view").then((m) => m.NotificationsView), viewOptions);
const OnboardingView = dynamic(() => import("@/components/onboarding/onboarding-view").then((m) => m.OnboardingView), viewOptions);
const SellerDashboard = dynamic(() => import("@/components/seller/seller-dashboard").then((m) => m.SellerDashboard), viewOptions);
const AdminDashboard = dynamic(() => import("@/components/admin/admin-dashboard").then((m) => m.AdminDashboard), viewOptions);
const SettingsView = dynamic(() => import("@/components/settings/settings-view").then((m) => m.SettingsView), viewOptions);
const StatusView = dynamic(() => import("@/components/misc/status-view").then((m) => m.StatusView), viewOptions);
const LegalView = dynamic(() => import("@/components/misc/legal-view").then((m) => m.LegalView), viewOptions);
const NotFoundView = dynamic(() => import("@/components/misc/not-found-view").then((m) => m.NotFoundView), viewOptions);

function ViewLoading() {
  return (
    <div className="container-page py-12" role="status" aria-live="polite">
      <span className="text-sm text-muted-foreground">Memuat halaman...</span>
    </div>
  );
}

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
        Althentic. Daftar gratis - verifikasi email hanya perlu sekali sebelum checkout pertama.
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
