import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";

export const adminAuthRepository = {
  async findByEmail(email: string) {
    return prisma.adminUser.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.adminUser.findUnique({ where: { id } });
  },

  async updateProfile(id: string, data: { name?: string; avatar?: string }) {
    return prisma.adminUser.update({ where: { id }, data });
  },

  async updatePassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return prisma.adminUser.update({ where: { id }, data: { passwordHash } });
  },
};
