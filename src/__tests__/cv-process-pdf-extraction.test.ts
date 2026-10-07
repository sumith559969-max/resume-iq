import { describe, expect, it, vi } from "vitest";

const {
  analyzeCvMock,
  createClientMock,
  getTextMock,
  destroyMock,
  insertMock,
} = vi.hoisted(() => ({
  analyzeCvMock: vi.fn(),
  createClientMock: vi.fn(),
  getTextMock: vi.fn(),
  destroyMock: vi.fn(),
  insertMock: vi.fn(),
}));

vi.mock("@/lib/gemini/analysis", () => ({
  analyzeCv: analyzeCvMock,
}));

vi.mock("pdf-parse", () => ({
  PDFParse: vi.fn().mockImplementation(() => ({
    getText: getTextMock,
    destroy: destroyMock,
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { POST } from "@/app/api/cv/process/route";

describe("CV process PDF extraction", () => {
  it("extracts PDF text and continues to AI analysis", async () => {
    const userId = "test-user-id";
    const requestId = "test-request-1234567890";
    const analysisId = "test-analysis-id";

    const extractedText =
      "John Doe Software Developer React TypeScript Node.js";

    const pdfBytes = new TextEncoder().encode(
      "%PDF-1.7\nfake test PDF bytes",
    );

    getTextMock.mockResolvedValue({
      text: `  ${extractedText}  `,
    });

    destroyMock.mockResolvedValue(undefined);

    analyzeCvMock.mockResolvedValue({
      score: 82,
      ats_score: 86,
      experience_score: 78,
      skills_score: 84,
      education_score: 80,
      summary: "Strong software development resume.",
      strengths: ["React experience", "TypeScript skills"],
      weaknesses: ["Limited professional experience"],
      recommendations: ["Add measurable project outcomes"],
      job_match_score: null,
    });

    const analysesSelect = {
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };

    analysesSelect.eq
      .mockReturnValueOnce(analysesSelect)
      .mockReturnValueOnce(analysesSelect);

    analysesSelect.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    insertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: analysisId,
          },
          error: null,
        }),
      }),
    });

    const storageMock = {
      upload: vi.fn().mockResolvedValue({
        data: {
          path: `${userId}/${requestId}.pdf`,
        },
        error: null,
      }),
      download: vi.fn().mockResolvedValue({
        data: new Blob([pdfBytes], {
          type: "application/pdf",
        }),
        error: null,
      }),
    };

    const supabaseMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
            },
          },
          error: null,
        }),
      },

      storage: {
        from: vi.fn().mockReturnValue(storageMock),
      },

      from: vi.fn().mockImplementation((table: string) => {
        if (table === "analyses") {
          return {
            select: vi.fn().mockReturnValue(analysesSelect),
            insert: insertMock,
          };
        }

        throw new Error(`Unexpected Supabase table: ${table}`);
      }),
    };

    createClientMock.mockResolvedValue(supabaseMock);

    const formData = new FormData();

    formData.append(
      "file",
      new File(
        [pdfBytes],
        "test-resume.pdf",
        {
          type: "application/pdf",
        },
      ),
    );

    formData.append("request_id", requestId);

    const request = new Request(
      "http://localhost:3000/api/cv/process",
      {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
        body: formData,
      },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
      analysisId,
    });

    expect(getTextMock).toHaveBeenCalledTimes(1);

    expect(destroyMock).toHaveBeenCalledTimes(1);

    expect(analyzeCvMock).toHaveBeenCalledTimes(1);

    expect(analyzeCvMock).toHaveBeenCalledWith(
      extractedText,
      null,
    );

    expect(insertMock).toHaveBeenCalledTimes(1);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        file_name: "test-resume.pdf",
        file_path: `${userId}/${requestId}.pdf`,
        cv_text: extractedText,
      }),
    );
  });
});