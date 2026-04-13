import type { Response } from "express";
import { prisma } from "../config/database.js";

/** Map eventId → Set de Response SSE */
const clients = new Map<string, Set<Response>>();

/** Intervalle de persistance en DB (ms) */
const DB_PERSIST_INTERVAL = 15_000;

/** Retourne le nombre de viewers actifs pour un event */
export function getViewerCount(eventId: string): number {
  return clients.get(eventId)?.size ?? 0;
}

/** Enregistre un client SSE et lui envoie le compte courant */
export function addViewer(eventId: string, res: Response): void {
  if (!clients.has(eventId)) clients.set(eventId, new Set());
  clients.get(eventId)!.add(res);
  broadcastCount(eventId);
  persistViewerCount(eventId);
}

/** Retire un client SSE et met à jour les autres */
export function removeViewer(eventId: string, res: Response): void {
  const set = clients.get(eventId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(eventId);
  broadcastCount(eventId);
  persistViewerCount(eventId);
}

/** Envoie le compte à tous les clients d'un event */
function broadcastCount(eventId: string): void {
  const count = getViewerCount(eventId);
  const data = `data: ${JSON.stringify({ eventId, viewerCount: count })}\n\n`;
  clients.get(eventId)?.forEach(res => {
    try { res.write(data); } catch { /* client déconnecté */ }
  });
}

/** Persiste le viewer count en DB (throttled) */
const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

function persistViewerCount(eventId: string): void {
  if (persistTimers.has(eventId)) clearTimeout(persistTimers.get(eventId)!);
  persistTimers.set(eventId, setTimeout(async () => {
    const count = getViewerCount(eventId);
    await prisma.streamingEvent.updateMany({
      where: { id: eventId, isLive: true },
      data: { viewerCount: count },
    }).catch(() => { /* silencieux si l'event n'existe pas */ });
    persistTimers.delete(eventId);
  }, DB_PERSIST_INTERVAL));
}

/** Ping keep-alive pour tous les clients (evite timeout) */
setInterval(() => {
  clients.forEach((set) => {
    set.forEach(res => {
      try { res.write(": keep-alive\n\n"); } catch { /* ignore */ }
    });
  });
}, 25_000);
