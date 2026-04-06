import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { eventsService } from "../services/events.service.js";
import { integrationService } from "../services/integration.service.js";
import { jsonResponse } from "../utils/response.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";

/**
 * GET /api/integration/feeti2-events
 * Proxy historique des événements streaming depuis feeti2
 */
export const getFeeti2Events = controllerWrapper(async (_req: Request, res: Response) => {
  const events = await integrationService.getFeeti2StreamingEvents();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événements feeti2 récupérés", data: events })
  );
});

export const getFeeti2LiveEvents = controllerWrapper(async (req: Request, res: Response) => {
  const organizerId = typeof req.query.organizerId === "string" ? req.query.organizerId : undefined;
  const events = organizerId
    ? await eventsService.getSyncedByOrganizer(organizerId)
    : await eventsService.getAll();

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événements live feeti2 récupérés", data: events })
  );
});

export const getFeeti2LiveEventById = controllerWrapper(async (req: Request, res: Response) => {
  const event = await eventsService.getById(req.params.id!);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événement live feeti2 récupéré", data: event })
  );
});

export const syncFeeti2LiveEvent = controllerWrapper(async (req: Request, res: Response) => {
  const event = await eventsService.syncFromFeeti2(req.body);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événement live synchronisé", data: event })
  );
});

export const deleteFeeti2LiveEvent = controllerWrapper(async (req: Request, res: Response) => {
  const result = await eventsService.deleteSyncedEvent(req.params.id!);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événement live supprimé", data: result })
  );
});
