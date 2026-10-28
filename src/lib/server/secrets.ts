/** Resolve server secrets without silently accepting development defaults in production. */
export function getServerSecret(name: string, developmentFallback?: string): string {
  const configured = process.env[name];
  if (configured && configured.trim() === configured && configured.length > 0) {
    const isPlaceholder = /^(replace-with-|change-this-|your-secret)/i.test(configured);
    if (process.env.NODE_ENV !== "production" || (configured !== developmentFallback && !isPlaceholder)) {
      return configured;
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`Konfigurasi ${name} wajib disetel dengan nilai rahasia khusus production.`);
  }

  if (developmentFallback) return developmentFallback;
  throw new Error(`Konfigurasi ${name} wajib disetel.`);
}
