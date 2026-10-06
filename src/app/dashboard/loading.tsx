import { DashboardHistorySkeleton } from "@/components/dashboard-history";

export default function DashboardLoading() {
  return (
    <main className="workspace-page">
      <div className="workspace-content" aria-busy="true">
        <div className="history-skeleton-line" style={{ width: 145 }} />
        <div className="history-skeleton-line" style={{ width: "68%", height: 35, marginTop: 38 }} />
        <div className="history-skeleton-line" style={{ width: "52%", marginTop: 13 }} />
        <div className="history-skeleton-line" style={{ width: "100%", height: 220, marginTop: 40, border: "1px solid var(--line)" }} />
        <DashboardHistorySkeleton />
        <span className="sr-only" role="status">Loading your ResumeIQ workspace</span>
      </div>
    </main>
  );
}