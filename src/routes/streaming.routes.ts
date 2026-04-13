import { Router } from "express";
import {
  checkAccess,
  purchaseTicket,
  getMyTickets,
  getTicketById,
  updateWatchProgress,
  getWatchHistory,
  clearWatchHistory,
  liveViewerCount,
  getMuxToken,
} from "../controllers/streaming.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

// Accès stream
router.get("/access/:eventId", authenticate, checkAccess);

// Tickets
router.post("/tickets",    authenticate, purchaseTicket);
router.get( "/tickets",    authenticate, getMyTickets);
router.get( "/tickets/:id", authenticate, getTicketById);

// Historique
router.get(   "/watch-history", authenticate, getWatchHistory);
router.post(  "/watch-history", authenticate, updateWatchProgress);
router.delete("/watch-history", authenticate, clearWatchHistory);

// Signed token Mux (pour playback sécurisé des events payants)
router.get("/mux-token/:eventId", authenticate, getMuxToken);

// SSE viewer count (pas d'auth — accès public)
router.get("/live/:eventId/viewers", liveViewerCount);

export default router;
