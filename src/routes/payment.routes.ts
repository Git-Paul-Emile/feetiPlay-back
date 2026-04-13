import { Router } from "express";
import {
  createStripeIntent,
  initializeMobileMoney,
  getMobileMoneyStatus,
  initializePaystack,
  confirmPayment,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/stripe/create-intent", createStripeIntent);
router.post("/mobile-money/initialize", initializeMobileMoney);
router.get("/mobile-money/status/:txId", getMobileMoneyStatus);
router.post("/paystack/initialize", initializePaystack);
router.post("/confirm", confirmPayment);

export default router;
