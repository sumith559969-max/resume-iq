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
      }
    );

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "If an account exists with this email, we’ve sent a password reset link."
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f1ec] px-4 py-4 sm:px-6 sm:py-6">
      <div className="relative min-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-black/[0.08] bg-[#f8f7f3] sm:min-h-[calc(100vh-3rem)] sm:rounded-[36px]">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#e8c66a]/20 blur-3xl" />

        {/* Navigation */}
        <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
          <Link
            href="/"
            className="text-[13px] font-semibold tracking-[-0.02em] text-[#111111]"
          >
            RESUMEIQ
          </Link>

          <Link
            href="/login"
            className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 transition-colors hover:text-black"
          >
            Sign in
          </Link>
        </header>

        {/* Main content */}
        <section className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[440px]">
            {/* Heading */}
            <div className="mb-10 text-center">
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-black/35">
                Account recovery
              </p>

              <h1 className="text-[38px] font-medium leading-[1.05] tracking-[-0.055em] text-[#111111] sm:text-[46px]">
                Forgot your password?
              </h1>

              <p className="mx-auto mt-5 max-w-[360px] text-[14px] leading-6 text-black/48">
                Enter your email address and we’ll send you a secure link to
                create a new password.
              </p>
            </div>

            {/* Form card */}
            <div className="rounded-[24px] border border-black/[0.08] bg-white/65 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.045)] backdrop-blur-sm sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-[52px] w-full rounded-[14px] border border-black/[0.10] bg-[#fafaf8] px-4 text-[14px] text-[#111111] outline-none transition-all placeholder:text-black/25 focus:border-black/25 focus:bg-white focus:ring-4 focus:ring-black/[0.025]"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-[14px] border border-red-200/80 bg-red-50/70 px-4 py-3 text-[13px] leading-5 text-red-700">
                    {error}
                  </div>
                )}

                {/* Success */}
                {message && (
                  <div className="rounded-[14px] border border-black/[0.08] bg-[#f5f4ef] px-4 py-3 text-[13px] leading-5 text-black/65">
                    {message}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#111111] text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-200 hover:bg-black hover:shadow-[0_10px_30px_rgba(0,0,0,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    {loading ? "Sending..." : "Send reset link"}
                  </span>

                  {!loading && (
                    <span className="text-base transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-7 border-t border-black/[0.07] pt-6 text-center">
                <Link
                  href="/login"
                  className="text-[12px] font-medium text-black/45 underline-offset-4 transition-colors hover:text-black hover:underline"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </div>

            {/* Bottom note */}
            <p className="mt-7 text-center text-[10px] uppercase tracking-[0.14em] text-black/25">
              Secure password recovery
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}