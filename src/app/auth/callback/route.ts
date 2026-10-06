import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/profile";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const verificationType = request.nextUrl.searchParams.get("type");
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  const requestedDestination = new URL(next, request.nextUrl.origin);
  const destination = next.startsWith("/") && requestedDestination.origin === request.nextUrl.origin
    ? requestedDestination
    : new URL("/dashboard", request.nextUrl.origin);

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }

  const supabase = await createClient();
  const { error: verificationError } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && (verificationType === "signup" || verificationType === "email")
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: verificationType })
      : { error: new Error("Unsupported email confirmation type.") };

  if (verificationError) {
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }

  try {
    await ensureUserProfile(supabase, user);
  } catch {
    return NextResponse.redirect(new URL("/login?error=profile", request.url));
  }

  return NextResponse.redirect(destination);
}