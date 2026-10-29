import { Skeleton } from "@/components/ui/skeleton";

export type PageSkeletonVariant =
  | "landing"
  | "docs"
  | "generator"
  | "auth"
  | "catalog"
  | "product"
  | "store"
  | "checkout"
  | "orders"
  | "collection"
  | "notifications"
  | "onboarding"
  | "seller-dashboard"
  | "admin-dashboard"
  | "settings"
  | "status"
  | "legal"
  | "not-found";

function PlaceholderLines({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={index === count - 1 ? "h-4 w-2/3" : "h-4 w-full"} />
      ))}
    </div>
  );
}

function ProductCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-border/60">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardContent({ admin = false }: { admin?: boolean }) {
  return (
    <div className="container-page space-y-7 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: admin ? 4 : 3 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </div>
  );
}

function SkeletonLayout({ variant }: { variant: PageSkeletonVariant }) {
  switch (variant) {
    case "landing":
      return (
        <div className="container-page space-y-12 py-10">
          <div className="grid items-center gap-8 py-12 md:grid-cols-2">
            <div className="space-y-5">
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-10 w-3/5" />
              <PlaceholderLines count={2} />
              <Skeleton className="h-12 w-44 rounded-full" />
            </div>
            <Skeleton className="h-64 rounded-[2rem] md:h-80" />
          </div>
          <ProductCards count={3} />
        </div>
      );
    case "docs":
      return (
        <div className="container-page space-y-8 py-10">
          <Skeleton className="h-10 w-72 max-w-full" />
          <div className="grid gap-8 md:grid-cols-[220px_1fr]">
            <Skeleton className="h-64 rounded-2xl" />
            <div className="space-y-6"><Skeleton className="h-8 w-2/3" /><PlaceholderLines count={7} /></div>
          </div>
        </div>
      );
    case "generator":
      return (
        <div className="container-page space-y-7 py-10">
          <Skeleton className="h-9 w-72 max-w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[28rem] rounded-3xl" />
            <Skeleton className="h-[28rem] rounded-3xl" />
          </div>
        </div>
      );
    case "auth":
      return (
        <div className="container-page flex min-h-[55vh] items-center justify-center py-10">
          <div className="w-full max-w-lg space-y-5 rounded-3xl border border-border/60 p-7">
            <Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      );
    case "catalog":
      return (
        <div className="container-page space-y-7 py-10">
          <div className="space-y-3"><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
          <Skeleton className="h-12 w-full rounded-2xl" />
          <ProductCards />
        </div>
      );
    case "product":
      return (
        <div className="container-page grid gap-8 py-10 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
          <div className="space-y-5"><Skeleton className="h-9 w-4/5" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-12 w-full rounded-2xl" /></div>
        </div>
      );
    case "store":
      return (
        <div className="container-page space-y-8 py-10">
          <Skeleton className="h-48 w-full rounded-3xl md:h-64" />
          <div className="flex items-center gap-4"><Skeleton className="h-20 w-20 rounded-full" /><div className="space-y-3"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-40" /></div></div>
          <ProductCards />
        </div>
      );
    case "checkout":
      return (
        <div className="container-page space-y-7 py-10">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><Skeleton className="h-[30rem] rounded-3xl" /><Skeleton className="h-80 rounded-3xl" /></div>
        </div>
      );
    case "orders":
    case "collection":
      return (
        <div className="container-page space-y-6 py-10">
          <Skeleton className="h-9 w-60" />
          <div className="space-y-4">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-28 rounded-3xl" />)}</div>
        </div>
      );
    case "notifications":
      return (
        <div className="container-page space-y-6 py-10">
          <Skeleton className="h-9 w-64" />
          <div className="space-y-3">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)}</div>
        </div>
      );
    case "onboarding":
      return (
        <div className="container-page space-y-7 py-10">
          <Skeleton className="h-9 w-72 max-w-full" /><Skeleton className="h-96 rounded-3xl" />
        </div>
      );
    case "seller-dashboard":
      return <DashboardContent />;
    case "admin-dashboard":
      return <DashboardContent admin />;
    case "settings":
      return (
        <div className="container-page space-y-6 py-10">
          <Skeleton className="h-9 w-56" /><Skeleton className="h-80 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" />
        </div>
      );
    case "status":
      return (
        <div className="container-page space-y-5 py-10">
          <Skeleton className="h-9 w-64" />
          <div className="space-y-3">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16 rounded-2xl" />)}</div>
        </div>
      );
    case "legal":
      return (
        <div className="container-page max-w-4xl space-y-8 py-10">
          <Skeleton className="h-10 w-2/3" /><PlaceholderLines count={9} />
        </div>
      );
    case "not-found":
      return (
        <div className="container-page flex min-h-[55vh] flex-col items-center justify-center gap-5 py-10">
          <Skeleton className="h-16 w-32" /><Skeleton className="h-6 w-64 max-w-full" /><Skeleton className="h-11 w-40 rounded-full" />
        </div>
      );
  }
}

export function PageSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  return (
    <section role="status" aria-live="polite" aria-busy="true" className="min-h-[45vh]">
      <span className="sr-only">Memuat halaman</span>
      <div aria-hidden="true"><SkeletonLayout variant={variant} /></div>
    </section>
  );
}
