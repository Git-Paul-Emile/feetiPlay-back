import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { eventsRepository } from "../repositories/events.repository.js";

// Désérialise les tags JSON stockés en DB
function parseEvent<T extends { tags: string }>(event: T) {
  return {
    ...event,
    tags: (() => { try { return JSON.parse(event.tags) as string[]; } catch { return []; } })(),
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
};
