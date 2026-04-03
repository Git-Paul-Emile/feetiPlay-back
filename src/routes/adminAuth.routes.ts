import { Router } from "express";
import { adminLogin, adminLogout, adminMe, adminRefresh } from "../controllers/adminAuth.controller.js";
import { validateBody } from "../middlewares/validateBody.js";
import { authenticate } from "../middlewares/authenticate.js";
import { adminLoginSchema } from "../validators/adminAuth.validator.js";

const router = Router();

router.post("/login",   validateBody(adminLoginSchema), adminLogin);
router.post("/logout",                                  adminLogout);
router.post("/refresh",                                 adminRefresh);
router.get( "/me",      authenticate,                   adminMe);

export default router;
