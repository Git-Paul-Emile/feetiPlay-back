import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { streamingService } from "../services/streaming.service.js";
import { jsonResponse } from "../utils/response.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import { addViewer, removeViewer, getViewerCount } from "../services/viewerCount.service.js";
import { muxService } from "../services/mux.service.js";
import { eventsRepository } from "../repositories/events.repository.js";

export const checkAccess = controllerWrapper(async (req: Request, res: Response) => {
  const result = await streamingService.checkAccess(req.params.eventId!, req.user!.userId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Accès vérifié", data: result })
  );
});

export const purchaseTicket = controllerWrapper(async (req: Request, res: Response) => {
  const { eventId, holderName, holderEmail } = req.body as {
    eventId: string; holderName: string; holderEmail: string;
  };
  const ticket = await streamingService.purchaseTicket({
    eventId,
    userId: req.user!.userId,
    holderName,
    holderEmail,
  });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Ticket acheté avec succès", data: ticket })
  );
});

export const getMyTickets = controllerWrapper(async (req: Request, res: Response) => {
  const tickets = await streamingService.getMyTickets(req.user!.userId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Tickets récupérés", data: tickets })
  );
});

export const getTicketById = controllerWrapper(async (req: Request, res: Response) => {
  const ticket = await streamingService.getTicketById(req.params.id!, req.user!.userId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Ticket récupéré", data: ticket })
  );
});

export const updateWatchProgress = controllerWrapper(async (req: Request, res: Response) => {
  const { eventId, eventTitle, progress, duration } = req.body as {
    eventId: string; eventTitle: string; progress: number; duration: string;
  };
  await streamingService.updateWatchProgress(req.user!.userId, eventId, eventTitle, progress, duration);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Progression mise à jour" })
  );
});

export const getWatchHistory = controllerWrapper(async (req: Request, res: Response) => {
  const history = await streamingService.getWatchHistory(req.user!.userId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Historique récupéré", data: history })
  );
});

export const clearWatchHistory = controllerWrapper(async (req: Request, res: Response) => {
  await streamingService.clearWatchHistory(req.user!.userId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Historique effacé" })
  );
});

// ── Signed Mux token ──────────────────────────────────────────────────────────

/**
 * GET /streaming/mux-token/:eventId
 * Retourne un signed JWT Mux pour les events payants (playback_policy: "signed").
 * Vérifie que l'utilisateur a bien accès (billet valide ou event gratuit).
 */
export const getMuxToken = controllerWrapper(async (req: Request, res: Response) => {
  const { eventId } = req.params as { eventId: string };
  const userId = req.user!.userId;

  const access = await streamingService.checkAccess(eventId, userId);
  if (!access.hasAccess) {
    res.status(StatusCodes.FORBIDDEN).json(
      jsonResponse({ status: "error", message: "Accès refusé — billet requis" })
    );
    return;
  }

  const event = await eventsRepository.findById(eventId);
  if (!event?.streamUrl) {
    res.status(StatusCodes.NOT_FOUND).json(
      jsonResponse({ status: "error", message: "Flux vidéo introuvable" })
    );
    return;
  }

  // Si MUX_SIGNING_KEY_ID n'est pas configuré, retourne null (playback public)
  if (!process.env.MUX_SIGNING_KEY_ID) {
    res.status(StatusCodes.OK).json(
      jsonResponse({ status: "success", message: "Playback public", data: { token: null, playbackId: event.streamUrl } })
    );
    return;
  }

  const token = muxService.createSignedToken(event.streamUrl);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Token généré", data: { token, playbackId: event.streamUrl } })
  );
});

// ── SSE Viewer count ──────────────────────────────────────────────────────────

/**
 * GET /streaming/live/:eventId/viewers
 * SSE — pas d'auth requise, compte public.
 * Le client se connecte et reçoit le viewerCount en temps réel.
 */
export function liveViewerCount(req: Request, res: Response): void {
  const { eventId } = req.params as { eventId: string };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Nginx: désactive le buffering
  res.flushHeaders();

  // Envoie le compte immédiatement à la connexion
  res.write(`data: ${JSON.stringify({ eventId, viewerCount: getViewerCount(eventId) })}\n\n`);

  addViewer(eventId, res);

  req.on("close", () => {
    removeViewer(eventId, res);
  });
}
