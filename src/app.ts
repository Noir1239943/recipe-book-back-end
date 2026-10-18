import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
import { ENV } from "@/config/env";
import routes from "@/routes";

const app = express();

// Render (and most hosts) sit behind a proxy. This lets Express read the real protocol (https).
app.set("trust proxy", 1);

// --- Core Middleware ---
app.use(helmet());
app.use(cors({
  origin: ENV.FRONTEND_URLS,
  credentials: true
}));

// Recipe photos are sent as base64 inside JSON, so allow bodies up to 5 MB.
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(hpp());

// --- Simple Health Check ---
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: `${ENV.APP_NAME} instance is healthy`,
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV
  });
});

// --- API Health Check ---
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "API is healthy",
    timestamp: new Date().toISOString()
  });
});

// --- API Routes ---
app.use("/api", routes);

// --- 404 Handler ---
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// --- Global Error Handler ---
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error("🔥 Global Error Hook:", err.message);

  // Body larger than the JSON limit (usually a photo that is too big).
  if (err.type === "entity.too.large") {
    return res.status(413).json({ code: 413, status: "error", message: "Request is too large. Use a photo under 5 MB." });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    code: statusCode,
    status: "error",
    message: ENV.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    ...(ENV.NODE_ENV !== "production" && { stack: err.stack })
  });
});

export default app;
