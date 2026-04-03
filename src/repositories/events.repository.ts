import { prisma } from "../config/database.js";

export const eventsRepository = {
  async findAll() {
    return prisma.streamingEvent.findMany({ orderBy: { createdAt: "desc" } });
  },

  async findById(id: string) {
    return prisma.streamingEvent.findUnique({ where: { id } });
  },

  async findLive() {
    return prisma.streamingEvent.findMany({
      where: { isLive: true },
      orderBy: { viewerCount: "desc" },
    });
  },

  async findReplays() {
    return prisma.streamingEvent.findMany({
      where: { isReplay: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async findFeatured() {
    return prisma.streamingEvent.findMany({
      where: { isFeatured: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async findByChannel(channelId: string) {
    return prisma.streamingEvent.findMany({
      where: { channelId },
      orderBy: { date: "desc" },
    });
  },

  async findByCategory(category: string) {
    return prisma.streamingEvent.findMany({
      where: { category: { equals: category, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    });
  },

  async search(query: string) {
    return prisma.streamingEvent.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { channelName: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateViewerCount(id: string, count: number) {
    return prisma.streamingEvent.update({
      where: { id },
      data: { viewerCount: count },
    });
  },
};
