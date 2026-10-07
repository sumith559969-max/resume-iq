"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "If an account exists with this email, we’ve sent a password reset link.",
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-shell-content">
        <Link href="/" className="brand auth-brand" aria-label="ResumeIQ home">
          <span className="brand-symbol" aria-hidden="true">
            R
          </span>
          <span>RESUMEIQ</span>
        </Link>

        <section className="auth-panel" aria-labelledby="forgot-password-title">
          <p className="auth-kicker">Account recovery</p>

          <h1 id="forgot-password-title" className="auth-title">
            Forgot your password?
          </h1>

          <p className="auth-copy">
            Enter your email address and we’ll send you a secure link to create
            a new password.
          </p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-confirm-icon" aria-hidden="true">
              ✓
            </div>
          )}

          {message && (
            <p className="auth-copy" role="status">
              {message}
            </p>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">
                  Email address
                </label>

                <div className="auth-input-wrap">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="you@example.com"
                    className="auth-input"
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-submit"
              >
                {loading ? "Sending..." : "Send reset link"}
                {!loading && <span aria-hidden="true">↗</span>}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <Link href="/login">← Back to Sign In</Link>
          </p>

          <p className="auth-footnote">
            <span aria-hidden="true">✓</span>
            Secure password recovery
          </p>
        </section>
      </div>
    </main>
  );
}