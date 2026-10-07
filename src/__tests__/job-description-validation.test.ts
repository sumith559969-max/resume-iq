import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateClient = vi.fn();

vi.mock("@/lib/gemini/analysis", () => ({
  analyzeCv: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

describe("Job description server-side validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
    });
  });

  async function sendJobDescription(
    jobDescription: string,
  ) {
    const { POST } = await import(
      "../app/api/cv/process/route"
    );

    const formData = new FormData();

    formData.append(
      "request_id",
      "test-request-1234567890",
    );

    formData.append(
      "job_description",
      jobDescription,
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

    return {
      status: response.status,
      body: await response.json(),
    };
  }

  it("rejects a job description shorter than 50 characters", async () => {
    const result = await sendJobDescription(
      "Software engineer with React experience.",
    );

    expect(result.status).toBe(400);

    expect(result.body).toEqual({
      error:
        "Please provide a more detailed job description with at least 50 characters.",
    });
  });

  it("rejects a job description with fewer than 5 words", async () => {
    const result = await sendJobDescription(
      "Internationalization implementation responsibilities documentation",
    );

    expect(result.status).toBe(400);

    expect(result.body).toEqual({
      error:
        "Please provide a more detailed job description with at least 5 words.",
    });
  });

  it("rejects a job description longer than 6000 characters", async () => {
    const result = await sendJobDescription(
      "Software engineer ".repeat(400),
    );

    expect(result.status).toBe(400);

    expect(result.body).toEqual({
      error:
        "Please shorten the job description to 6,000 characters or fewer.",
    });
  });

  it("allows a sufficiently detailed job description to continue", async () => {
    const result = await sendJobDescription(
      "We are looking for a software engineer with strong React and TypeScript experience to build reliable web applications.",
    );

    expect(result.status).toBe(400);

    expect(result.body).toEqual({
      error: "Choose a PDF CV before continuing.",
    });
  });
});