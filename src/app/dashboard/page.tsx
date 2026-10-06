import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, History, Sparkles } from "lucide-react";
import { CvUploadWorkspace } from "@/components/cv-upload-workspace";
import { DashboardHistory, DashboardHistorySkeleton } from "@/components/dashboard-history";
import { DashboardActions } from "@/components/dashboard-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your workspace | ResumeIQ",
  description: "Your ResumeIQ CV analysis workspace.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims.sub) {
    redirect("/login");
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/login");
  }

  const metadataName = typeof user.user_metadata.full_name === "string"
    ? user.user_metadata.full_name.trim()
    : "";
  const displayName = metadataName || user.email || "there";

  return (
    <main className="workspace-page">
      <header className="workspace-nav">
        <div className="workspace-nav-inner">
          <Link aria-label="ResumeIQ home" className="workspace-brand" href="/">
            <span className="workspace-brand-mark" aria-hidden="true">R</span><span>ResumeIQ</span>
          </Link>
          <nav className="workspace-nav-links" aria-label="Workspace navigation">
            <a href="#cv-upload">Analyze</a>
            <Link href="/#how-it-works">How it works</Link>
            <a className="workspace-history-link" href="#analysis-history"><History size={12} aria-hidden="true" /> History</a>
          </nav>
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <span className="workspace-email hidden sm:block" title={user.email ?? undefined}>{user.email}</span>
            <DashboardActions />
          </div>
        </div>
      </header>

      <section className="workspace-content">
        <div className="workspace-heading-row">
          <div>
            <p className="workspace-eyebrow"><Sparkles size={13} aria-hidden="true" /> Your workspace / 01</p>
            <div className="min-w-0 flex-1">
              <h1 className="workspace-title">Good to see you, {displayName}</h1>
              <p className="workspace-description">A considered read on your CV can help surface the strengths, gaps, and next edits that matter to your career.</p>
            </div>
          </div>
          <Link className="workspace-home-link" href="/">ResumeIQ home <ArrowUpRight size={13} aria-hidden="true" /></Link>
        </div>

        <div id="cv-upload" className="scroll-mt-6">
          <CvUploadWorkspace />
        </div>
        <Suspense fallback={<DashboardHistorySkeleton />}>
          <DashboardHistory userId={user.id} />
        </Suspense>
      </section>
    </main>
  );
}