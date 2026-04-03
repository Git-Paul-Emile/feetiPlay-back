import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { streamingRepository } from "../repositories/streaming.repository.js";
import { eventsRepository } from "../repositories/events.repository.js";

export const streamingService = {
  // ── Accès au stream ───────────────────────────────────────────────────────

  async checkAccess(eventId: string, userId: string) {
    const event = await eventsRepository.findById(eventId);
    if (!event) throw new AppError("Événement non trouvé", StatusCodes.NOT_FOUND);

    if (event.isFree) {
      return { hasAccess: true, reason: "free", streamUrl: event.streamUrl ?? null };
    }

    const ticket = await streamingRepository.findTicketByUserAndEvent(userId, eventId);
    if (ticket) {
      return { hasAccess: true, reason: "ticket_valid", streamUrl: ticket.streamUrl ?? event.streamUrl ?? null };
    }

    return { hasAccess: false, reason: "no_ticket" };
  },

  // ── Tickets ───────────────────────────────────────────────────────────────

  async purchaseTicket(params: {
    eventId: string;
    userId: string;
    holderName: string;
    holderEmail: string;
  }) {
    const event = await eventsRepository.findById(params.eventId);
    if (!event) throw new AppError("Événement non trouvé", StatusCodes.NOT_FOUND);
    if (event.isFree) throw new AppError("Cet événement est gratuit", StatusCodes.BAD_REQUEST);

    // Vérifier ticket existant
    const existing = await streamingRepository.findTicketByUserAndEvent(params.userId, params.eventId);
    if (existing) throw new AppError("Vous avez déjà un ticket pour cet événement", StatusCodes.CONFLICT);

    const qrCode = `QR_${params.eventId}_${params.userId}_${Date.now()}`;
    const ticket = await streamingRepository.createTicket({
      eventId: params.eventId,
      userId: params.userId,
      holderName: params.holderName,
      holderEmail: params.holderEmail,
      qrCode,
      price: event.price ?? 0,
      currency: event.currency,
      streamUrl: event.streamUrl ?? undefined,
    });

    return {
      ...ticket,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      channelName: event.channelName,
    };
  },

  async getMyTickets(userId: string) {
    const tickets = await streamingRepository.findTicketsByUser(userId);
    return tickets.map(t => ({
      id: t.id,
      eventId: t.eventId,
      eventTitle: t.event.title,
      eventDate: t.event.date,
      eventTime: t.event.time,
      channelName: t.event.channelName,
      holderName: t.holderName,
      holderEmail: t.holderEmail,
      qrCode: t.qrCode,
      status: t.status,
      purchaseDate: t.purchaseDate.toISOString(),
      price: t.price,
      currency: t.currency,
      streamUrl: t.streamUrl ?? undefined,
    }));
  },

  async getTicketById(ticketId: string, userId: string) {
    const ticket = await streamingRepository.findTicketById(ticketId);
    if (!ticket) throw new AppError("Ticket non trouvé", StatusCodes.NOT_FOUND);
    if (ticket.userId !== userId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
    return {
      id: ticket.id,
      eventId: ticket.eventId,
      eventTitle: ticket.event.title,
      eventDate: ticket.event.date,
      eventTime: ticket.event.time,
      channelName: ticket.event.channelName,
      holderName: ticket.holderName,
      holderEmail: ticket.holderEmail,
      qrCode: ticket.qrCode,
      status: ticket.status,
      purchaseDate: ticket.purchaseDate.toISOString(),
      price: ticket.price,
      currency: ticket.currency,
      streamUrl: ticket.streamUrl ?? undefined,
    };
  },

  // ── Historique de visionnage ──────────────────────────────────────────────

  async updateWatchProgress(userId: string, eventId: string, eventTitle: string, progress: number, duration: string) {
    return streamingRepository.upsertWatchHistory({ userId, eventId, eventTitle, progress, duration });
  },

  async getWatchHistory(userId: string) {
    const history = await streamingRepository.findWatchHistory(userId);
    return history.map(h => ({
      eventId: h.eventId,
      eventTitle: h.eventTitle,
      watchedAt: h.watchedAt.toISOString(),
      progress: h.progress,
      duration: h.duration,
    }));
  },

  async clearWatchHistory(userId: string) {
    await streamingRepository.clearWatchHistory(userId);
  },
};
