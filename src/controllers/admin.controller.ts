import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { adminRepository } from "../repositories/admin.repository.js";
import type { AdminEventInput } from "../repositories/admin.repository.js";
import { logsRepository } from "../repositories/logs.repository.js";
import type { CreateLogInput } from "../repositories/logs.repository.js";
import { notificationsRepository } from "../repositories/notifications.repository.js";
import type { CreateNotificationInput } from "../repositories/notifications.repository.js";
import { jsonResponse } from "../utils/response.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import { AppError } from "../utils/AppError.js";
import type { UserRole } from "../generated/prisma/client.js";
import { muxService } from "../services/mux.service.js";

const ALLOWED_USER_ROLES: UserRole[] = ["viewer", "premium", "streamer", "admin", "super_admin"];

// ── Analytics streaming ────────────────────────────────────────────────────

export const getStreamingAnalytics = controllerWrapper(async (_req: Request, res: Response) => {
  const data = await adminRepository.getStreamingAnalytics();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Analytics streaming récupérées", data })
  );
});

// ── Stats ─────────────────────────────────────────────────────────────────

export const getStats = controllerWrapper(async (_req: Request, res: Response) => {
  const stats = await adminRepository.getStats();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statistiques récupérées", data: stats })
  );
});

// ── Événements récents ────────────────────────────────────────────────────

export const getRecentEvents = controllerWrapper(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const events = await adminRepository.getRecentEvents(limit);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événements récupérés", data: events })
  );
});

// ── Tickets récents ───────────────────────────────────────────────────────

export const getRecentTickets = controllerWrapper(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const tickets = await adminRepository.getRecentTickets(limit);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Tickets récupérés", data: tickets })
  );
});

// ── Channels ──────────────────────────────────────────────────────────────

export const getChannels = controllerWrapper(async (_req: Request, res: Response) => {
  const channels = await adminRepository.getAllChannels();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Chaînes récupérées", data: channels })
  );
});

// ── Utilisateurs ──────────────────────────────────────────────────────────

export const getUsers = controllerWrapper(async (req: Request, res: Response) => {
  const role = req.query.role as UserRole | undefined;
  const search = req.query.search as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { users, total } = await adminRepository.getAllUsers({ role, search, limit, offset });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Utilisateurs récupérés", data: { users, total, limit, offset } })
  );
});

export const getUserById = controllerWrapper(async (req: Request, res: Response) => {
  const user = await adminRepository.getUserById(req.params.id);
  if (!user) throw new AppError("Utilisateur introuvable", StatusCodes.NOT_FOUND);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Utilisateur récupéré", data: user })
  );
});

export const updateUserRole = controllerWrapper(async (req: Request, res: Response) => {
  const { role } = req.body as { role: UserRole };
  if (!role || !ALLOWED_USER_ROLES.includes(role)) {
    throw new AppError(`Rôle invalide. Valeurs acceptées : ${ALLOWED_USER_ROLES.join(", ")}`, StatusCodes.BAD_REQUEST);
  }
  const user = await adminRepository.getUserById(req.params.id);
  if (!user) throw new AppError("Utilisateur introuvable", StatusCodes.NOT_FOUND);

  const updated = await adminRepository.updateUserRole(req.params.id, role);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Rôle mis à jour", data: updated })
  );
});

export const deleteUser = controllerWrapper(async (req: Request, res: Response) => {
  const user = await adminRepository.getUserById(req.params.id);
  if (!user) throw new AppError("Utilisateur introuvable", StatusCodes.NOT_FOUND);

  await adminRepository.deleteUser(req.params.id);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Utilisateur supprimé" })
  );
});

// ── Admin event CRUD ──────────────────────────────────────────────────────

export const createEvent = controllerWrapper(async (req: Request, res: Response) => {
  const body = req.body as AdminEventInput;
  if (!body.title || !body.channelId || !body.date) {
    throw new AppError("Champs requis manquants : title, channelId, date", StatusCodes.BAD_REQUEST);
  }
  const event = await adminRepository.createEvent({
    ...body,
    tags: body.tags ?? "[]",
    duration: body.duration ?? "",
    image: body.image ?? "",
    currency: body.currency ?? "FCFA",
    isFree: body.price === 0 || body.price == null,
  });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Événement créé", data: event })
  );
});

export const updateEvent = controllerWrapper(async (req: Request, res: Response) => {
  const body = req.body as Partial<AdminEventInput>;
  if (body.price !== undefined) {
    body.isFree = body.price === 0;
  }
  const event = await adminRepository.updateEvent(req.params.id, body);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événement mis à jour", data: event })
  );
});

export const deleteEvent = controllerWrapper(async (req: Request, res: Response) => {
  await adminRepository.deleteEvent(req.params.id);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événement supprimé" })
  );
});

// ── Mux Live Stream ────────────────────────────────────────────────────────

/**
 * POST /admin/mux/live-streams
 * Crée un live stream Mux et retourne le streamKey (OBS) + playbackId (à coller dans streamUrl de l'event).
 */
export const createMuxLiveStream = controllerWrapper(async (req: Request, res: Response) => {
  const { title, eventId } = req.body as { title?: string; eventId?: string };
  const stream = await muxService.createLiveStream(title ?? "Live FeetiPlay", eventId);

  // Si un eventId est fourni, on lie le stream à l'événement automatiquement
  if (eventId) {
    await adminRepository.updateEvent(eventId, {
      muxStreamId: stream.id,
      streamUrl: stream.playbackId,
      isLive: false, // deviendra true quand Mux envoie video.live_stream.active
    } as any);
  }

  res.status(StatusCodes.CREATED).json(
    jsonResponse({
      status: "success",
      message: "Live stream Mux créé",
      data: {
        muxStreamId: stream.id,
        streamKey: stream.streamKey,
        playbackId: stream.playbackId,
        rtmpUrl: "rtmps://global-live.mux.com:443/app",
        status: stream.status,
        linkedEventId: eventId ?? null,
        hint: eventId
          ? `Stream lié à l'événement ${eventId}. Dans OBS : serveur = rtmps://global-live.mux.com:443/app, clé = ${stream.streamKey}.`
          : `Dans OBS : serveur = rtmps://global-live.mux.com:443/app, clé = ${stream.streamKey}. Puis mets le playbackId dans le champ streamUrl de l'événement.`,
      },
    })
  );
});

/**
 * GET /admin/mux/live-streams/:streamId/status
 * Vérifie si un stream est actif.
 */
export const getMuxLiveStreamStatus = controllerWrapper(async (req: Request, res: Response) => {
  const result = await muxService.getLiveStreamStatus(req.params.streamId as string);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statut Mux", data: result })
  );
});

/**
 * POST /admin/mux/live-streams/:streamId/disable
 * Coupe un live stream (fin de direct).
 */
export const disableMuxLiveStream = controllerWrapper(async (req: Request, res: Response) => {
  await muxService.disableLiveStream(req.params.streamId as string);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Live stream désactivé" })
  );
});

// ── System Logs ───────────────────────────────────────────────────────────

const VALID_LEVELS = ["info", "success", "warning", "error"] as const;

export const getLogs = controllerWrapper(async (req: Request, res: Response) => {
  const level = req.query.level as string | undefined;
  const search = req.query.search as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;

  const { logs, total } = await logsRepository.findAll({ level, search, limit, offset });
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Logs récupérés", data: { logs, total, limit, offset } })
  );
});

// ── Notifications ─────────────────────────────────────────────────────────

const VALID_NOTIF_TYPES    = ["info", "warning", "promo", "maintenance"] as const;
const VALID_NOTIF_AUDIENCE = ["all", "premium", "free"] as const;

export const getNotifications = controllerWrapper(async (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query.limit)  || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const { notifications, total } = await notificationsRepository.findAll({ limit, offset });
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Notifications récupérées", data: { notifications, total } })
  );
});

export const sendNotification = controllerWrapper(async (req: Request, res: Response) => {
  const body = req.body as CreateNotificationInput;
  if (!body.title || !body.message) {
    throw new AppError("Champs requis : title, message", StatusCodes.BAD_REQUEST);
  }
  if (body.type && !VALID_NOTIF_TYPES.includes(body.type)) {
    throw new AppError(`Type invalide. Valeurs : ${VALID_NOTIF_TYPES.join(", ")}`, StatusCodes.BAD_REQUEST);
  }
  if (body.audience && !VALID_NOTIF_AUDIENCE.includes(body.audience)) {
    throw new AppError(`Audience invalide. Valeurs : ${VALID_NOTIF_AUDIENCE.join(", ")}`, StatusCodes.BAD_REQUEST);
  }
  const notif = await notificationsRepository.create(body);
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Notification envoyée", data: notif })
  );
});

export const deleteNotification = controllerWrapper(async (req: Request, res: Response) => {
  await notificationsRepository.delete(req.params.id);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Notification supprimée" })
  );
});

export const createLog = controllerWrapper(async (req: Request, res: Response) => {
  const body = req.body as CreateLogInput;
  if (!body.action || !body.description || !body.adminName) {
    throw new AppError("Champs requis : action, description, adminName", StatusCodes.BAD_REQUEST);
  }
  if (body.level && !VALID_LEVELS.includes(body.level)) {
    throw new AppError(`Niveau invalide. Valeurs acceptées : ${VALID_LEVELS.join(", ")}`, StatusCodes.BAD_REQUEST);
  }
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress;

  const log = await logsRepository.create({ ...body, ipAddress });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Log enregistré", data: log })
  );
});
