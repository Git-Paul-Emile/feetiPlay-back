import { PrismaClient } from "../generated/prisma/client.js";

let prisma: PrismaClient;

export const connectToDatabase = async () => {
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log("✅ Connecté à la base de données FeetiPlay");
  } catch (err) {
    console.error("❌ Impossible de se connecter à la base de données", err);
    throw err;
  }
};

export { prisma };
