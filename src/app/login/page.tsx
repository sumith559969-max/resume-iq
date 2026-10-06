import type { Metadata } from "next";
import { AuthForm, AuthShell } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in | ResumeIQ",
  description: "Sign in to your ResumeIQ account.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const initialError = params.error === "confirmation"
    ? "We couldn't verify that email link. It may have expired; try registering again or request a fresh confirmation link."
    : params.error === "profile"
      ? "Your email is confirmed, but profile setup couldn't finish. Sign in to retry profile setup."
    : undefined;

  return <AuthShell><AuthForm mode="login" initialError={initialError} /></AuthShell>;
}