import "server-only";

import PDFDocument from "pdfkit";

export type SavedAnalysisReport = {
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

const PAGE_MARGIN = 54;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const HEADER_RULE_Y = 45;
const FOOTER_RULE_Y = PAGE_HEIGHT - PAGE_MARGIN - 24;
const FOOTER_TEXT_Y = PAGE_HEIGHT - PAGE_MARGIN - 14;
const CONTENT_BOTTOM = FOOTER_RULE_Y - 16;

const colors = {
  navy: "#13233B",
  body: "#334155",
  muted: "#64748B",
  cyan: "#168AA5",
  line: "#D9E2EC",
  pale: "#F1F7FA",
  green: "#147D69",
  amber: "#94621A",
  violet: "#5B5AA7",
};

function printableText(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(date);
}

function addPageFrame(doc: PDFKit.PDFDocument) {
  const pageNumber = doc.bufferedPageRange().count;
  const originalY = doc.y;
  doc.save();
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted);
  doc.text("ResumeIQ  |  AI Resume Assessment Report", PAGE_MARGIN, 29, {
    width: CONTENT_WIDTH,
    lineBreak: false,
  });
  doc.moveTo(PAGE_MARGIN, HEADER_RULE_Y).lineTo(PAGE_WIDTH - PAGE_MARGIN, HEADER_RULE_Y).lineWidth(0.6).strokeColor(colors.line).stroke();
  doc.moveTo(PAGE_MARGIN, FOOTER_RULE_Y).lineTo(PAGE_WIDTH - PAGE_MARGIN, FOOTER_RULE_Y).lineWidth(0.6).strokeColor(colors.line).stroke();
  doc.text("Private report · Generated from your saved ResumeIQ assessment", PAGE_MARGIN, FOOTER_TEXT_Y, {
    width: CONTENT_WIDTH - 50,
    lineBreak: false,
  });
  doc.text(String(pageNumber), PAGE_WIDTH - PAGE_MARGIN - 30, FOOTER_TEXT_Y, {
    width: 30,
    align: "right",
    lineBreak: false,
  });
  doc.restore();
  doc.y = originalY;
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > CONTENT_BOTTOM) {
    doc.addPage();
    addPageFrame(doc);
    doc.y = PAGE_MARGIN + 12;
  }
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string, accent = colors.cyan) {
  ensureSpace(doc, 48);
  doc.moveTo(PAGE_MARGIN, doc.y + 5).lineTo(PAGE_MARGIN + 3, doc.y + 5).lineWidth(3).strokeColor(accent).stroke();
  doc.font("Helvetica-Bold").fontSize(13).fillColor(colors.navy).text(title, PAGE_MARGIN + 12, doc.y - 2, {
    width: CONTENT_WIDTH - 12,
  });
  doc.moveDown(0.75);
}

function addParagraph(doc: PDFKit.PDFDocument, text: string, options?: { color?: string; fontSize?: number; indent?: number }) {
  const clean = printableText(text);
  if (!clean) return;

  const fontSize = options?.fontSize ?? 10;
  const indent = options?.indent ?? 0;
  doc.font("Helvetica").fontSize(fontSize);
  const height = doc.heightOfString(clean, { width: CONTENT_WIDTH - indent, lineGap: 3 }) + 6;
  ensureSpace(doc, Math.min(height, CONTENT_BOTTOM - PAGE_MARGIN));
  doc.fillColor(options?.color ?? colors.body).text(clean, PAGE_MARGIN + indent, doc.y, {
    width: CONTENT_WIDTH - indent,
    lineGap: 3,
    paragraphGap: 3,
  });
  doc.moveDown(0.35);
}

function addBullets(doc: PDFKit.PDFDocument, items: string[], markerColor: string, numbered = false) {
  const cleanItems = items.map(printableText).filter(Boolean);
  cleanItems.forEach((item, index) => {
    doc.font("Helvetica").fontSize(10);
    const bodyWidth = CONTENT_WIDTH - 28;
    const textHeight = doc.heightOfString(item, { width: bodyWidth, lineGap: 3 });
    ensureSpace(doc, textHeight + 12);
    const top = doc.y;
    if (numbered) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.cyan).text(`${String(index + 1).padStart(2, "0")}`, PAGE_MARGIN, top, {
        width: 22,
        lineBreak: false,
      });
    } else {
      doc.circle(PAGE_MARGIN + 4, top + 5, 2.2).fill(markerColor);
    }
    doc.font("Helvetica").fontSize(10).fillColor(colors.body).text(item, PAGE_MARGIN + 25, top, {
      width: bodyWidth,
      lineGap: 3,
    });
    doc.y = Math.max(doc.y, top + textHeight) + 10;
  });
}

function addScoreCard(doc: PDFKit.PDFDocument, x: number, y: number, width: number, label: string, score: number, accent: string) {
  const height = 64;
  doc.roundedRect(x, y, width, height, 6).fillAndStroke(colors.pale, colors.line);
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(label, x + 10, y + 10, {
    width: width - 20,
    height: 20,
    ellipsis: true,
  });
  doc.font("Helvetica-Bold").fontSize(19).fillColor(accent).text(String(score), x + 10, y + 31, { lineBreak: false });
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("/ 100", x + 39, y + 40, { lineBreak: false });
}

export function createAnalysisReport(analysis: SavedAnalysisReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: PAGE_MARGIN + 12, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      bufferPages: true,
      info: {
        Title: "AI Resume Assessment Report",
        Author: "ResumeIQ",
        Subject: `Assessment for ${printableText(analysis.file_name)}`,
      },
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    addPageFrame(doc);
    doc.y = PAGE_MARGIN + 16;

    doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.cyan).text("ResumeIQ", PAGE_MARGIN, doc.y, { lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("CAREER CLARITY, BUILT AROUND YOU", PAGE_WIDTH - PAGE_MARGIN - 210, doc.y + 2, {
      width: 210,
      align: "right",
      lineBreak: false,
    });
    doc.moveDown(1.8);
    doc.font("Helvetica-Bold").fontSize(23).fillColor(colors.navy).text("AI Resume Assessment Report", PAGE_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      lineGap: 2,
    });
    doc.moveDown(0.5);

    const filename = printableText(analysis.file_name) || "CV file";
    doc.font("Helvetica").fontSize(10).fillColor(colors.body).text(filename, PAGE_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      lineGap: 2,
    });
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(9).fillColor(colors.muted).text(`Analysis date: ${formatDate(analysis.created_at)}`, PAGE_MARGIN, doc.y);
    doc.moveDown(1.2);

    const scoreCount = analysis.job_match_score === null ? 5 : 6;
    const gap = 8;
    const cardWidth = (CONTENT_WIDTH - gap * (scoreCount - 1)) / scoreCount;
    const scoreCards: Array<{ label: string; score: number; accent: string }> = [
      { label: "Overall score", score: analysis.score, accent: colors.navy },
      { label: "ATS readiness", score: analysis.ats_score, accent: colors.cyan },
      { label: "Experience", score: analysis.experience_score, accent: colors.navy },
      { label: "Skills", score: analysis.skills_score, accent: colors.navy },
      { label: "Education", score: analysis.education_score, accent: colors.navy },
    ];
    if (analysis.job_match_score !== null) {
      scoreCards.push({ label: "Job match", score: analysis.job_match_score, accent: colors.violet });
    }

    const cardsY = doc.y + 5;
    scoreCards.forEach((card, index) => {
      addScoreCard(doc, PAGE_MARGIN + index * (cardWidth + gap), cardsY, cardWidth, card.label, card.score, card.accent);
    });
    doc.y = cardsY + 80;

    addSectionTitle(doc, "Professional summary");
    addParagraph(doc, analysis.summary, { fontSize: 10.5 });

    if (analysis.job_description && analysis.job_match_score !== null) {
      addSectionTitle(doc, "Job Match", colors.violet);
      doc.roundedRect(PAGE_MARGIN, doc.y, 112, 48, 6).fillAndStroke(colors.pale, colors.line);
      doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("JOB MATCH SCORE", PAGE_MARGIN + 10, doc.y + 8, { lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(19).fillColor(colors.violet).text(String(analysis.job_match_score), PAGE_MARGIN + 10, doc.y + 22, { lineBreak: false });
      doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("/ 100", PAGE_MARGIN + 39, doc.y + 31, { lineBreak: false });
      doc.y += 60;

      addParagraph(doc, "Compared with the job description supplied for this assessment. Matches and gaps below are limited to evidence present in the CV and requirements stated in the description.", { color: colors.muted, fontSize: 9 });
      addSectionTitle(doc, "Supplied job description", colors.violet);
      addParagraph(doc, analysis.job_description, { fontSize: 9 });
      addSectionTitle(doc, "Relevant evidence in the CV", colors.green);
      addBullets(doc, analysis.strengths, colors.green);
      addSectionTitle(doc, "Gaps against stated requirements", colors.amber);
      addBullets(doc, analysis.weaknesses, colors.amber);
      addSectionTitle(doc, "Recommendations for this role", colors.violet);
      addBullets(doc, analysis.recommendations, colors.violet, true);
    }

    addSectionTitle(doc, "Strengths", colors.green);
    addBullets(doc, analysis.strengths, colors.green);

    addSectionTitle(doc, "Gaps and weaknesses", colors.amber);
    addBullets(doc, analysis.weaknesses, colors.amber);

    addSectionTitle(doc, "Prioritized recommendations", colors.violet);
    addBullets(doc, analysis.recommendations, colors.violet, true);

    doc.end();
  });
}

export function sanitizeReportFilename(fileName: string) {
  const baseName = fileName
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 80);

  return `ResumeIQ_Report_${baseName || "CV"}.pdf`;
}