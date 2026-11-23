
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";
import { apiRouter } from "./routes/api.js";

export const app = express();

app.disable("x-powered-by");

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (config.FRONTEND_ORIGINS.includes("*")) {
        return callback(null, true);
      }
      if (
        config.FRONTEND_ORIGINS.some(
          (allowed) => allowed === origin || allowed === origin.replace(/\/+$/, ""),
        )
      ) {
        return callback(null, true);
      }
      try {
        const url = new URL(origin);
        if (url.hostname.endsWith(".vercel.app")) {
          return callback(null, true);
        }
      } catch {}
      return callback(null, false);
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "apikey",
      "x-client-info",
    ],
  }),
);

// Request body parser
app.use(express.json({ limit: "32kb" }));

// Root info & health check
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "Backend Klinik UNESA",
    message: "Server backend berjalan.",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API routes
app.use("/api", apiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
