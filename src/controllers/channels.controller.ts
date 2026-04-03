import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { channelsService } from "../services/channels.service.js";
import { jsonResponse } from "../utils/response.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";

export const getAllChannels = controllerWrapper(async (req: Request, res: Response) => {
  const { q, category } = req.query as Record<string, string>;
  let channels;
  if (q) {
    channels = await channelsService.search(q);
  } else if (category) {
    channels = await channelsService.getByCategory(category);
  } else {
    channels = await channelsService.getAll();
  }
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Chaînes récupérées", data: channels })
  );
});

export const getChannelById = controllerWrapper(async (req: Request, res: Response) => {
  const channel = await channelsService.getById(req.params.id!);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Chaîne récupérée", data: channel })
  );
});

export const getChannelBySlug = controllerWrapper(async (req: Request, res: Response) => {
  const channel = await channelsService.getBySlug(req.params.slug!);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Chaîne récupérée", data: channel })
  );
});
