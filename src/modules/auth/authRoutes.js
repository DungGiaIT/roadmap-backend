import express from "express";
import { login, logout, me, refresh, register } from "./authController.js";
import { createRateLimiter } from "../../middleware/requestMiddleware.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();
const authLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many authentication requests",
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, me);

export default router;
