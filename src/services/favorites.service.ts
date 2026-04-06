import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { eventsRepository } from "../repositories/events.repository.js";
import { favoritesRepository } from "../repositories/favorites.repository.js";

function parseEvent<T extends { tags: string }>(event: T) {
  return {
    ...event,
    tags: (() => { try { return JSON.parse(event.tags) as string[]; } catch { return []; } })(),
  };
}

export const favoritesService = {
  async toggleFavorite(userId: string, eventId: string) {
    const event = await eventsRepository.findById(eventId);
    if (!event) {
      throw new AppError("Événement introuvable", StatusCodes.NOT_FOUND);
    }
    const isFavorited = await favoritesRepository.toggleFavorite(userId, eventId);
    return { isFavorited };
  },

  async isFavorited(userId: string, eventId: string) {
    return favoritesRepository.isFavorited(userId, eventId);
  },

  async getMyFavorites(userId: string) {
    const events = await favoritesRepository.findFavoritesByUser(userId);
    return events.map(parseEvent);
  },
};