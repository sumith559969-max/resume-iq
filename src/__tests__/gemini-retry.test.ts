import { describe, expect, it, vi } from "vitest";
import {
  createGeminiInteraction,
  isRetryableGeminiError,
} from "../lib/gemini/analysis";

type GeminiTestResponse = {
  output_text: string;
};

type GeminiClientMock = {
  interactions: {
    create: ReturnType<typeof vi.fn>;
  };
};

describe("Gemini retry handling", () => {
  it("recognizes temporary rate-limit errors as retryable", () => {
    expect(
      isRetryableGeminiError({
        status: 429,
        message: "Rate limit exceeded",
      }),
    ).toBe(true);
  });

  it("recognizes temporary server errors as retryable", () => {
    expect(
      isRetryableGeminiError({
        status: 503,
        message: "Service unavailable",
      }),
    ).toBe(true);
  });

  it("does not retry an exhausted daily quota", () => {
    expect(
      isRetryableGeminiError({
        status: 429,
        message: "Daily quota exceeded for the day",
      }),
    ).toBe(false);
  });

  it("does not retry a permanent error", () => {
    expect(
      isRetryableGeminiError({
        status: 400,
        message: "Invalid request",
      }),
    ).toBe(false);
  });

  it("retries a temporary Gemini failure and succeeds", async () => {
    const response: GeminiTestResponse = {
      output_text: '{"test":"success"}',
    };

    const createMock = vi
      .fn()
      .mockRejectedValueOnce({
        status: 503,
        message: "Service unavailable",
      })
      .mockResolvedValueOnce(response);

    const client = {
      interactions: {
        create: createMock,
      },
    } as unknown as GeminiClientMock;

    const sleepMock = vi.fn().mockResolvedValue(undefined);

    const result = await createGeminiInteraction(
      client as unknown as Parameters<
        typeof createGeminiInteraction
      >[0],
      {} as Parameters<
        typeof createGeminiInteraction
      >[1],
      "test-api-key",
      sleepMock,
    );

    expect(result).toEqual(response);
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });

  it("stops after the initial request plus 3 retries", async () => {
    const createMock = vi.fn().mockRejectedValue({
      status: 503,
      message: "Service unavailable",
    });

    const client = {
      interactions: {
        create: createMock,
      },
    } as unknown as GeminiClientMock;

    const sleepMock = vi.fn().mockResolvedValue(undefined);

    await expect(
      createGeminiInteraction(
        client as unknown as Parameters<
          typeof createGeminiInteraction
        >[0],
        {} as Parameters<
          typeof createGeminiInteraction
        >[1],
        "test-api-key",
        sleepMock,
      ),
    ).rejects.toMatchObject({
      status: 503,
      message: "Service unavailable",
    });

    expect(createMock).toHaveBeenCalledTimes(4);
    expect(sleepMock).toHaveBeenCalledTimes(3);
  });
});