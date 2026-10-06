import { NextResponse } from "next/server";
import { createAnalysisReport, sanitizeReportFilename, type SavedAnalysisReport } from "@/lib/reports/analysis-report";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const claimedUserId = claims?.claims.sub;

  if (!claimedUserId) {
    return NextResponse.json({ error: "Sign in to download this report." }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== claimedUserId) {
    return NextResponse.json({ error: "This report could not be found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("file_name,created_at,score,ats_score,experience_score,skills_score,education_score,summary,strengths,weaknesses,recommendations,job_match_score,job_description")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "This report could not be found." }, { status: 404 });
  }

  try {
    const pdf = await createAnalysisReport(data as SavedAnalysisReport);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizeReportFilename(data.file_name)}"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "We couldn't generate your report right now. Please try again." }, { status: 500 });
  }
}