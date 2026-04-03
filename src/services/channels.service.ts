import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { channelsRepository } from "../repositories/channels.repository.js";

export const channelsService = {
  async getAll() {
    return channelsRepository.findAll();
  },

  async getById(id: string) {
    const channel = await channelsRepository.findById(id);
    if (!channel) throw new AppError("Chaîne non trouvée", StatusCodes.NOT_FOUND);
    return channel;
  },

  async getBySlug(slug: string) {
    const channel = await channelsRepository.findBySlug(slug);
    if (!channel) throw new AppError("Chaîne non trouvée", StatusCodes.NOT_FOUND);
    return channel;
  },

  async getByCategory(category: string) {
    return channelsRepository.findByCategory(category);
  },

  async search(query: string) {
    if (!query.trim()) return channelsRepository.findAll();
    return channelsRepository.search(query.trim());
  },
};
