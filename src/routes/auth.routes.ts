import { Router } from "express";
import { register, login, logout, me, refresh, updateProfile, changePassword, deleteAccount } from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validateBody.js";
import { authenticate } from "../middlewares/authenticate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login",    validateBody(loginSchema),    login);
router.post("/logout",                                 logout);
router.post("/refresh",                                refresh);
router.get(   "/me",       authenticate,              me);
router.patch( "/profile",  authenticate,              updateProfile);
router.patch( "/password", authenticate,              changePassword);
router.delete("/account",  authenticate,              deleteAccount);

export default router;
