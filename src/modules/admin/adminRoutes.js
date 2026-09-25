import express from "express";
import { prisma } from "../../config/db.js";
import { sendData } from "../../common/http.js";
import { authorizeRoles, protect } from "../../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorizeRoles("EDITOR", "ADMIN"));

router.get("/moderation", async (req, res) => {
    const recipes = await prisma.recipe.findMany({
        where: { status: "PENDING_REVIEW" },
        orderBy: { updatedAt: "asc" },
        include: { author: { select: { id: true, displayName: true, email: true } }, category: true },
    });
    return sendData(res, { recipes });
});

router.get("/audit-logs", authorizeRoles("ADMIN"), async (_req, res) => {
    const auditLogs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { actor: { select: { id: true, displayName: true, email: true } } },
    });
    return sendData(res, { auditLogs });
});

export default router;
