import Mux from "@mux/mux-node";
import jwt from "jsonwebtoken";

// Initialisation paresseuse — évite un crash au démarrage si les clés manquent
let _mux: Mux | null = null;

function getMuxClient(): Mux {
  if (!_mux) {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (!tokenId || !tokenSecret) {
      throw new Error("MUX_TOKEN_ID et MUX_TOKEN_SECRET sont requis dans .env");
    }
    _mux = new Mux({ tokenId, tokenSecret });
  }
  return _mux;
}

export interface MuxLiveStream {
  id: string;           // ID du live stream côté Mux
  streamKey: string;    // Clé à entrer dans OBS / logiciel de streaming
  playbackId: string;   // À stocker dans StreamingEvent.streamUrl
  status: string;
}

export const muxService = {
  /**
   * Crée un live stream Mux.
   * Retourne le streamKey (pour OBS) et le playbackId (à stocker dans l'événement).
   */
  async createLiveStream(_title: string, eventId?: string): Promise<MuxLiveStream> {
    const mux = getMuxClient();
    const stream = await mux.video.liveStreams.create({
      playback_policy: ["public"],
      new_asset_settings: {
        playback_policy: ["public"], // Le replay sera aussi public
        passthrough: eventId,        // Permet de retrouver l'event FeetiPlay dans video.asset.ready
      },
      reconnect_window: 60, // 60s pour reconnecter OBS sans couper le stream
      test: true, // Mode test gratuit — watermark Mux visible, à retirer en production
    });

    const playbackId = stream.playback_ids?.[0]?.id;
    if (!playbackId) {
      throw new Error("Mux n'a pas retourné de playback_id");
    }

    return {
      id: stream.id,
      streamKey: stream.stream_key!,
      playbackId,
      status: stream.status,
    };
  },

  /**
   * Récupère le statut d'un live stream Mux.
   */
  async getLiveStreamStatus(streamId: string): Promise<{ status: string; playbackId: string | null }> {
    const mux = getMuxClient();
    const stream = await mux.video.liveStreams.retrieve(streamId);
    return {
      status: stream.status,
      playbackId: stream.playback_ids?.[0]?.id ?? null,
    };
  },

  /**
   * Désactive un live stream Mux (fin de direct).
   */
  async disableLiveStream(streamId: string): Promise<void> {
    const mux = getMuxClient();
    await mux.video.liveStreams.disable(streamId);
  },

  /**
   * Génère un signed JWT Mux pour protéger un playbackId privé.
   * Nécessite MUX_SIGNING_KEY_ID + MUX_SIGNING_PRIVATE_KEY dans .env.
   * Durée de vie : 6h (assez pour un live ou un visionnage de replay).
   *
   * doc: https://docs.mux.com/guides/secure-video-playback
   */
  createSignedToken(playbackId: string, type: "video" | "thumbnail" | "storyboard" = "video"): string {
    const keyId = process.env.MUX_SIGNING_KEY_ID;
    const privateKey = process.env.MUX_SIGNING_PRIVATE_KEY;
    if (!keyId || !privateKey) {
      throw new Error("MUX_SIGNING_KEY_ID et MUX_SIGNING_PRIVATE_KEY requis pour les tokens signés");
    }

    // La clé privée est stockée en base64 dans .env
    const decodedKey = Buffer.from(privateKey, "base64").toString("utf-8");

    return jwt.sign(
      { sub: playbackId, aud: type, exp: Math.floor(Date.now() / 1000) + 6 * 3600 },
      decodedKey,
      { algorithm: "RS256", keyid: keyId }
    );
  },
};
