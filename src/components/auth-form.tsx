"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/profile";

type AuthFormProps = {
  mode: "login" | "register";
  initialError?: string;
};

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "That email and password combination doesn't match. Check your details and try again.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email using the link we sent before signing in.";
  }
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (normalized.includes("password")) {
    return "Please choose a stronger password and try again.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "There have been a few too many attempts. Please wait a moment and try again.";
  }

  return "We couldn't complete that request. Please check your details and try again.";
}

function developmentErrorDetail(error: { message: string; code?: string; status?: number }) {
  if (process.env.NODE_ENV !== "development" || error.message.includes("Development detail:")) {
    return "";
  }

  const metadata = [error.code, error.status ? `HTTP ${error.status}` : undefined]
    .filter(Boolean)
    .join(" | ");

  return `\n\nDevelopment detail: ${metadata ? `${metadata}: ` : ""}${error.message}`;
}

export function AuthForm({ mode, initialError }: AuthFormProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isRegister && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Your passwords don't match. Please check them and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      if (isRegister) {
        const appOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const callbackUrl = new URL("/auth/callback", appOrigin);
        callbackUrl.searchParams.set("next", "/dashboard");

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: callbackUrl.toString(),
          },
        });

        if (signUpError) {
          setError(`${friendlyAuthError(signUpError.message)}${developmentErrorDetail(signUpError)}`);
          return;
        }

        if (data.session && data.user) {
          await ensureUserProfile(supabase, data.user);
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        setConfirmationSent(true);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(`${friendlyAuthError(signInError.message)}${developmentErrorDetail(signInError)}`);
        return;
      }

      if (data.user) {
        await ensureUserProfile(supabase, data.user);
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message.startsWith("Your account is ready,")
            ? caughtError.message
            : `${friendlyAuthError(caughtError.message)}${developmentErrorDetail({ message: caughtError.message })}`
          : "We couldn't complete that request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmationSent) {
    return (
      <section className="auth-panel auth-confirmation" aria-live="polite">
        <div className="auth-confirm-icon">
          <CheckCircle2 size={23} aria-hidden="true" />
        </div>
        <p className="auth-kicker">One quick check</p>
        <h1 className="auth-title">Check your inbox</h1>
        <p className="auth-copy">
          We sent a confirmation link to <span className="break-all font-medium">{email}</span>. Confirm your email to finish creating your account.
        </p>
        <p className="auth-switch">
          Already confirmed? <Link href="/login">Sign in</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <p className="auth-kicker">{isRegister ? "Start with clarity" : "Welcome back"}</p>
      <h1 className="auth-title">{isRegister ? "Create your account" : "Sign in to ResumeIQ"}</h1>
      <p className="auth-copy">
        {isRegister ? "A more confident next move starts here." : "Pick up where your next career move begins."}
      </p>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegister && (
          <div className="auth-field">
            <label className="auth-label" htmlFor="full-name">Full name</label>
            <input
              autoComplete="name"
              className="auth-input"
              id="full-name"
              maxLength={120}
              name="name"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              required
              value={fullName}
            />
          </div>
        )}
        <div className="auth-field">
          <label className="auth-label" htmlFor="email">Email address</label>
          <input
            autoComplete="email"
            className="auth-input"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="auth-input has-toggle"
              id="password"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? "At least 8 characters" : "Your password"}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="auth-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {isRegister ? (
          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm-password">Confirm password</label>
            <input
              autoComplete="new-password"
              className="auth-input"
              id="confirm-password"
              minLength={8}
              name="confirm-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter your password again"
              required
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
            />
          </div>
        ) : (
          <div className="auth-forgot">
            <span aria-label="Password reset is not available yet">Forgot password?</span>
          </div>
        )}
        <button
          className="auth-submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? <LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> : <>{isRegister ? "Create account" : "Sign in"}<ArrowRight className="transition-transform group-hover:translate-x-0.5" size={16} aria-hidden="true" /></>}
        </button>
      </form>

      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "New to ResumeIQ?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-shell-content">
        <Link aria-label="ResumeIQ home" className="workspace-brand auth-brand" href="/">
          <span className="workspace-brand-mark" aria-hidden="true">R</span>
          ResumeIQ
        </Link>
        {children}
        <p className="auth-footnote"><Sparkles size={12} aria-hidden="true" /> Clear feedback for your next career move</p>
      </div>
    </main>
  );
}