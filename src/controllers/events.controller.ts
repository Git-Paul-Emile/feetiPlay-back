import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { eventsService } from "../services/events.service.js";
import { jsonResponse } from "../utils/response.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";

export const getAllEvents = controllerWrapper(async (req: Request, res: Response) => {
  const { q, category, channelId, live, replay, featured } = req.query as Record<string, string>;

  let events;
  if (q) {
    events = await eventsService.search(q);
  } else if (category) {
    events = await eventsService.getByCategory(category);
  } else if (channelId) {
    events = await eventsService.getByChannel(channelId);
  } else if (live === "true") {
    events = await eventsService.getLive();
  } else if (replay === "true") {
    events = await eventsService.getReplays();
  } else if (featured === "true") {
    events = await eventsService.getFeatured();
  } else {
    events = await eventsService.getAll();
  }

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événements récupérés", data: events })
  );
});

export const getEventById = controllerWrapper(async (req: Request, res: Response) => {
  const event = await eventsService.getById(req.params.id!);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Événement récupéré", data: event })
  );
});
