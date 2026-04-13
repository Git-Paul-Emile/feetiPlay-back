import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/authenticate.js";
import {
  getStats,
  getRecentEvents,
  getRecentTickets,
  getChannels,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  createEvent,
  updateEvent,
  deleteEvent,
  getLogs,
  createLog,
  getNotifications,
  sendNotification,
  deleteNotification,
  createMuxLiveStream,
  getMuxLiveStreamStatus,
  disableMuxLiveStream,
  getStreamingAnalytics,
} from "../controllers/admin.controller.js";

const router = Router();

// Toutes les routes admin nécessitent une authentification
router.use(authenticate);

// ── Stats & dashboard — accessible à tous les rôles admin ─────────────────
router.get(
  "/stats",
  requireRole("admin", "super_admin", "moderator", "finance", "marketing"),
  getStats
);
router.get(
  "/events/recent",
  requireRole("admin", "super_admin", "moderator", "finance", "marketing"),
  getRecentEvents
);
router.get(
  "/tickets/recent",
  requireRole("admin", "super_admin", "finance"),
  getRecentTickets
);
router.get(
  "/channels",
  requireRole("admin", "super_admin", "moderator", "finance", "marketing"),
  getChannels
);

// ── Utilisateurs — lecture pour moderator+, écriture pour admin+ ──────────
router.get(
  "/users",
  requireRole("admin", "super_admin", "moderator", "finance", "marketing"),
  getUsers
);
router.get(
  "/users/:id",
  requireRole("admin", "super_admin", "moderator"),
  getUserById
);
router.patch(
  "/users/:id/role",
  requireRole("admin", "super_admin"),
  updateUserRole
);
router.delete(
  "/users/:id",
  requireRole("admin", "super_admin"),
  deleteUser
);

// ── System Logs ───────────────────────────────────────────────────────────
router.get(
  "/logs",
  requireRole("admin", "super_admin", "moderator", "finance", "marketing"),
  getLogs
);
router.post(
  "/logs",
  requireRole("admin", "super_admin", "moderator", "finance", "marketing"),
  createLog
);

// ── Notifications ─────────────────────────────────────────────────────────
router.get(
  "/notifications",
  requireRole("admin", "super_admin", "marketing"),
  getNotifications
);
router.post(
  "/notifications",
  requireRole("admin", "super_admin", "marketing"),
  sendNotification
);
router.delete(
  "/notifications/:id",
  requireRole("admin", "super_admin"),
  deleteNotification
);

// ── Events CRUD ───────────────────────────────────────────────────────────
router.post(
  "/events",
  requireRole("admin", "super_admin"),
  createEvent
);
router.patch(
  "/events/:id",
  requireRole("admin", "super_admin"),
  updateEvent
);
router.delete(
  "/events/:id",
  requireRole("admin", "super_admin"),
  deleteEvent
);

// ── Analytics streaming ───────────────────────────────────────────────────
router.get(
  "/analytics/streaming",
  requireRole("admin", "super_admin", "moderator", "finance", "marketing"),
  getStreamingAnalytics
);

// ── Mux Live Stream ───────────────────────────────────────────────────────
router.post(
  "/mux/live-streams",
  requireRole("admin", "super_admin"),
  createMuxLiveStream
);
router.get(
  "/mux/live-streams/:streamId/status",
  requireRole("admin", "super_admin"),
  getMuxLiveStreamStatus
);
router.post(
  "/mux/live-streams/:streamId/disable",
  requireRole("admin", "super_admin"),
  disableMuxLiveStream
);

export default router;
