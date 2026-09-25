import express from "express";
import { prisma } from "../../config/db.js";
import { protect } from "../../middleware/authMiddleware.js";
import { enumValue, sendData, requiredString } from "../../common/http.js";

const router = express.Router();
router.use(protect);

router.get("/preferences", async (req, res) => {
    const preferences = await prisma.userPreference.upsert({
        where: { userId: req.user.id },
        update: {},
        create: { userId: req.user.id },
    });
    return sendData(res, { preferences });
});

router.patch("/preferences", async (req, res) => {
    const input = req.body || {};
    const preferences = await prisma.userPreference.upsert({
        where: { userId: req.user.id },
        update: {
            ...(input.theme !== undefined ? { theme: enumValue(input.theme, "theme", ["LIGHT", "DARK", "SYSTEM"]) } : {}),
            ...(input.locale !== undefined ? { locale: requiredString(input.locale, "locale", 10) } : {}),
            ...(input.dietTags !== undefined ? { dietTags: Array.isArray(input.dietTags) ? input.dietTags.map((tag) => requiredString(tag, "dietTags", 60)) : [] } : {}),
            ...(input.difficulty !== undefined ? { difficulty: Array.isArray(input.difficulty) ? input.difficulty : [] } : {}),
            ...(input.preferredTimeMax !== undefined ? { preferredTimeMax: Number(input.preferredTimeMax) || null } : {}),
            ...(input.mainIngredientIds !== undefined ? { mainIngredientIds: Array.isArray(input.mainIngredientIds) ? input.mainIngredientIds : [] } : {}),
        },
        create: {
            userId: req.user.id,
            theme: input.theme ? enumValue(input.theme, "theme", ["LIGHT", "DARK", "SYSTEM"]) : "SYSTEM",
            locale: input.locale ? requiredString(input.locale, "locale", 10) : "vi",
            dietTags: Array.isArray(input.dietTags) ? input.dietTags : [],
            difficulty: Array.isArray(input.difficulty) ? input.difficulty : [],
            preferredTimeMax: Number(input.preferredTimeMax) || null,
            mainIngredientIds: Array.isArray(input.mainIngredientIds) ? input.mainIngredientIds : [],
        },
    });
    return sendData(res, { preferences });
});

router.patch("/locale", async (req, res) => {
    const locale = requiredString(req.body?.locale, "locale", 10);
    const preferences = await prisma.userPreference.upsert({
        where: { userId: req.user.id },
        update: { locale },
        create: { userId: req.user.id, locale },
    });
    return sendData(res, { preferences });
});

export default router;
