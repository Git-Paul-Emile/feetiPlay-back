import { prisma } from "../config/database.js";

export const channelsRepository = {
  async findAll() {
    return prisma.channel.findMany({
      where: { isActive: true },
      orderBy: { subscriberCount: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.channel.findUnique({ where: { id } });
  },

  async findBySlug(slug: string) {
    return prisma.channel.findUnique({ where: { slug } });
  },

  async findByCategory(category: string) {
    return prisma.channel.findMany({
      where: { isActive: true, category: { equals: category, mode: "insensitive" } },
      orderBy: { subscriberCount: "desc" },
    });
  },

  async search(query: string) {
    return prisma.channel.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { subscriberCount: "desc" },
    });
  },
};
