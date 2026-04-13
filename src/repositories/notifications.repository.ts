import { prisma } from "../config/database.js";

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: "info" | "warning" | "promo" | "maintenance";
  audience?: "all" | "premium" | "free";
  sentBy: string;
}

export const notificationsRepository = {
  async create(data: CreateNotificationInput) {
    return prisma.adminNotification.create({ data });
  },

  async findAll(options?: { limit?: number; offset?: number }) {
    const [notifications, total] = await Promise.all([
      prisma.adminNotification.findMany({
        orderBy: { sentAt: "desc" },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.adminNotification.count(),
    ]);
    return { notifications, total };
  },

  async delete(id: string) {
    return prisma.adminNotification.delete({ where: { id } });
  },
};
