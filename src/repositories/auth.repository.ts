import { prisma } from "../config/database.js";
import type { UserRole, SubscriptionPlan } from "../generated/prisma/client.js";

export const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
    role?: UserRole;
    subscriptionPlan?: SubscriptionPlan;
    avatar?: string;
  }) {
    return prisma.user.create({ data });
  },

  async updateUser(id: string, data: {
    name?: string;
    email?: string;
    phone?: string | null;
    passwordHash?: string;
    avatar?: string | null;
  }) {
    return prisma.user.update({ where: { id }, data });
  },

  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
