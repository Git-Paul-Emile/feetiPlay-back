import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import authRouter from "../routes/auth.routes.js";
import adminAuthRouter from "../routes/adminAuth.routes.js";
import channelsRouter from "../routes/channels.routes.js";
import eventsRouter from "../routes/events.routes.js";
import streamingRouter from "../routes/streaming.routes.js";
import favoritesRouter from "../routes/favorites.routes.js";
import integrationRouter from "../routes/integration.routes.js";
import adminRouter from "../routes/admin.routes.js";
import uploadRouter from "../routes/upload.routes.js";
import paymentRouter from "../routes/payment.routes.js";
import webhooksRouter from "../routes/webhooks.routes.js";

const app = express();

const buildLocalhostOrigins = (startPort: number, count: number) =>
  Array.from({ length: count }, (_, index) => `http://localhost:${startPort + index}`);

const allowedOrigins = [
  process.env.FRONT_URL || "http://localhost:5173",
  process.env.FEETI2_FRONT_URL || "http://localhost:3000",
  ...buildLocalhostOrigins(5173, 3),
  ...buildLocalhostOrigins(3000, 3),
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"), false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "FeetiPlay API opérationnelle" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/channels", channelsRouter);
app.use("/api/streaming", streamingRouter);
app.use("/api/events", favoritesRouter);
app.use("/api/events", eventsRouter);
app.use("/api/integration", integrationRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);
// ─── Paiements (proxy feeti2 + streaming local) ───────────────────────
app.use("/api/payments", paymentRouter);
// ─── Webhooks externes (Mux, etc.) — pas d'auth, vérification par signature ──
app.use("/api/webhooks", webhooksRouter);

// 404
app.use((_req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: "Route non trouvée" });
});

// Gestion des erreurs centralisée
app.use((err: Error | AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  if ("code" in err && typeof err.code === "string") {
    switch (err.code) {
      case "P2002":
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `Conflit unique sur le champ: ${(err as any).meta?.target || "inconnu"}`,
        });
      case "P2025":
        return res.status(StatusCodes.NOT_FOUND).json({ message: "Ressource non trouvée" });
      default:
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Erreur de base de données" });
    }
  }

  const statusCode = err instanceof AppError ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Erreur interne du serveur";
  const errors = err instanceof AppError ? err.errors : undefined;
  res.status(statusCode).json({ message, ...(errors && { errors }) });
});

export default app;
