import dotenv from "dotenv";
import type { Server } from "http";
import { connectToDatabase } from "./config/database.js";
import app from "./config/app.js";

dotenv.config();

const DEFAULT_BACKEND_PORT = 8001;

const listenOnPort = (port: number) =>
  new Promise<Server>((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.once("error", reject);
  });

const initializeApp = async () => {
  try {
    await connectToDatabase();

    const configuredPort = Number(process.env.PORT || DEFAULT_BACKEND_PORT);
    const port = Number.isInteger(configuredPort) && configuredPort > 0
      ? configuredPort
      : DEFAULT_BACKEND_PORT;

    await listenOnPort(port);
    process.env.PORT = String(port);
    console.log(`[feetiplay-back] port configure: ${port}`);
    console.log(`[feetiplay-back] API demarree sur http://localhost:${port}`);
  } catch (err) {
    console.error("Erreur au demarrage :", err);
    process.exit(1);
  }
};

initializeApp();
