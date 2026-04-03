import { Router } from "express";
import { getAllChannels, getChannelById, getChannelBySlug } from "../controllers/channels.controller.js";

const router = Router();

router.get("/",          getAllChannels);
router.get("/:id",       getChannelById);
router.get("/slug/:slug", getChannelBySlug);

export default router;
