import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { eventsRepository } from "../repositories/events.repository.js";
import type { SyncedLiveEventInput } from "../repositories/events.repository.js";

function parseTags(raw: string) {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function parseOrganizerId(tags: string[]) {
  return tags.find((tag) => tag.startsWith("organizer:"))?.slice("organizer:".length) ?? "";
}

function parseEvent<T extends { tags: string }>(event: T) {
  const tags = parseTags(event.tags);
  return {
    ...event,
    tags,
    organizerId: parseOrganizerId(tags),
    videoUrl: event.streamUrl ?? null,
  };
}

export const eventsService = {
  async getAll() {
    const events = await eventsRepository.findAll();
    return events.map(parseEvent);
  },

  async getById(id: string) {
    const event = await eventsRepository.findById(id);
    if (!event) throw new AppError("Événement non trouvé", StatusCodes.NOT_FOUND);
    return parseEvent(event);
  },

  async getLive() {
    return (await eventsRepository.findLive()).map(parseEvent);
  },

  async getReplays() {
    return (await eventsRepository.findReplays()).map(parseEvent);
  },

  async getFeatured() {
    return (await eventsRepository.findFeatured()).map(parseEvent);
  },

  async getByChannel(channelId: string) {
    return (await eventsRepository.findByChannel(channelId)).map(parseEvent);
  },

  async getByCategory(category: string) {
    return (await eventsRepository.findByCategory(category)).map(parseEvent);
  },

  async search(query: string) {
    if (!query.trim()) return eventsService.getAll();
    return (await eventsRepository.search(query.trim())).map(parseEvent);
  },

  async syncFromFeeti2(data: SyncedLiveEventInput) {
    const event = await eventsRepository.upsertSyncedLiveEvent(data);
    return parseEvent(event);
  },

  async deleteSyncedEvent(id: string) {
    await eventsRepository.deleteById(id);
    return { deleted: true as const };
  },

  async getSyncedByOrganizer(organizerId: string) {
    return (await eventsRepository.findSyncedByOrganizer(organizerId)).map(parseEvent);
  },
};
