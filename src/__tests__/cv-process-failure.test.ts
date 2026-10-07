import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAnalyzeCv = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("@/lib/gemini/analysis", () => ({
  analyzeCv: mockAnalyzeCv,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    async getText() {
      return {
        text: "John Doe Software Engineer JavaScript TypeScript React",
      };
    }

    async destroy() {}
  },
}));

describe("CV process AI failure handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAnalyzeCv.mockRejectedValue(
      new Error("Gemini failed after all retry attempts"),
    );

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "test-user-id",
            },
          },
          error: null,
        }),
      },
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({
            data: {
              path: "test-user-id/test-request-1234567890.pdf",
            },
            error: null,
          }),
          download: vi.fn().mockResolvedValue({
            data: new Blob(["%PDF-1.7\nfake pdf content"], {
              type: "application/pdf",
            }),
            error: null,
          }),
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });
  });

  it("returns the friendly failure response when AI analysis fails", async () => {
    const { POST } = await import("../app/api/cv/process/route");

    const formData = new FormData();

    formData.append(
      "file",
      new File(
        ["%PDF-1.7\nfake pdf content"],
        "test-resume.pdf",
        {
          type: "application/pdf",
        },
      ),
    );

    formData.append(
      "request_id",
      "test-request-1234567890",
    );

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

    expect(response.status).toBe(502);

    expect(body).toEqual({
      error:
        "We couldn't analyse your CV right now. Your uploaded CV is safe. Please try again.",
    });

    expect(mockAnalyzeCv).toHaveBeenCalledTimes(1);
  });
});