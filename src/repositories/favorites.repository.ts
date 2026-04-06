import { prisma } from "../config/database.js";

export const favoritesRepository = {
  async isFavorited(userId: string, eventId: string) {
    const fav = await prisma.userFavorite.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    return fav !== null;
  },

  async toggleFavorite(userId: string, eventId: string): Promise<boolean> {
    const existing = await prisma.userFavorite.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      await prisma.userFavorite.delete({ where: { id: existing.id } });
      return false;
    } else {
      await prisma.userFavorite.create({ data: { userId, eventId } });
      return true;
    }
  },

  async findFavoritesByUser(userId: string) {
    const favs = await prisma.userFavorite.findMany({
      where: { userId },
      include: {
        streamingEvent: {
          include: { channel: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return favs.map(f => f.streamingEvent);
  },
};