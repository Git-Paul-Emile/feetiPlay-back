import type { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "../config/database.js";
import { jsonResponse } from "../utils/response.js";

const MUX_WEBHOOK_SECRET = process.env.MUX_WEBHOOK_SECRET ?? "";

/** Vérifie la signature Mux (HMAC-SHA256) */
function verifyMuxSignature(rawBody: string, signatureHeader: string): boolean {
  if (!MUX_WEBHOOK_SECRET) return true; // En dev, skip si pas configuré

  // Header format: "t=TIMESTAMP,v1=SIGNATURE"
  const parts = signatureHeader.split(",");
  const tPart = parts.find(p => p.startsWith("t="));
  const v1Part = parts.find(p => p.startsWith("v1="));
  if (!tPart || !v1Part) return false;

  const timestamp = tPart.slice(2);
  const signature = v1Part.slice(3);
  const payload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", MUX_WEBHOOK_SECRET).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/mux
 * Reçoit les événements Mux et met à jour les StreamingEvents en conséquence.
 */
export async function handleMuxWebhook(req: Request, res: Response): Promise<void> {
  const signatureHeader = req.headers["mux-signature"] as string ?? "";
  const rawBody = JSON.stringify(req.body);

  if (!verifyMuxSignature(rawBody, signatureHeader)) {
    res.status(401).json({ message: "Signature invalide" });
    return;
  }

  const { type, data } = req.body as { type: string; data: Record<string, unknown> };
  console.log(`[Mux Webhook] event: ${type}`);

  try {
    switch (type) {
      // Le live a démarré
      case "video.live_stream.active": {
        const muxStreamId = data.id as string;
        await prisma.streamingEvent.updateMany({
          where: { muxStreamId },
          data: { isLive: true },
        });
        console.log(`[Mux Webhook] Stream ${muxStreamId} → isLive=true`);
        break;
      }

      // Le live est terminé (inactif / idle)
      case "video.live_stream.idle": {
        const muxStreamId = data.id as string;
        await prisma.streamingEvent.updateMany({
          where: { muxStreamId },
          data: { isLive: false, isReplay: true },
        });
        console.log(`[Mux Webhook] Stream ${muxStreamId} → isLive=false, isReplay=true`);
        break;
      }

      // Le live a été désactivé manuellement
      case "video.live_stream.disabled": {
        const muxStreamId = data.id as string;
        await prisma.streamingEvent.updateMany({
          where: { muxStreamId },
          data: { isLive: false, isReplay: true },
        });
        console.log(`[Mux Webhook] Stream ${muxStreamId} désactivé → isReplay=true`);
        break;
      }

      // Un asset VOD est prêt (replay généré après la fin du live)
      case "video.asset.ready": {
        // passthrough = eventId FeetiPlay (défini dans new_asset_settings.passthrough à la création)
        const eventId = data.passthrough as string | undefined;
        if (eventId) {
          const playbackIds = data.playback_ids as Array<{ id: string; policy: string }> | undefined;
          const playbackId = playbackIds?.find(p => p.policy === "public")?.id;
          if (playbackId) {
            await prisma.streamingEvent.update({
              where: { id: eventId },
              data: { streamUrl: playbackId, isReplay: true, isLive: false },
            });
            console.log(`[Mux Webhook] VOD prêt pour event ${eventId}, playbackId: ${playbackId}`);
          }
        }
        break;
      }

      default:
        // Ignorer les autres événements
        break;
    }

    res.status(200).json(jsonResponse({ status: "success", message: "Webhook traité" }));
  } catch (err) {
    console.error("[Mux Webhook] Erreur:", err);
    res.status(500).json({ message: "Erreur interne" });
  }
}
