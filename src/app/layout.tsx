import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";

// Font: Plus Jakarta Sans di seluruh platform - kriteria wajib DESIGN.md #1.
// Dimuat self-hosted via @fontsource (offline-safe, tanpa CDN eksternal).

export const metadata: Metadata = {
  title: {
    default: "Althentic.Dev - Marketplace Prompt Serbaguna",
    template: "%s · Althentic.Dev",
  },
  description:
    "Marketplace prompt siap pakai untuk website, riset, belajar, konten, dan desain. Beli sekali, eksekusi langsung dengan AI favoritmu.",
  keywords: [
    "Althentic",
    "marketplace prompt",
    "prompt AI",
    "template website",
    "prompt engineering",
    "Indonesia",
  ],
  authors: [{ name: "Althentic.Dev" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Althentic.Dev - Marketplace Prompt Serbaguna",
    description:
      "Dapatkan hasil lebih cepat lewat prompt siap pakai. Pembayaran QR lokal, harga Rupiah.",
    siteName: "Althentic.Dev",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
