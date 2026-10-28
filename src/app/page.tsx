import AlthenticApp from "@/components/app/althentic-app";

// Satu-satunya route halaman yang terlihat user: "/" (sandbox constraint).
// Seluruh platform berjalan sebagai SPA di route ini + API Routes untuk backend.
export default function Page() {
  return <AlthenticApp />;
}
