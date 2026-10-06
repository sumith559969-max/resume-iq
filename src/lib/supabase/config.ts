export function getSupabaseConfig() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!configuredUrl || !publishableKey) {
    throw new Error("Supabase URL and publishable key must be configured.");
  }

  let projectOrigin: string;
  try {
    const parsedUrl = new URL(configuredUrl);
    if (parsedUrl.protocol !== "https:") {
      throw new Error("Supabase URL must use HTTPS.");
    }
    projectOrigin = parsedUrl.origin;
  } catch {
    throw new Error("Supabase URL must be a valid HTTPS project URL.");
  }

  return { url: projectOrigin, publishableKey };
}