import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { adminAuthRepository } from "../repositories/adminAuth.repository.js";
import { generateToken, generateRefreshToken } from "../config/jwt.js";
import type { AdminLoginInput } from "../validators/adminAuth.validator.js";

// Permissions par rôle — miroir du frontend
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    "view_dashboard", "manage_events", "manage_users", "manage_crm",
    "send_notifications", "view_logs", "manage_settings", "manage_backup",
    "manage_monitoring", "manage_roles", "view_finances",
  ],
  admin: [
    "view_dashboard", "manage_events", "manage_users", "manage_crm",
    "send_notifications", "view_logs",
  ],
  moderator: ["view_dashboard", "manage_events", "view_users", "view_logs"],
  finance: ["view_dashboard", "view_finances", "view_events", "view_users", "view_logs"],
  marketing: ["view_dashboard", "manage_crm", "send_notifications", "view_events", "view_users"],
};

function omitPassword<T extends { passwordHash: string }>(admin: T) {
  const { passwordHash: _, ...rest } = admin;
  return rest;
}

export const adminAuthService = {
  async login(data: AdminLoginInput) {
    const admin = await adminAuthRepository.findByEmail(data.email);
    if (!admin) throw new AppError("Email ou mot de passe incorrect", StatusCodes.UNAUTHORIZED);
    const match = await bcrypt.compare(data.password, admin.passwordHash);
    if (!match) throw new AppError("Email ou mot de passe incorrect", StatusCodes.UNAUTHORIZED);

    const permissions = ROLE_PERMISSIONS[admin.role] ?? [];
    const accessToken = generateToken({ userId: admin.id, role: admin.role, isAdmin: true });
    const refreshToken = generateRefreshToken({ userId: admin.id });

    return {
      admin: { ...omitPassword(admin), permissions },
      accessToken,
      refreshToken,
    };
  },

  async getMe(userId: string) {
    const admin = await adminAuthRepository.findById(userId);
    if (!admin) throw new AppError("Administrateur non trouvé", StatusCodes.NOT_FOUND);
    const permissions = ROLE_PERMISSIONS[admin.role] ?? [];
    return { ...omitPassword(admin), permissions };
  },
};
