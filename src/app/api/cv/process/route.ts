import * as canvas from "@napi-rs/canvas";

import { NextResponse } from "next/server";

import { analyzeCv } from "@/lib/gemini/analysis";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 64 * 1024;

const BUCKET_NAME = "cv-files";

const ANALYSIS_FAILURE =
  "We couldn't analyse your CV right now. Your uploaded CV is safe. Please try again.";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readBoundedBody(request: Request) {
  if (!request.body) return null;

  const reader = request.body.getReader();

  const chunks: Uint8Array[] = [];

  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_REQUEST_SIZE) {
        await reader.cancel();

        return null;
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);

  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);

    offset += chunk.byteLength;
  }

  return body;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== new URL(request.url).origin) {
    return jsonError(
      "This upload request could not be verified. Refresh the page and try again.",
      403,
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[ResumeIQ] auth: failed", {
      errorName: authError?.name ?? null,
      errorCode: authError?.code ?? null,
      status: authError?.status ?? null,
      message: authError?.message ?? null,
    });

    return jsonError("Please sign in again before processing a CV.", 401);
  }

  console.info("[ResumeIQ] auth: success", { userId: user.id });

  const contentLength = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_REQUEST_SIZE
  ) {
    return jsonError(
      "This file is over the 10 MB limit. Choose a smaller PDF to continue.",
      413,
    );
  }

  const boundedBody = await readBoundedBody(request);

  if (!boundedBody) {
    return jsonError(
      "This file is over the 10 MB limit. Choose a smaller PDF to continue.",
      413,
    );
  }

  let formData: FormData;

  try {
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: boundedBody,
    });

    formData = await boundedRequest.formData();
  } catch (error) {
    console.error("[ResumeIQ] upload: form data parsing failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage:
        error instanceof Error ? error.message : String(error),
      errorStack:
        error instanceof Error ? error.stack : undefined,
    });

    return jsonError(
      "We couldn't read that upload. Please choose a PDF and try again.",
      400,
    );
  }

  const file = formData.get("file");

  const requestId = formData.get("request_id");

  const rawJobDescription = formData.get("job_description");

  if (
    typeof requestId !== "string" ||
    !/^[a-zA-Z0-9-]{16,64}$/.test(requestId)
  ) {
    return jsonError(
      "We couldn't start this analysis. Please refresh and try again.",
      400,
    );
  }

  if (
    rawJobDescription !== null &&
    typeof rawJobDescription !== "string"
  ) {
    return jsonError(
      "We couldn't read the job description. Please try again.",
      400,
    );
  }

  const jobDescription =
    typeof rawJobDescription === "string" &&
    rawJobDescription.trim()
      ? rawJobDescription.trim()
      : null;

  if (jobDescription) {
    if (jobDescription.length < 50) {
      return jsonError(
        "Please provide a more detailed job description with at least 50 characters.",
        400,
      );
    }

    if (jobDescription.length > 6000) {
      return jsonError(
        "Please shorten the job description to 6,000 characters or fewer.",
        400,
      );
    }

    const jobDescriptionWords = jobDescription
      .split(/\s+/)
      .filter((word) => /[\p{L}\p{N}]/u.test(word));

    if (jobDescriptionWords.length < 5) {
      return jsonError(
        "Please provide a more detailed job description with at least 5 words.",
        400,
      );
    }
  }

  if (!(file instanceof File)) {
    return jsonError("Choose a PDF CV before continuing.", 400);
  }

  if (file.size === 0) {
    return jsonError(
      "This PDF is empty. Choose a different file and try again.",
      400,
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonError(
      "This file is over the 10 MB limit. Choose a smaller PDF to continue.",
      413,
    );
  }

  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");

  const hasPdfMimeType =
    !file.type || file.type === "application/pdf";

  if (!hasPdfExtension || !hasPdfMimeType) {
    return jsonError(
      "That file is not a PDF. Choose a file ending in .pdf.",
      415,
    );
  }

  let fileBytes: Uint8Array;

  try {
    fileBytes = new Uint8Array(await file.arrayBuffer());
  } catch (error) {
    console.error("[ResumeIQ] upload: file read failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage:
        error instanceof Error ? error.message : String(error),
      errorStack:
        error instanceof Error ? error.stack : undefined,
    });

    return jsonError(
      "We couldn't read that upload. Please choose a PDF and try again.",
      400,
    );
  }

  const pdfSignature = new TextDecoder().decode(
    fileBytes.subarray(0, 5),
  );

  if (pdfSignature !== "%PDF-") {
    return jsonError(
      "This file does not appear to be a valid PDF. Choose a PDF and try again.",
      415,
    );
  }

  const storagePath = `${user.id}/${requestId}.pdf`;

  const storedFilename = file.name.slice(0, 240);

  let uploadError: {
    message: string;
    statusCode?: string;
  } | null;

  try {
    const result = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, Buffer.from(fileBytes), {
        contentType: "application/pdf",
        upsert: false,
      });

    uploadError = result.error;
  } catch (error) {
    console.error("[ResumeIQ] storage upload: request failed", {
      bucket: BUCKET_NAME,
      filePath: storagePath,
      userId: user.id,
      errorName:
        error instanceof Error ? error.name : "UnknownError",
      errorMessage:
        error instanceof Error ? error.message : String(error),
      errorStack:
        error instanceof Error ? error.stack : undefined,
    });

    return jsonError(ANALYSIS_FAILURE, 502);
  }

  const objectAlreadyExists =
    uploadError?.statusCode === "409" ||
    uploadError?.message.toLowerCase().includes("already exists");

  if (uploadError && !objectAlreadyExists) {
    console.error("[ResumeIQ] storage upload: failed", {
      bucket: BUCKET_NAME,
      filePath: storagePath,
      userId: user.id,
      status: uploadError.statusCode ?? "error",
      error: uploadError.message,
    });

    return jsonError(ANALYSIS_FAILURE, 502);
  }

  console.info("[ResumeIQ] storage upload: success", {
    bucket: BUCKET_NAME,
    filePath: storagePath,
    userId: user.id,
    status: objectAlreadyExists ? "already-existed" : "success",
  });

  let downloadedFile: Blob | null = null;

  let downloadError: {
    message: string;
    statusCode?: string;
  } | null = null;

  try {
    const result = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    downloadedFile = result.data;

    downloadError = result.error;
  } catch (error) {
    console.error("[ResumeIQ] storage download: request failed", {
      bucket: BUCKET_NAME,
      filePath: storagePath,
      userId: user.id,
      errorName:
        error instanceof Error ? error.name : "UnknownError",
      errorMessage:
        error instanceof Error ? error.message : "Unknown Storage error",
      errorStack:
        error instanceof Error ? error.stack : undefined,
    });

    return jsonError(ANALYSIS_FAILURE, 502);
  }

  let downloadedBytes: Buffer | null = null;

  if (downloadedFile) {
    try {
      downloadedBytes = Buffer.from(
        await downloadedFile.arrayBuffer(),
      );
    } catch (error) {
      console.error(
        "[ResumeIQ] storage download: body conversion failed",
        {
          bucket: BUCKET_NAME,
          filePath: storagePath,
          userId: user.id,
          status: downloadError?.statusCode ?? "ok",
          dataReturned: true,
          contentType: downloadedFile.type || null,
          errorName:
            error instanceof Error ? error.name : "UnknownError",
          errorMessage:
            error instanceof Error ? error.message : String(error),
          errorStack:
            error instanceof Error ? error.stack : undefined,
        },
      );

      return jsonError(ANALYSIS_FAILURE, 502);
    }
  }

  const downloadedSignature =
    downloadedBytes?.subarray(0, 5).toString("hex") ?? null;

  const downloadedPdfSignatureValid =
    downloadedBytes?.subarray(0, 5).toString("ascii") === "%PDF-";

  console.info("[ResumeIQ] storage download: result", {
    bucket: BUCKET_NAME,
    filePath: storagePath,
    userId: user.id,
    storageStatus:
      downloadError?.statusCode ??
      (downloadError ? "error" : "200"),
    dataReturned: downloadedFile !== null,
    byteLength: downloadedBytes?.byteLength ?? 0,
    contentType: downloadedFile?.type || null,
    firstBytesHex: downloadedSignature,
    pdfSignatureValid: downloadedPdfSignatureValid,
  });

  if (
    downloadError ||
    !downloadedFile ||
    !downloadedBytes
  ) {
    console.error("[ResumeIQ] storage download: failed", {
      bucket: BUCKET_NAME,
      filePath: storagePath,
      userId: user.id,
      storageStatus: downloadError?.statusCode ?? "error",
      storageError:
        downloadError?.message ?? "No object data returned",
    });

    return jsonError(ANALYSIS_FAILURE, 502);
  }

  console.info("[ResumeIQ] storage: success", {
    bucket: BUCKET_NAME,
    filePath: storagePath,
    userId: user.id,
    status: "200",
    byteLength: downloadedBytes.byteLength,
    contentType: downloadedFile.type || null,
    pdfSignatureValid: downloadedPdfSignatureValid,
  });

  if (
    downloadedBytes.byteLength === 0 ||
    downloadedBytes.byteLength > MAX_FILE_SIZE ||
    !downloadedPdfSignatureValid
  ) {
    console.error("[ResumeIQ] storage download: invalid PDF bytes", {
      bucket: BUCKET_NAME,
      filePath: storagePath,
      userId: user.id,
      storageStatus: "200",
      byteLength: downloadedBytes.byteLength,
      contentType: downloadedFile.type || null,
      firstBytesHex: downloadedSignature,
      pdfSignatureValid: downloadedPdfSignatureValid,
    });

    return jsonError(
      "We couldn't read text from this PDF. Please upload a text-based PDF.",
      422,
    );
  }

  let extractedText = "";

  let parser:
    | {
        getText: () => Promise<{ text: string }>;
        destroy: () => Promise<void>;
      }
    | undefined;

  try {
    Object.assign(globalThis, {
      DOMMatrix: canvas.DOMMatrix,
      ImageData: canvas.ImageData,
      Path2D: canvas.Path2D,
      DOMPoint: canvas.DOMPoint,
      DOMRect: canvas.DOMRect,
    });

    const [{ CanvasFactory }, { PDFParse }] = await Promise.all([
      import("pdf-parse/worker"),
      import("pdf-parse"),
    ]);

    parser = new PDFParse({
      data: downloadedBytes,
      CanvasFactory,
    });

    const result = await parser.getText();

    extractedText = result.text.trim();
  } catch (error) {
    console.error("[ResumeIQ] extraction: failed", {
      bucket: BUCKET_NAME,
      filePath: storagePath,
      userId: user.id,
      storageStatus: "200",
      errorName:
        error instanceof Error ? error.name : "UnknownError",
      errorMessage:
        error instanceof Error ? error.message : "Unknown parser error",
      errorStack:
        error instanceof Error ? error.stack : undefined,
      byteLength: downloadedBytes.byteLength,
      contentType: downloadedFile.type || null,
      firstBytesHex: downloadedSignature,
      pdfSignatureValid: downloadedPdfSignatureValid,
    });

    return jsonError(
      "We couldn't read text from this PDF. Please upload a text-based PDF.",
      422,
    );
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // Parser cleanup must not replace the user-facing processing result.
      }
    }
  }

  if (!/[\p{L}\p{N}]/u.test(extractedText)) {
    console.error("[ResumeIQ] extraction: no usable text", {
      bucket: BUCKET_NAME,
      filePath: storagePath,
      userId: user.id,
      extractedCharacters: extractedText.length,
    });

    return jsonError(
      "We couldn't read text from this PDF. Please upload a text-based PDF.",
      422,
    );
  }

  console.info("[ResumeIQ] extraction: success", {
    bucket: BUCKET_NAME,
    filePath: storagePath,
    userId: user.id,
    extractedCharacters: extractedText.length,
  });

  let processingStage = "analysis lookup";

  try {
    const {
      data: existingAnalysis,
      error: lookupError,
    } = await supabase
      .from("analyses")
      .select("id")
      .eq("user_id", user.id)
      .eq("file_path", storagePath)
      .maybeSingle();

    if (lookupError) {
      console.error("[ResumeIQ] database: analysis lookup failed", {
        userId: user.id,
        filePath: storagePath,
        code: lookupError.code,
        message: lookupError.message,
      });

      return jsonError(ANALYSIS_FAILURE, 502);
    }

    if (typeof existingAnalysis?.id === "string") {
      return NextResponse.json({
        analysisId: existingAnalysis.id,
      });
    }

    processingStage = "gemini";

    const analysis = await analyzeCv(
      extractedText,
      jobDescription,
    );

    processingStage = "database insert";

    const {
      data: insertedAnalysis,
      error: insertError,
    } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        file_name: storedFilename,
        file_path: storagePath,
        cv_text: extractedText,
        job_description: jobDescription,
        score: analysis.score,
        ats_score: analysis.ats_score,
        experience_score: analysis.experience_score,
        skills_score: analysis.skills_score,
        education_score: analysis.education_score,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
        job_match_score: analysis.job_match_score,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[ResumeIQ] database: insert failed", {
        userId: user.id,
        filePath: storagePath,
        code: insertError.code,
        message: insertError.message,
      });

      const { data: retryAnalysis } = await supabase
        .from("analyses")
        .select("id")
        .eq("user_id", user.id)
        .eq("file_path", storagePath)
        .maybeSingle();

      if (typeof retryAnalysis?.id === "string") {
        return NextResponse.json({
          analysisId: retryAnalysis.id,
        });
      }

      return jsonError(ANALYSIS_FAILURE, 502);
    }

    if (typeof insertedAnalysis?.id !== "string") {
      console.error(
        "[ResumeIQ] database: insert returned no id",
        {
          userId: user.id,
          filePath: storagePath,
        },
      );

      return jsonError(ANALYSIS_FAILURE, 502);
    }

    console.info("[ResumeIQ] database: insert success", {
      userId: user.id,
      analysisId: insertedAnalysis.id,
    });

    return NextResponse.json({
      analysisId: insertedAnalysis.id,
    });
  } catch (error) {
    console.error(
      `[ResumeIQ] ${processingStage}: unexpected failure`,
      {
        userId: user.id,
        filePath: storagePath,
        errorName:
          error instanceof Error ? error.name : "UnknownError",
        errorMessage:
          error instanceof Error
            ? error.message
            : String(error),
        errorStack:
          error instanceof Error
            ? error.stack
            : undefined,
        errorObject:
          error instanceof Error
            ? Object.getOwnPropertyNames(error).reduce<
                Record<string, unknown>
              >((result, key) => {
                const value = (error as unknown as Record<
                  string,
                  unknown
                >)[key];

                if (key === "stack" || key === "message") {
                  return result;
                }

                try {
                  JSON.stringify(value);

                  result[key] = value;
                } catch {
                  result[key] = "[unserializable]";
                }

                return result;
              }, {})
            : error,
      },
    );

    return jsonError(ANALYSIS_FAILURE, 502);
  }
}