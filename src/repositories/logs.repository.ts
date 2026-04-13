import { prisma } from "../config/database.js";

export interface CreateLogInput {
  action: string;
  description: string;
  level?: "info" | "success" | "warning" | "error";
  adminName: string;
  adminRole: string;
  ipAddress?: string;
}

export const logsRepository = {
  async create(data: CreateLogInput) {
    return prisma.systemLog.create({
      data: {
        action: data.action,
        description: data.description,
        level: data.level ?? "info",
        adminName: data.adminName,
        adminRole: data.adminRole,
        ipAddress: data.ipAddress,
      },
    });
  },

  async findAll(options?: {
    level?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (options?.level) where.level = options.level;
    if (options?.search) {
      where.OR = [
        { action: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
        { adminName: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 100,
        skip: options?.offset ?? 0,
      }),
      prisma.systemLog.count({ where }),
    ]);

    return { logs, total };
  },
};
