import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { toggleFavorite, checkFavorite, getMyFavorites } from "../controllers/favorites.controller.js";

const router = Router();

router.post("/:id/favorite", authenticate, toggleFavorite);
router.get("/:id/favorite", authenticate, checkFavorite);
router.get("/favorites", authenticate, getMyFavorites);

export default router;