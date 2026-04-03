import dotenv from "dotenv";
import { connectToDatabase } from "./config/database.js";
import app from "./config/app.js";

dotenv.config();

const initializeApp = async () => {
  try {
    const PORT = process.env.PORT || 8001;
    app.listen(PORT, () => {
      console.log(`✅ FeetiPlay API démarrée sur http://localhost:${PORT}`);
    });
    await connectToDatabase();
  } catch (err) {
    console.error("❌ Erreur DB :", err);
    process.exit(1);
  }
};

initializeApp();
