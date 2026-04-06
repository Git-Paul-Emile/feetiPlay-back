import { prisma } from "../config/database.js";

const FEETI2_CHANNEL_ID = "feeti2-live-channel";
const FEETI2_CHANNEL_SLUG = "feeti2-live";

async function ensureFeeti2Channel() {
  return prisma.channel.upsert({
    where: { slug: FEETI2_CHANNEL_SLUG },
    update: {
      isActive: true,
      category: "Live",
    },
    create: {
      id: FEETI2_CHANNEL_ID,
      name: "Feeti Live",
      slug: FEETI2_CHANNEL_SLUG,
      description: "Canal technique pour les événements live synchronisés depuis feeti2",
      category: "Live",
      isActive: true,
      country: "Multi-pays",
    },
  });
}

export interface SyncedLiveEventInput {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration?: string;
  image?: string;
  category: string;
  isLive?: boolean;
  isFeatured?: boolean;
  streamUrl?: string;
  videoUrl?: string;
  price?: number;
  currency?: string;
  organizerId: string;
  organizerName: string;
  location: string;
}

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

  async findSyncedByOrganizer(organizerId: string) {
    return prisma.streamingEvent.findMany({
      where: {
        tags: { contains: `organizer:${organizerId}` },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async upsertSyncedLiveEvent(data: SyncedLiveEventInput) {
    const channel = await ensureFeeti2Channel();
    const streamUrl = data.isLive ? data.streamUrl : (data.videoUrl ?? data.streamUrl);
    const tags = JSON.stringify([
      "source:feeti2",
      `organizer:${data.organizerId}`,
      data.category,
      data.isLive ? "live" : "replay",
    ]);

    return prisma.streamingEvent.upsert({
      where: { id: data.id },
      update: {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        duration: data.duration ?? "",
        image: data.image ?? "",
        channelId: channel.id,
        channelName: data.organizerName,
        category: data.category,
        tags,
        isLive: data.isLive ?? true,
        isReplay: !(data.isLive ?? true),
        isFeatured: data.isFeatured ?? false,
        isFree: (data.price ?? 0) === 0,
        price: data.price ?? 0,
        currency: data.currency ?? "FCFA",
        streamUrl,
        location: data.location,
      },
      create: {
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        duration: data.duration ?? "",
        image: data.image ?? "",
        channelId: channel.id,
        channelName: data.organizerName,
        category: data.category,
        tags,
        isLive: data.isLive ?? true,
        isReplay: !(data.isLive ?? true),
        isFeatured: data.isFeatured ?? false,
        isFree: (data.price ?? 0) === 0,
        price: data.price ?? 0,
        currency: data.currency ?? "FCFA",
        viewerCount: 0,
        streamUrl,
        location: data.location,
      },
    });
  },

  async deleteById(id: string) {
    return prisma.streamingEvent.delete({ where: { id } });
  },

  async updateViewerCount(id: string, count: number) {
    return prisma.streamingEvent.update({
      where: { id },
      data: { viewerCount: count },
    });
  },
};
