import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { verifyToken } from "../config/jwt.js";
import { AppError } from "../utils/AppError.js";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string; source?: "feetiplay" | "feeti2" };
    }
  }
}

// Carte des rôles feeti2 → rôles feetiPlay
const FEETI2_ROLE_MAP: Record<string, string> = {
  user: "viewer",
  organizer: "viewer",
  controller: "viewer",
  moderator: "viewer",
  admin: "admin",
  super_admin: "super_admin",
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Non authentifié - token manquant", StatusCodes.UNAUTHORIZED);
  }
  const token = authHeader.split(" ")[1]!;

  // 1. Essai avec le secret feetiPlay
  try {
    const payload = verifyToken(token) as { userId: string; role: string };
    req.user = { ...payload, source: "feetiplay" };
    return next();
  } catch {
    // token non valide pour feetiPlay — tenter feeti2
  }

  // 2. Essai avec le secret feeti2 (SSO)
  const feeti2Secret = process.env.FEETI2_JWT_SECRET;
  if (feeti2Secret) {
    try {
      const payload = jwt.verify(token, feeti2Secret) as { userId: string; role: string };
      const mappedRole = FEETI2_ROLE_MAP[payload.role] ?? "viewer";
      req.user = { userId: payload.userId, role: mappedRole, source: "feeti2" };
      return next();
    } catch {
      // token invalide pour les deux apps
    }
  }

  throw new AppError("Token invalide ou expiré", StatusCodes.UNAUTHORIZED);
};

export const requireRole = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError("Accès refusé - permissions insuffisantes", StatusCodes.FORBIDDEN);
    }
    next();
  };

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1] ?? "";
    try {
      const payload = verifyToken(token) as { userId: string; role: string };
      req.user = payload;
    } catch {
      // token invalide : on continue sans utilisateur
    }
  }
  next();
};
