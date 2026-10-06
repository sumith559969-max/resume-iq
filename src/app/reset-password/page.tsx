"use client";

import { useEffect, useState } from "react";
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
          "This password reset link is invalid or has expired. Please request a new one."
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
      <main className="min-h-screen bg-[#f4f1eb] flex items-center justify-center">
        <p className="text-sm text-black/50">
          Verifying your password reset link...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1500px] items-center justify-center rounded-[32px] border border-black/10 bg-[#f8f6f1] px-6 py-12 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-12 text-xs font-medium uppercase tracking-[0.22em] text-black/60"
          >
            ResumeIQ
          </button>

          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-black/40">
            Account security
          </p>

          <h1 className="text-4xl font-light tracking-[-0.04em] text-black sm:text-5xl">
            Reset your password.
          </h1>

          <p className="mt-4 text-sm leading-6 text-black/50">
            Create a new password for your ResumeIQ account.
          </p>

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="mt-8 rounded-2xl border border-black/10 bg-black px-4 py-4 text-sm text-white">
              Password updated successfully. Redirecting you to sign in...
            </div>
          ) : !error ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-black/50"
                >
                  New password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-black/50"
                >
                  Confirm password
                </label>

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
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Updating password..." : "Update password"}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 text-sm font-medium text-black underline underline-offset-4"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </main>
  );
}