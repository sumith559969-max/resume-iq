import Link from "next/link";
import { ArrowRight, FileText, History, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type AnalysisHistoryItem = {
  id: string;
  file_name: string;
  created_at: string;
  score: number;
  job_match_score: number | null;
};

export function DashboardHistorySkeleton() {
  return (
    <section className="history-section" aria-labelledby="history-heading" aria-busy="true">
      <div className="history-heading">
        <div><p className="kicker">Your progress</p><h2 id="history-heading" className="history-title">Recent analyses</h2></div>
      </div>
      <div className="history-skeleton">
        {[0, 1, 2].map((item) => (
          <div key={item} className="history-skeleton-row">
            <div className="history-skeleton-line" style={{ width: "55%" }} />
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">Loading previous analyses</span>
    </section>
  );
}

function formatAnalysisDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export async function DashboardHistory({ userId }: { userId: string }) {
  let analyses: AnalysisHistoryItem[] = [];
  let hasError = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("analyses")
      .select("id,file_name,created_at,score,job_match_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      hasError = true;
    } else {
      analyses = (data ?? []) as AnalysisHistoryItem[];
    }
  } catch {
    hasError = true;
  }

  return (
    <section id="analysis-history" className="history-section" aria-labelledby="history-heading">
      <div className="history-heading">
        <div>
          <p className="kicker"><History size={12} aria-hidden="true" /> Your progress / 02</p>
          <h2 id="history-heading" className="history-title">Recent analyses</h2>
        </div>
        {!hasError && analyses.length > 0 && (
          <span className="history-count">{analyses.length} {analyses.length === 1 ? "saved review" : "saved reviews"}</span>
        )}
      </div>

      {hasError ? (
        <div className="history-error">
          <p role="alert"><RefreshCw size={13} aria-hidden="true" /> We couldn&apos;t load your previous analyses right now. Please try again.</p>
          <Link className="history-retry" href="/dashboard#analysis-history">
            Retry <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      ) : analyses.length === 0 ? (
        <div className="history-empty">
          <div>
            <h3>Your completed reviews will appear here</h3>
            <p>After you analyse a CV, return to its saved assessment from this list.</p>
          </div>
          <Link className="history-cta" href="#cv-upload">
            <FileText size={13} aria-hidden="true" /> Go to CV upload
          </Link>
        </div>
      ) : (
        <ul className="history-list">
          {analyses.map((analysis) => (
            <li key={analysis.id} className="history-row">
                <div className="history-file-wrap">
                  <p className="history-file" title={analysis.file_name}>{analysis.file_name}</p>
                  <p className="history-date">{formatAnalysisDate(analysis.created_at)}</p>
                </div>
                <span className="history-score" aria-label={`Overall score ${analysis.score} out of 100`}>{analysis.score} / 100{analysis.job_match_score !== null && <span className="history-match">MATCH {analysis.job_match_score}</span>}</span>
                <Link aria-label={`View analysis for ${analysis.file_name}`} className="history-view" href={`/analysis/${encodeURIComponent(analysis.id)}`}>
                  View analysis <ArrowRight size={13} aria-hidden="true" />
                </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}