import type { ErrorRequestHandler, RequestHandler } from "express";

class HttpError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new HttpError("Rute tidak ditemukan.", 404));
};

function getBodyParserStatus(error: unknown): 400 | 413 | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined;
  }

  if (error.status === 400 || error.status === 413) return error.status;
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const bodyParserStatus = getBodyParserStatus(error);
  const statusCode =
    error instanceof HttpError ? error.statusCode : bodyParserStatus ?? 500;

  if (statusCode >= 500) {
    console.error("[Backend_Klinik] Unhandled request error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server." });
    return;
  }

  res.status(statusCode).json({
    error:
      error instanceof HttpError
        ? error.message
        : statusCode === 413
          ? "Ukuran request terlalu besar."
          : "Format request tidak valid.",
  });
};
