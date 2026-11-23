
import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  FRONTEND_ORIGIN: z.string().default("http://localhost:8080"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const parsedConfig = configSchema.parse(process.env);

export const config = {
  ...parsedConfig,

  FRONTEND_ORIGINS: parsedConfig.FRONTEND_ORIGIN
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
