import type { Response } from "express";

export function databaseError(
  res: Response,
  error: { message: string },
  status = 500,
): void {
  console.error("[Backend_Klinik] Supabase request failed:", error.message);
  res.status(status).json({
    error:
      status === 400
        ? error.message
        : "Terjadi kesalahan saat mengakses data klinik.",
  });
}
