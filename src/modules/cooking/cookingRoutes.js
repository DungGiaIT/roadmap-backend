import express from "express";
import { prisma } from "../../config/db.js";
import { badRequest, notFound } from "../../common/errors.js";
import { optionalString, positiveInteger, sendData, requiredString } from "../../common/http.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

const optionalDate = (value, field) => {
    if (value === undefined || value === null) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw badRequest(`${field} must be a valid ISO date`);
    return date;
};

router.post("/recipes/:id/cooking-logs", async (req, res) => {
    const recipe = await prisma.recipe.findFirst({ where: { id: req.params.id, status: "PUBLISHED" }, select: { id: true } });
    if (!recipe) throw notFound("Published recipe not found");
    const personalRating = req.body?.personalRating === undefined ? undefined : Number(req.body.personalRating);
    if (personalRating !== undefined && (!Number.isInteger(personalRating) || personalRating < 1 || personalRating > 5)) {
        throw badRequest("personalRating must be an integer from 1 to 5");
    }
    const cookingLog = await prisma.cookingLog.create({
        data: {
            userId: req.user.id,
            recipeId: recipe.id,
            startedAt: optionalDate(req.body?.startedAt, "startedAt"),
            completedAt: optionalDate(req.body?.completedAt, "completedAt") || new Date(),
            servingsUsed: req.body?.servingsUsed === undefined ? null : positiveInteger(req.body.servingsUsed, "servingsUsed"),
            note: optionalString(req.body?.note, "note", 1000),
            personalRating: personalRating ?? null,
        },
        include: { recipe: { select: { id: true, title: true, slug: true } } },
    });
    return sendData(res, { cookingLog }, 201);
});

router.get("/me/cooking-history", async (req, res) => {
    const history = await prisma.cookingLog.findMany({
        where: { userId: req.user.id },
        orderBy: { completedAt: "desc" },
        take: 100,
        include: { recipe: { select: { id: true, title: true, slug: true, imageUrl: true } }, photos: true },
    });
    return sendData(res, { history });
});

router.post("/cooking-logs/:id/photos", async (req, res) => {
    const cookingLog = await prisma.cookingLog.findFirst({ where: { id: req.params.id, userId: req.user.id }, select: { id: true } });
    if (!cookingLog) throw notFound("Cooking log not found");
    const storagePath = requiredString(req.body?.storagePath, "storagePath", 1000);
    const photo = await prisma.cookingPhoto.create({
        data: { cookingLogId: cookingLog.id, storagePath, publicUrl: optionalString(req.body?.publicUrl, "publicUrl", 2000) },
    });
    return sendData(res, { photo }, 201);
});

export default router;
