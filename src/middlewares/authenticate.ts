import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../config/jwt.js";
import { AppError } from "../utils/AppError.js";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Non authentifié - token manquant", StatusCodes.UNAUTHORIZED);
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyToken(token) as { userId: string; role: string };
    req.user = payload;
    next();
  } catch {
    throw new AppError("Token invalide ou expiré", StatusCodes.UNAUTHORIZED);
  }
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
    const token = authHeader.split(" ")[1];
    try {
      const payload = verifyToken(token) as { userId: string; role: string };
      req.user = payload;
    } catch {
      // token invalide : on continue sans utilisateur
    }
  }
  next();
};
