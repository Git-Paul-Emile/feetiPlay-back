import { prisma } from "../config/database.js";
import type { TicketStatus } from "../generated/prisma/client.js";

export const streamingRepository = {
  // ── Tickets ──────────────────────────────────────────────────────────────

  async createTicket(data: {
    eventId: string;
    userId: string;
    holderName: string;
    holderEmail: string;
    qrCode: string;
    price: number;
    currency: string;
    streamUrl?: string;
  }) {
    return prisma.ticket.create({ data });
  },

  async findTicketsByUser(userId: string) {
    return prisma.ticket.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { purchaseDate: "desc" },
    });
  },

  async findTicketById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: { event: true },
    });
  },

  async findTicketByUserAndEvent(userId: string, eventId: string) {
    return prisma.ticket.findFirst({
      where: { userId, eventId, status: "valid" },
    });
  },

  async updateTicketStatus(id: string, status: TicketStatus) {
    return prisma.ticket.update({ where: { id }, data: { status } });
  },

  // ── Watch history ─────────────────────────────────────────────────────────

  async upsertWatchHistory(data: {
    userId: string;
    eventId: string;
    eventTitle: string;
    progress: number;
    duration: string;
  }) {
    return prisma.watchHistory.upsert({
      where: { userId_eventId: { userId: data.userId, eventId: data.eventId } },
      update: { progress: data.progress, watchedAt: new Date(), eventTitle: data.eventTitle },
      create: data,
    });
  },

  async findWatchHistory(userId: string) {
    return prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: "desc" },
      take: 100,
    });
  },

  async clearWatchHistory(userId: string) {
    return prisma.watchHistory.deleteMany({ where: { userId } });
  },
};
