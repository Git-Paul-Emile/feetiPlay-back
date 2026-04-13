import { Router } from "express";
import { adminLogin, adminLogout, adminMe, adminRefresh, adminUpdateProfile } from "../controllers/adminAuth.controller.js";
import { validateBody } from "../middlewares/validateBody.js";
import { authenticate, requireRole } from "../middlewares/authenticate.js";
import { adminLoginSchema } from "../validators/adminAuth.validator.js";

const router = Router();

router.post("/login",   validateBody(adminLoginSchema), adminLogin);
router.post("/logout",                                  adminLogout);
router.post("/refresh",                                 adminRefresh);
router.get(  "/me",     authenticate, requireRole("admin", "super_admin", "moderator", "finance", "marketing"), adminMe);
router.patch("/me",     authenticate, requireRole("admin", "super_admin", "moderator", "finance", "marketing"), adminUpdateProfile);

export default router;
