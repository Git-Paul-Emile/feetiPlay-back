import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { adminAuthService } from "../services/adminAuth.service.js";
import { jsonResponse } from "../utils/response.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import { verifyRefreshToken, generateToken } from "../config/jwt.js";
import { adminAuthRepository } from "../repositories/adminAuth.repository.js";

const ADMIN_REFRESH_COOKIE = "feetiplay_admin_refresh";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const adminLogin = controllerWrapper(async (req: Request, res: Response) => {
  const { admin, accessToken, refreshToken } = await adminAuthService.login(req.body);
  res.cookie(ADMIN_REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Connexion admin réussie", data: { admin, accessToken } })
  );
});

export const adminLogout = controllerWrapper(async (_req: Request, res: Response) => {
  res.clearCookie(ADMIN_REFRESH_COOKIE);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Déconnexion admin réussie" })
  );
});

export const adminMe = controllerWrapper(async (req: Request, res: Response) => {
  const admin = await adminAuthService.getMe(req.user!.userId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Admin récupéré", data: admin })
  );
});

export const adminRefresh = controllerWrapper(async (req: Request, res: Response) => {
  const token = req.cookies[ADMIN_REFRESH_COOKIE];
  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json(
      jsonResponse({ status: "unauthorized", message: "Token manquant" })
    );
    return;
  }
  const payload = verifyRefreshToken(token) as { userId: string };
  const admin = await adminAuthRepository.findById(payload.userId);
  if (!admin) {
    res.status(StatusCodes.UNAUTHORIZED).json(
      jsonResponse({ status: "unauthorized", message: "Admin non trouvé" })
    );
    return;
  }
  const accessToken = generateToken({ userId: admin.id, role: admin.role, isAdmin: true });
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Token rafraîchi", data: { accessToken } })
  );
});
