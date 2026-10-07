import { describe, expect, it } from "vitest";
import { validateJobDescription } from "@/components/cv-upload-workspace";

describe("client-side job description validation", () => {
  it("allows an empty job description because it is optional", () => {
    expect(validateJobDescription("")).toBe("");
    expect(validateJobDescription("   ")).toBe("");
  });

  it("rejects a job description shorter than 50 characters", () => {
    expect(validateJobDescription("Developer role")).toBe(
      "Please provide a more detailed job description with at least 50 characters.",
    );
  });

  it("accepts a sufficiently detailed job description", () => {
    const validDescription =
      "We are looking for a software developer with experience in React and TypeScript.";

    expect(validateJobDescription(validDescription)).toBe("");
  });

  it("rejects a job description longer than 6000 characters", () => {
    const longDescription = "Developer ".repeat(601);

    expect(longDescription.length).toBeGreaterThan(6000);

    expect(validateJobDescription(longDescription)).toBe(
      "Please shorten the job description to 6,000 characters or fewer.",
    );
  });
});