import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CheckCircle2, CircleAlert, FileText, Lightbulb, Sparkles } from "lucide-react";
import { DashboardActions } from "@/components/dashboard-actions";
import { DownloadReportButton } from "@/components/download-report-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CV Analysis | ResumeIQ",
  description: "Your ResumeIQ CV analysis results.",
};

type AnalysisRow = {
  id: string;
  user_id: string;
  file_name: string;
  created_at: string;
  score: number;
  ats_score: number;
  experience_score: number;
  skills_score: number;
  education_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  job_match_score: number | null;
  job_description: string | null;
};

function scoreLabel(score: number) {
  if (score >= 85) return "Strong foundation";
  if (score >= 70) return "Good potential";
  if (score >= 50) return "Room to strengthen";
  return "Ready for a focused revision";
}

function ScoreMeter({ label, score }: { label: string; score: number }) {
  return (
    <div className="results-score">
      <p className="results-score-label">{label}</p>
      <strong className="results-score-value">{score}</strong>
      <div className="results-score-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
        <i style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default async function AnalysisResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) redirect("/login");

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data, error } = await supabase
    .from("analyses")
    .select("id,user_id,file_name,created_at,score,ats_score,experience_score,skills_score,education_score,summary,strengths,weaknesses,recommendations,job_match_score,job_description")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) notFound();

  const result = data as AnalysisRow;
  const strengths = Array.isArray(result.strengths) ? result.strengths : [];
  const weaknesses = Array.isArray(result.weaknesses) ? result.weaknesses : [];
  const recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];
  const analysisDate = new Date(result.created_at);
  const formattedDate = Number.isNaN(analysisDate.getTime())
    ? "Recently"
    : new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(analysisDate);

  return (
    <main className="results-page">
      <header className="workspace-nav">
        <div className="workspace-nav-inner">
          <Link aria-label="ResumeIQ home" className="workspace-brand" href="/">
            <span className="workspace-brand-mark" aria-hidden="true">R</span><span>ResumeIQ</span>
          </Link>
          <div className="workspace-nav-links">
            <Link href="/dashboard#cv-upload">Analyze</Link>
            <Link href="/dashboard#analysis-history">History</Link>
          </div>
          <DashboardActions />
        </div>
      </header>

      <article className="results-content">
        <Link className="results-back" href="/dashboard">
          <ArrowLeft size={15} aria-hidden="true" /> Back to dashboard
        </Link>

        <div className="results-head">
          <div className="min-w-0">
            <p className="results-eyebrow"><Sparkles size={12} aria-hidden="true" /> ResumeIQ assessment / {formattedDate}</p>
            <h1 className="results-title">Your CV, more clearly seen.</h1>
            <p className="results-subtitle">A practical review of what’s working and where to focus next.</p>
          </div>
          <div className="results-toolbar">
            <div className="results-file">
              <span className="results-file-icon"><FileText size={15} aria-hidden="true" /></span>
              <div className="min-w-0"><p className="results-file-name" title={result.file_name}>{result.file_name}</p><p className="results-file-date">Reviewed {formattedDate}</p></div>
            </div>
            <DownloadReportButton analysisId={result.id} />
          </div>
        </div>

        <section className="results-scores" aria-label="CV scores">
          <div className="results-overall">
            <div>
              <p className="results-overall-label">Resume score</p>
              <p className="results-overall-score">{result.score}</p>
              <p className="results-overall-caption">{scoreLabel(result.score)}</p>
            </div>
            <div className="results-overall-ring" style={{ background: `conic-gradient(#bd9550 ${result.score * 3.6}deg, #ddd9ce ${result.score * 3.6}deg)` }} role="img" aria-label={`Overall score ${result.score} out of 100`}><span>/ 100</span></div>
          </div>
          <ScoreMeter label="ATS readiness" score={result.ats_score} />
          <ScoreMeter label="Experience" score={result.experience_score} />
          <ScoreMeter label="Skills" score={result.skills_score} />
          <ScoreMeter label="Education" score={result.education_score} />
          {result.job_match_score !== null && (
            <ScoreMeter label="Job description match" score={result.job_match_score} />
          )}
        </section>

        <section className="results-block" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="results-block-title"><BadgeCheck size={15} aria-hidden="true" /> Professional assessment</h2>
          <p className="results-summary">{result.summary}</p>
        </section>

        {result.job_description && result.job_match_score !== null && (
          <section className="job-match-panel" aria-labelledby="job-match-heading">
            <div className="job-match-head">
              <div className="min-w-0">
                <h2 id="job-match-heading" className="results-block-title"><BriefcaseBusiness size={15} aria-hidden="true" /> Job Match</h2>
                <p className="results-subtitle">Compared only against evidence in your CV and the requirements you supplied.</p>
              </div>
              <div className="job-match-score" aria-label={`Job match score ${result.job_match_score} out of 100`}><strong>{result.job_match_score}</strong><span>/ 100 match</span></div>
            </div>
            <div className="job-match-grid">
              <div className="min-w-0">
                <h3 className="job-match-subtitle">Relevant evidence in your CV</h3>
                {strengths.length ? <ul className="results-list strength-list">{strengths.map((item, index) => <li key={`match-${index}-${item}`}>{item}</li>)}</ul> : <p className="results-summary">No directly supported matches were identified in the CV.</p>}
              </div>
              <div className="min-w-0">
                <h3 className="job-match-subtitle">Gaps against stated requirements</h3>
                {weaknesses.length ? <ul className="results-list gap-list">{weaknesses.map((item, index) => <li key={`gap-${index}-${item}`}>{item}</li>)}</ul> : <p className="results-summary">No important unsupported requirements were identified.</p>}
              </div>
            </div>
            <blockquote className="job-description-quote">{result.job_description}</blockquote>
          </section>
        )}

        <div className="results-columns results-block">
          <section className="min-w-0" aria-labelledby="strengths-heading">
            <h2 id="strengths-heading" className="results-block-title"><CheckCircle2 size={15} aria-hidden="true" /> What&apos;s working</h2>
            {strengths.length ? <ul className="results-list strength-list">{strengths.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="results-summary">No specific strengths were identified.</p>}
          </section>
          <section className="min-w-0" aria-labelledby="gaps-heading">
            <h2 id="gaps-heading" className="results-block-title"><CircleAlert size={15} aria-hidden="true" /> What needs attention</h2>
            {weaknesses.length ? <ul className="results-list gap-list">{weaknesses.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="results-summary">No significant gaps were identified.</p>}
          </section>
        </div>

        <section className="results-block" aria-labelledby="recommendations-heading">
          <h2 id="recommendations-heading" className="results-block-title"><Lightbulb size={15} aria-hidden="true" /> {result.job_description ? "What to do next for this role" : "What to do next"}</h2>
          {recommendations.length ? <ol className="results-recommendations">{recommendations.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol> : <p className="results-summary">No recommendations were returned.</p>}
        </section>

        <div className="results-footer-action">
          <Link className="button primary" href="/dashboard">
            <ArrowLeft size={15} aria-hidden="true" /> Return to dashboard
          </Link>
        </div>
      </article>
    </main>
  );
}