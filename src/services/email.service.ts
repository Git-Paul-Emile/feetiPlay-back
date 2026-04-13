/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SERVICE EMAIL feetiPlay — ARCHITECTURE PLUGGABLE
 *  Même interface que feeti2. Pour changer de provider : implémenter
 *  IEmailProvider et mettre à jour getEmailProvider().
 * ═══════════════════════════════════════════════════════════════════════
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailProvider {
  send(options: EmailOptions): Promise<void>;
}

// ─── Provider Nodemailer (SMTP) ───────────────────────────────────────

class NodemailerProvider implements IEmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || "FeetiPlay <noreply@feetiplay.app>",
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}

function getEmailProvider(): IEmailProvider {
  const provider = process.env.EMAIL_PROVIDER || "nodemailer";
  switch (provider) {
    case "nodemailer":
    default:
      return new NodemailerProvider();
  }
}

// ─── Templates ────────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>FeetiPlay</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
        <!-- Header -->
        <tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">
          <h1 style="margin:0;color:#cdff71;font-size:28px;font-weight:800;">FeetiPlay</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:13px;">Votre plateforme de streaming</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);">
          <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">© ${new Date().getFullYear()} FeetiPlay. Tous droits réservés.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function templateStreamingTicket(data: {
  holderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  streamUrl?: string;
  orderId: string;
  price?: number;
  currency?: string;
}): string {
  return baseLayout(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:rgba(205,255,113,0.15);border:1px solid rgba(205,255,113,0.3);border-radius:50%;padding:16px;margin-bottom:16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cdff71" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h2 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Accès confirmé !</h2>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:16px;">Merci ${data.holderName}</p>
    </div>

    <div style="background:rgba(205,255,113,0.05);border:1px solid rgba(205,255,113,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#cdff71;">${data.eventTitle}</h3>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px;width:100px;">Date</td><td style="padding:4px 0;color:#ffffff;font-size:14px;">${data.eventDate}</td></tr>
        <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">Heure</td><td style="padding:4px 0;color:#ffffff;font-size:14px;">${data.eventTime}</td></tr>
        ${data.price ? `<tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">Prix</td><td style="padding:4px 0;color:#cdff71;font-size:14px;font-weight:700;">${data.price.toLocaleString("fr-FR")} ${data.currency || "FCFA"}</td></tr>` : ""}
        <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">Commande</td><td style="padding:4px 0;color:#ffffff;font-size:13px;font-family:monospace;">${data.orderId.slice(0, 8).toUpperCase()}</td></tr>
      </table>
    </div>

    ${
      data.streamUrl
        ? `<div style="text-align:center;margin-bottom:24px;">
            <a href="${data.streamUrl}" style="display:inline-block;background:#cdff71;color:#000000;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;">
              ▶ Accéder au streaming
            </a>
            <p style="margin:12px 0 0;color:rgba(255,255,255,0.4);font-size:12px;">Le lien sera actif 30 minutes avant le début de l'événement.</p>
          </div>`
        : `<p style="text-align:center;color:rgba(255,255,255,0.6);font-size:14px;">Le lien de streaming vous sera envoyé 30 minutes avant le début de l'événement.</p>`
    }
  `);
}

// ─── Service singleton ─────────────────────────────────────────────────

class EmailService {
  private provider: IEmailProvider = getEmailProvider();

  async sendStreamingTicket(
    to: string,
    data: Parameters<typeof templateStreamingTicket>[0]
  ): Promise<void> {
    await this.provider.send({
      to,
      subject: `🎬 Votre accès streaming pour « ${data.eventTitle} » — FeetiPlay`,
      html: templateStreamingTicket(data),
      text: `Bonjour ${data.holderName}, votre accès streaming pour ${data.eventTitle} le ${data.eventDate} est confirmé.`,
    });
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.provider.send({ to, subject, html });
  }
}

export const emailService = new EmailService();
