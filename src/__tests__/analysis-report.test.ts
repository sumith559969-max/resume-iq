import { describe, expect, it } from "vitest";
import {
  createAnalysisReport,
  sanitizeReportFilename,
} from "../lib/reports/analysis-report";

describe("analysis report generation", () => {
  it("generates a valid non-empty PDF from saved analysis data", async () => {
    const analysis = {
      file_name: "test-resume.pdf",
      created_at: "2026-10-06T10:00:00.000Z",
      score: 82,
      ats_score: 86,
      experience_score: 78,
      skills_score: 84,
      education_score: 80,
      summary:
        "Strong software development resume with relevant technical skills.",
      strengths: [
        "Strong React and TypeScript experience",
        "Clear technical project evidence",
      ],
      weaknesses: [
        "Limited professional experience",
        "Few measurable outcomes",
      ],
      recommendations: [
        "Add measurable results to project descriptions",
        "Include more professional experience where available",
      ],
      job_match_score: null,
      job_description: null,
    };

    const pdf = await createAnalysisReport(analysis);

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("generates a PDF when job-match data is included", async () => {
    const analysis = {
      file_name: "developer-resume.pdf",
      created_at: "2026-10-06T10:00:00.000Z",
      score: 88,
      ats_score: 91,
      experience_score: 85,
      skills_score: 90,
      education_score: 82,
      summary:
        "A strong software developer profile aligned with the supplied role.",
      strengths: [
        "React and TypeScript experience",
        "Relevant software development projects",
      ],
      weaknesses: [
        "Limited leadership experience",
      ],
      recommendations: [
        "Highlight measurable project outcomes",
        "Add evidence of team collaboration",
      ],
      job_match_score: 84,
      job_description:
        "We are looking for a software developer with experience in React and TypeScript.",
    };

    const pdf = await createAnalysisReport(analysis);

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("sanitizes report filenames safely", () => {
    expect(
      sanitizeReportFilename("John Doe - Senior Developer.pdf"),
    ).toBe("ResumeIQ_Report_John_Doe_-_Senior_Developer.pdf");

    expect(
      sanitizeReportFilename("Resume (Final) [2026].pdf"),
    ).toBe("ResumeIQ_Report_Resume_Final_2026.pdf");

    expect(sanitizeReportFilename(".pdf")).toBe(
      "ResumeIQ_Report_CV.pdf",
    );
  });
});