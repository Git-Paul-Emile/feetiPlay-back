import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { favoritesService } from "../services/favorites.service.js";
import { jsonResponse } from "../utils/response.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";

export const toggleFavorite = controllerWrapper(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await favoritesService.toggleFavorite(userId, req.params.id);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: result.isFavorited ? "Ajouté aux favoris" : "Retiré des favoris", data: result })
  );
});

export const checkFavorite = controllerWrapper(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const isFavorited = await favoritesService.isFavorited(userId, req.params.id);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "OK", data: { isFavorited } })
  );
});

export const getMyFavorites = controllerWrapper(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const events = await favoritesService.getMyFavorites(userId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Favoris récupérés", data: events })
  );
});