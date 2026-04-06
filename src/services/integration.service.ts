/**
 * Service d'intégration feeti2 → feetiPlay
 * Récupère les événements streaming depuis l'API feeti2
 */

export interface Feeti2StreamingEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  image: string;
  category: string;
  isLive: boolean;
  isFeatured: boolean;
  streamUrl: string | null;
  videoUrl: string | null;
  isFree: boolean;
  price: number;
  currency: string;
  channelName: string;
  country: string | null;
  source: "feeti2";
}

export const integrationService = {
  async getFeeti2StreamingEvents(): Promise<Feeti2StreamingEvent[]> {
    const baseUrl = process.env.FEETI2_API_URL ?? "http://localhost:8000/api";
    const url = `${baseUrl}/integration/streaming-events`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      throw new Error(`Erreur feeti2 API: ${res.status}`);
    }
    const json = (await res.json()) as { data: Feeti2StreamingEvent[] };
    return json.data ?? [];
  },
};
