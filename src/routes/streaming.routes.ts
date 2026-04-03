import { Router } from "express";
import {
  checkAccess,
  purchaseTicket,
  getMyTickets,
  getTicketById,
  updateWatchProgress,
  getWatchHistory,
  clearWatchHistory,
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

export default router;
