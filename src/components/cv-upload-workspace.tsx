"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  FileText,
  Info,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_JOB_DESCRIPTION_LENGTH = 50;
const MAX_JOB_DESCRIPTION_LENGTH = 6000;
const MIN_JOB_DESCRIPTION_WORDS = 5;

export function validateJobDescription(value: string): string {
  const jobDescription = value.trim();

  if (!jobDescription) {
    return "";
  }

  if (jobDescription.length < MIN_JOB_DESCRIPTION_LENGTH) {
    return `Please provide a more detailed job description with at least ${MIN_JOB_DESCRIPTION_LENGTH} characters.`;
  }

  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    return `Please shorten the job description to ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters or fewer.`;
  }

  const jobDescriptionWords = jobDescription
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word));

  if (jobDescriptionWords.length < MIN_JOB_DESCRIPTION_WORDS) {
    return `Please provide a more detailed job description with at least ${MIN_JOB_DESCRIPTION_WORDS} words.`;
  }

  return "";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function CvUploadWorkspace() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobDescriptionError, setJobDescriptionError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCheckingFile, setIsCheckingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState("");

  async function chooseFile(file: File | undefined) {
    if (!file) return;

    setSelectedFile(null);
    requestIdRef.current = null;
    setValidationError("");
    setProcessingError("");

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(
        "This file is over the 10 MB limit. Choose a smaller PDF to continue.",
      );
      return;
    }

    const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
    const hasPdfMimeType = !file.type || file.type === "application/pdf";

    if (!hasPdfExtension || !hasPdfMimeType) {
      setValidationError(
        "That file is not a PDF. Choose a file ending in .pdf.",
      );
      return;
    }

    setIsCheckingFile(true);

    try {
      const signature = await file.slice(0, 5).text();

      if (signature !== "%PDF-") {
        setValidationError(
          "This file does not appear to be a valid PDF. Choose a PDF and try again.",
        );
        return;
      }

      setSelectedFile(file);
    } catch {
      setValidationError(
        "We couldn't check this file. Please select the PDF again.",
      );
    } finally {
      setIsCheckingFile(false);
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    void chooseFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    void chooseFile(event.dataTransfer.files[0]);
  }

  function handleDropzoneKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  function removeFile() {
    setSelectedFile(null);
    requestIdRef.current = null;
    setValidationError("");
    setProcessingError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleJobDescriptionChange(value: string) {
    setJobDescription(value);
    setJobDescriptionError(validateJobDescription(value));
  }

  async function processCv() {
    if (!selectedFile || isProcessing) return;

    const currentJobDescriptionError =
      validateJobDescription(jobDescription);

    if (currentJobDescriptionError) {
      setJobDescriptionError(currentJobDescriptionError);
      return;
    }

    setIsProcessing(true);
    setProcessingError("");

    try {
      const formData = new FormData();

      formData.set("file", selectedFile);
      formData.set("job_description", jobDescription);

      requestIdRef.current ??=
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

      formData.set("request_id", requestIdRef.current);

      const response = await fetch("/api/cv/process", {
        method: "POST",
        body: formData,
      });

      const result: { error?: string; analysisId?: string } =
        await response.json();

      if (!response.ok || typeof result.analysisId !== "string") {
        setProcessingError(
          result.error ??
            "We couldn't analyse your CV right now. Your uploaded CV is safe. Please try again.",
        );
        return;
      }

      router.push(`/analysis/${encodeURIComponent(result.analysisId)}`);
    } catch {
      setProcessingError(
        "We couldn't analyse your CV right now. Your uploaded CV is safe. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="upload-workspace">
      <section className="upload-main" aria-labelledby="upload-heading">
        <div className="upload-header">
          <div>
            <p className="upload-kicker">Analyze your resume</p>
            <h2 id="upload-heading" className="upload-title">
              Add your CV
            </h2>
            <p className="upload-subtitle">
              One PDF. A clearer view of the experience behind it.
            </p>
          </div>
          <span className="upload-ready">Ready when you are</span>
        </div>

        <div className="upload-form">
          <div>
            <input
              ref={fileInputRef}
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleFileInput}
              type="file"
              aria-label="Choose a PDF CV"
            />

            {selectedFile ? (
              <div className="upload-file" aria-live="polite">
                <span className="upload-file-icon">
                  <FileText size={20} aria-hidden="true" />
                </span>

                <div className="upload-file-meta">
                  <p
                    className="upload-file-name"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="upload-file-size">
                    PDF · {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="upload-small-button"
                    disabled={isProcessing}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Upload size={14} aria-hidden="true" /> Replace
                  </button>

                  <button
                    aria-label={`Remove ${selectedFile.name}`}
                    className="upload-small-button upload-remove-button"
                    disabled={isProcessing}
                    onClick={removeFile}
                    type="button"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={`upload-picker${isDragging ? " is-dragging" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                onKeyDown={handleDropzoneKeyDown}
                type="button"
              >
                <span className="upload-picker-icon">
                  {isCheckingFile ? (
                    <span
                      className="size-5 animate-spin rounded-full border-2 border-[#9ce8ef]/30 border-t-[#9ce8ef]"
                      aria-label="Checking PDF"
                    />
                  ) : (
                    <Upload size={20} aria-hidden="true" />
                  )}
                </span>

                <span className="upload-picker-title">
                  {isDragging
                    ? "Drop your PDF here"
                    : isCheckingFile
                      ? "Checking your PDF…"
                      : "Drop your CV here"}
                </span>

                <span className="upload-picker-copy">
                  or <strong>browse files</strong> on your device
                </span>

                <span className="upload-limit">
                  <FileText size={11} aria-hidden="true" /> PDF only ·
                  Maximum 10 MB
                </span>
              </button>
            )}

            {validationError && (
              <p className="upload-alert" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          <div>
            <div className="job-label-row">
              <label
                className="job-label"
                htmlFor="job-description"
              >
                Compare against a job{" "}
                <span className="job-optional">Optional</span>
              </label>

              <span className="job-help">
                Use the role’s stated requirements
              </span>
            </div>

            <textarea
              aria-describedby={
                jobDescriptionError
                  ? "job-description-error"
                  : undefined
              }
              aria-invalid={Boolean(jobDescriptionError)}
              className="job-textarea"
              id="job-description"
              maxLength={6000}
              onChange={(event) =>
                handleJobDescriptionChange(event.target.value)
              }
              placeholder="Paste a job description to compare against later…"
              value={jobDescription}
            />

            {jobDescriptionError && (
              <p
                className="upload-alert"
                id="job-description-error"
                role="alert"
              >
                <AlertCircle size={14} aria-hidden="true" />
                <span>{jobDescriptionError}</span>
              </p>
            )}

            <div className="job-meta">
              <span>Used only for this analysis.</span>
              <span className="shrink-0">
                {jobDescription.length}/6,000
              </span>
            </div>
          </div>

          <div className="upload-action-row">
            <button
              className="analyse-button"
              disabled={
                !selectedFile ||
                isCheckingFile ||
                isProcessing ||
                Boolean(jobDescriptionError)
              }
              onClick={() => void processCv()}
              type="button"
            >
              {isProcessing ? (
                <span
                  className="size-4 animate-spin rounded-full border-2 border-[#0b1822]/30 border-t-[#0b1822]"
                  aria-label="Processing CV"
                />
              ) : (
                <Sparkles size={16} aria-hidden="true" />
              )}

              {isProcessing
                ? "Uploading and analysing your CV…"
                : "Analyse my CV"}
            </button>

            {isProcessing && (
              <span className="processing-note" role="status">
                Reading your CV and preparing your assessment…
              </span>
            )}

            {processingError && (
              <div className="processing-error" role="alert">
                <p className="flex min-w-0 items-start gap-2">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{processingError}</span>
                </p>

                <button
                  className="retry-button"
                  disabled={isProcessing}
                  onClick={() => void processCv()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="upload-aside">
        <p className="upload-aside-kicker">
          A thoughtful first step
        </p>

        <h3>Make room for a clearer read.</h3>

        <p>
          ResumeIQ evaluates the details you provide to surface useful,
          specific feedback.
        </p>

        <ul className="upload-aside-list">
          <li className="flex gap-3 py-4">
            <Check size={14} aria-hidden="true" />
            <span>
              <strong>One current CV</strong>
              <span>PDF format, no larger than 10 MB.</span>
            </span>
          </li>

          <li className="flex gap-3 py-4">
            <Check size={14} aria-hidden="true" />
            <span>
              <strong>A role, if you have one</strong>
              <span>Compare your CV with stated requirements.</span>
            </span>
          </li>
        </ul>

        <p className="upload-private-note">
          <Info size={13} aria-hidden="true" />
          Your CV is stored privately and only accessible under your
          account.
        </p>
      </aside>
    </div>
  );
}