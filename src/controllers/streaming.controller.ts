import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { streamingService } from "../services/streaming.service.js";
import { jsonResponse } from "../utils/response.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";

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
