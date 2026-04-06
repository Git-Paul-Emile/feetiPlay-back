import { Router } from "express";
import {
  deleteFeeti2LiveEvent,
  getFeeti2Events,
  getFeeti2LiveEventById,
  getFeeti2LiveEvents,
  syncFeeti2LiveEvent,
} from "../controllers/integration.controller.js";

const router = Router();

const requireSyncSecret = (req, res, next) => {
  const expectedSecret = process.env.FEETI_SYNC_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({ message: "FEETI_SYNC_SECRET non configuré" });
  }

  const receivedSecret = req.header("x-feeti-sync-secret");
  if (receivedSecret !== expectedSecret) {
    return res.status(403).json({ message: "Accès intégration refusé" });
  }

  next();
};

// Public — expose les événements feeti2 au frontend feetiPlay
router.get("/feeti2-events", getFeeti2Events);

// Privé — synchronisation feeti2 -> feetiPlay
router.get("/feeti2-live-events", requireSyncSecret, getFeeti2LiveEvents);
router.get("/feeti2-live-events/:id", requireSyncSecret, getFeeti2LiveEventById);
router.post("/feeti2-live-events", requireSyncSecret, syncFeeti2LiveEvent);
router.delete("/feeti2-live-events/:id", requireSyncSecret, deleteFeeti2LiveEvent);

export default router;
