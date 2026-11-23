import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { config } from "../config.js";

type AuthenticatedContext = {
  supabase: SupabaseClient;
  user: User;
};

export function getAuthenticatedContext(req: Request): AuthenticatedContext {
  if (!req.supabase || !req.user) {
    throw new Error("Authenticated request context is unavailable.");
  }

  return { supabase: req.supabase, user: req.user };
}

function createUserClient(token: string): SupabaseClient {
  return createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.header("authorization");
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ error: "Silakan masuk untuk melanjutkan." });
    return;
  }

  const supabase = createUserClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res
      .status(401)
      .json({ error: "Sesi login tidak valid. Silakan masuk kembali." });
    return;
  }

  req.supabase = supabase;
  req.user = data.user;
  next();
}

export const requireStaff: RequestHandler = async (req, res, next) => {
  const { supabase, user } = getAuthenticatedContext(req);
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (error) {
    next(error);
    return;
  }
  if (!data.some((role) => role.role === "petugas")) {
    res.status(403).json({ error: "Akses khusus petugas klinik." });
    return;
  }

  next();
};
