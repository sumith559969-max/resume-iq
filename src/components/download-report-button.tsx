"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

const FRIENDLY_ERROR = "We couldn't generate your report right now. Please try again.";

export function DownloadReportButton({ analysisId }: { analysisId: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  async function downloadReport() {
    if (isDownloading) return;

    setIsDownloading(true);
    setError("");
    let objectUrl: string | undefined;

    try {
      const response = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}/report`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok || response.headers.get("content-type")?.split(";")[0] !== "application/pdf") {
        setError(FRIENDLY_ERROR);
        return;
      }

      const pdf = await response.blob();
      if (pdf.size === 0 || pdf.type !== "application/pdf") {
        setError(FRIENDLY_ERROR);
        return;
      }

      const disposition = response.headers.get("content-disposition");
      const fileName = disposition?.match(/filename="([^"]+)"/)?.[1] ?? "ResumeIQ_Report_CV.pdf";
      objectUrl = URL.createObjectURL(pdf);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.style.display = "none";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setError(FRIENDLY_ERROR);
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        className="download-report-button"
        disabled={isDownloading}
        onClick={() => void downloadReport()}
        type="button"
      >
        {isDownloading ? <LoaderCircle className="animate-spin" size={15} aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
        {isDownloading ? "Generating report…" : "Download Report"}
      </button>
      {error && <p className="download-report-error" role="alert">{error}</p>}
    </div>
  );
}