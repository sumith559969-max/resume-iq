"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "This password reset link is invalid or has expired. Please request a new one.",
        );
      }

      setChecking(false);
    };

    checkSession();
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  if (checking) {
    return (
      <main className="auth-page">
        <div className="auth-shell-content">
          <Link
            href="/"
            className="brand auth-brand"
            aria-label="ResumeIQ home"
          >
            <span className="brand-symbol" aria-hidden="true">
              R
            </span>
            <span>RESUMEIQ</span>
          </Link>

          <section className="auth-panel" aria-live="polite">
            <p className="auth-kicker">Account security</p>

            <h1 className="auth-title">Verifying your link.</h1>

            <p className="auth-copy">
              Verifying your password reset link...
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-shell-content">
        <Link
          href="/"
          className="brand auth-brand"
          aria-label="ResumeIQ home"
        >
          <span className="brand-symbol" aria-hidden="true">
            R
          </span>
          <span>RESUMEIQ</span>
        </Link>

        <section
          className="auth-panel"
          aria-labelledby="reset-password-title"
        >
          <p className="auth-kicker">Account security</p>

          <h1 id="reset-password-title" className="auth-title">
            Reset your password.
          </h1>

          <p className="auth-copy">
            Create a new password for your ResumeIQ account.
          </p>

          {error && (
            <>
              <div className="auth-error" role="alert">
                {error}
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="auth-submit"
              >
                Back to sign in
              </button>
            </>
          )}

          {success && (
            <>
              <div className="auth-confirm-icon" aria-hidden="true">
                ✓
              </div>

              <p className="auth-copy" role="status">
                Password updated successfully. Redirecting you to sign in...
              </p>
            </>
          )}

          {!error && !success && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="password" className="auth-label">
                  New password
                </label>

                <div className="auth-input-wrap">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword" className="auth-label">
                  Confirm password
                </label>

                <div className="auth-input-wrap">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="auth-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-submit"
              >
                {loading ? "Updating password..." : "Update password"}

                {!loading && (
                  <span aria-hidden="true">↗</span>
                )}
              </button>
            </form>
          )}

          {!success && (
            <p className="auth-switch">
              <Link href="/login">← Back to Sign In</Link>
            </p>
          )}

          <p className="auth-footnote">
            <span aria-hidden="true">✓</span>
            Secure password recovery
          </p>
        </section>
      </div>
    </main>
  );
}