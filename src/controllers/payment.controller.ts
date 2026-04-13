/**
 * ═══════════════════════════════════════════════════════════════════════
 *  CONTROLLER PAIEMENT feetiPlay
 *  Proxy vers feeti2 pour le traitement des paiements.
 *  feetiPlay utilise le même processus de paiement que feeti2.
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { emailService } from "../services/email.service.js";
import { randomUUID } from "crypto";

const FEETI2_API_URL = () => process.env.FEETI2_API_URL ?? "http://localhost:8000/api";

// ─── Helper : forwarder la requête vers feeti2 ────────────────────────

async function proxyToFeeti2(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
  authHeader?: string
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${FEETI2_API_URL()}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ─── POST /api/payments/stripe/create-intent ─────────────────────────

export async function createStripeIntent(req: Request, res: Response): Promise<void> {
  const result = await proxyToFeeti2("/payments/stripe/create-intent", "POST", req.body);
  res.status(result.status).json(result.data);
}

// ─── POST /api/payments/mobile-money/initialize ──────────────────────

export async function initializeMobileMoney(req: Request, res: Response): Promise<void> {
  const result = await proxyToFeeti2("/payments/mobile-money/initialize", "POST", req.body);
  res.status(result.status).json(result.data);
}

// ─── GET /api/payments/mobile-money/status/:txId ─────────────────────

export async function getMobileMoneyStatus(req: Request, res: Response): Promise<void> {
  const txId = String(req.params["txId"]);
  const result = await proxyToFeeti2(`/payments/mobile-money/status/${txId}`, "GET");
  res.status(result.status).json(result.data);
}

// ─── POST /api/payments/paystack/initialize ──────────────────────────

export async function initializePaystack(req: Request, res: Response): Promise<void> {
  const result = await proxyToFeeti2("/payments/paystack/initialize", "POST", req.body);
  res.status(result.status).json(result.data);
}

// ─── POST /api/payments/confirm (streaming ticket) ───────────────────
// Si l'event est un event feeti2 (source=feeti2), proxy vers feeti2.
// Sinon : créer un accès streaming local + envoyer email.

export async function confirmPayment(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const {
    eventId,
    eventSource,      // "feeti2" | "feetiplay"
    holderName,
    holderEmail,
    holderPhone,
    items,
    paymentProvider,
    paymentId,
    // Pour streaming local feetiPlay
    eventTitle,
    eventDate,
    eventTime,
    price,
    currency,
  } = req.body as Record<string, any>;

  if (!holderEmail || !holderName) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Nom et email requis" });
    return;
  }

  // Cas 1 : Événement feeti2 → proxy complet
  if (eventSource === "feeti2" && eventId) {
    const result = await proxyToFeeti2(
      "/payments/confirm",
      "POST",
      req.body,
      authHeader
    );
    res.status(result.status).json(result.data);
    return;
  }

  // Cas 2 : Événement feetiPlay natif (live streaming local)
  // Pas de ticketing physique — on génère juste un accès + email
  const orderId = randomUUID();
  const accessCode = `FP-${orderId.slice(0, 8).toUpperCase()}`;

  // Envoyer email de confirmation streaming
  emailService
    .sendStreamingTicket(holderEmail, {
      holderName,
      eventTitle: eventTitle || "Événement Streaming",
      eventDate: eventDate || new Date().toLocaleDateString("fr-FR"),
      eventTime: eventTime || "",
      orderId,
      price,
      currency,
    })
    .catch((err) => console.error("[email] Échec envoi accès streaming:", err));

  res.status(StatusCodes.CREATED).json({
    status: "success",
    message: "Accès streaming créé",
    data: {
      orderId,
      accessCode,
      holderName,
      holderEmail,
      eventTitle,
      emailSent: true,
    },
  });
}
