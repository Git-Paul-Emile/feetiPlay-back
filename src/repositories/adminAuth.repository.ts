import { prisma } from "../config/database.js";

export const adminAuthRepository = {
  async findByEmail(email: string) {
    return prisma.adminUser.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.adminUser.findUnique({ where: { id } });
  },
};
