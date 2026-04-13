import { prisma } from "../config/database.js";
import type { UserRole } from "../generated/prisma/client.js";

export interface AdminEventInput {
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  image: string;
  channelId: string;
  channelName: string;
  category: string;
  tags?: string;
  isLive?: boolean;
  isReplay?: boolean;
  isFeatured?: boolean;
  isFree?: boolean;
  price?: number;
  currency?: string;
  streamUrl?: string;
  location?: string;
}

export const adminRepository = {
  // ── Stats globales ────────────────────────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      newUsersThisMonth,
      totalEvents,
      liveEvents,
      totalTickets,
      ticketsThisMonth,
      revenueResult,
      revenueThisMonth,
      totalChannels,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
      prisma.streamingEvent.count(),
      prisma.streamingEvent.count({ where: { isLive: true } }),
      prisma.ticket.count({ where: { status: "valid" } }),
      prisma.ticket.count({
        where: {
          status: "valid",
          purchaseDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.ticket.aggregate({ _sum: { price: true } }),
      prisma.ticket.aggregate({
        _sum: { price: true },
        where: {
          purchaseDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.channel.count({ where: { isActive: true } }),
    ]);

    return {
      totalUsers,
      newUsersThisMonth,
      totalEvents,
      liveEvents,
      totalTickets,
      ticketsThisMonth,
      totalRevenue: revenueResult._sum.price ?? 0,
      revenueThisMonth: revenueThisMonth._sum.price ?? 0,
      totalChannels,
    };
  },

  // ── Utilisateurs ──────────────────────────────────────────────────────────

  async getAllUsers(options?: { role?: UserRole; search?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (options?.role) where.role = options.role;
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscriptionPlan: true,
          avatar: true,
          createdAt: true,
          _count: { select: { tickets: true, favorites: true, watchHistory: true } },
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        avatar: true,
        createdAt: true,
        _count: { select: { tickets: true, favorites: true, watchHistory: true } },
      },
    });
  },

  async updateUserRole(id: string, role: UserRole) {
    return prisma.user.update({ where: { id }, data: { role } });
  },

  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  // ── Événements récents ────────────────────────────────────────────────────

  async getRecentEvents(limit = 10) {
    return prisma.streamingEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        channel: { select: { name: true } },
        _count: { select: { tickets: true } },
      },
    });
  },

  // ── Tickets récents ───────────────────────────────────────────────────────

  async getRecentTickets(limit = 20) {
    return prisma.ticket.findMany({
      where: { status: "valid" },
      orderBy: { purchaseDate: "desc" },
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } },
      },
    });
  },

  // ── Channels ──────────────────────────────────────────────────────────────

  async getAllChannels() {
    return prisma.channel.findMany({
      orderBy: { subscriberCount: "desc" },
      include: { _count: { select: { events: true } } },
    });
  },

  // ── Analytics streaming ───────────────────────────────────────────────────

  async getStreamingAnalytics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      topByViewers,
      topByWatchSessions,
      totalWatchSessions,
      watchSessionsThisMonth,
      liveCount,
      replayCount,
      categoryGroups,
      avgProgressResult,
    ] = await Promise.all([
      // Top 10 événements par viewer count
      prisma.streamingEvent.findMany({
        where: { viewerCount: { gt: 0 } },
        orderBy: { viewerCount: "desc" },
        take: 10,
        select: { id: true, title: true, category: true, isLive: true, isReplay: true, viewerCount: true, isFree: true },
      }),
      // Top 10 événements par nombre de sessions de visionnage (WatchHistory)
      prisma.watchHistory.groupBy({
        by: ["eventId", "eventTitle"],
        _count: { userId: true },
        _avg: { progress: true },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
      prisma.watchHistory.count(),
      prisma.watchHistory.count({ where: { watchedAt: { gte: monthStart } } }),
      prisma.streamingEvent.count({ where: { isLive: true } }),
      prisma.streamingEvent.count({ where: { isReplay: true } }),
      // Distribution par catégorie
      prisma.streamingEvent.groupBy({
        by: ["category"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
      // Progression moyenne globale
      prisma.watchHistory.aggregate({ _avg: { progress: true } }),
    ]);

    return {
      topByViewers,
      topByWatchSessions: topByWatchSessions.map(g => ({
        eventId: g.eventId,
        eventTitle: g.eventTitle,
        sessions: g._count.userId,
        avgProgress: Math.round(g._avg.progress ?? 0),
      })),
      totalWatchSessions,
      watchSessionsThisMonth,
      liveCount,
      replayCount,
      categoryDistribution: categoryGroups.map(g => ({
        category: g.category,
        count: g._count.id,
      })),
      avgWatchProgress: Math.round(avgProgressResult._avg.progress ?? 0),
    };
  },

  // ── Admin event CRUD ──────────────────────────────────────────────────────

  async createEvent(data: AdminEventInput) {
    return prisma.streamingEvent.create({ data });
  },

  async updateEvent(id: string, data: Partial<AdminEventInput>) {
    return prisma.streamingEvent.update({ where: { id }, data });
  },

  async deleteEvent(id: string) {
    return prisma.streamingEvent.delete({ where: { id } });
  },
};
