import { Router } from "express";
import { handleMuxWebhook } from "../controllers/webhook.controller.js";

const router = Router();

// Mux envoie le body en JSON — pas besoin d'auth, vérifié par signature HMAC
router.post("/mux", handleMuxWebhook);

export default router;
