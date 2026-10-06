"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DashboardActions() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setIsSigningOut(true);
    setError("");

    const { error: signOutError } = await createClient().auth.signOut();
    if (signOutError) {
      setError("We couldn't sign you out. Please try again.");
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="logout-button"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
        {isSigningOut ? "Signing out" : "Log out"}
      </button>
      {error && <p className="logout-error" role="alert">{error}</p>}
    </div>
  );
}