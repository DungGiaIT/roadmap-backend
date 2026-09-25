import express from "express";
import { prisma } from "../../config/db.js";
import { badRequest, notFound } from "../../common/errors.js";
import { requiredString, sendData, sendMessage } from "../../common/http.js";
import { protect } from "../../middleware/authMiddleware.js";
import { createRateLimiter } from "../../middleware/requestMiddleware.js";

const router = express.Router();
const engagementLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many engagement requests",
});
const publishedRecipe = async (id) => {
    const recipe = await prisma.recipe.findFirst({ where: { id, status: "PUBLISHED" }, select: { id: true } });
    if (!recipe) throw notFound("Published recipe not found");
    return recipe;
};

router.post("/:id/favorite", protect, async (req, res) => {
    await publishedRecipe(req.params.id);
    const favorite = await prisma.favorite.upsert({
        where: { userId_recipeId: { userId: req.user.id, recipeId: req.params.id } },
        update: {},
        create: { userId: req.user.id, recipeId: req.params.id },
    });
    return sendData(res, { favorite }, 201);
});

router.delete("/:id/favorite", protect, async (req, res) => {
    await prisma.favorite.deleteMany({ where: { userId: req.user.id, recipeId: req.params.id } });
    return sendMessage(res, "Recipe removed from favorites");
});

router.post("/:id/rating", protect, engagementLimiter, async (req, res) => {
    await publishedRecipe(req.params.id);
    const score = Number(req.body?.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) throw badRequest("score must be an integer from 1 to 5");
    const rating = await prisma.rating.upsert({
        where: { userId_recipeId: { userId: req.user.id, recipeId: req.params.id } },
        update: { score, review: req.body?.review ? requiredString(req.body.review, "review", 1000) : null },
        create: { userId: req.user.id, recipeId: req.params.id, score, review: req.body?.review ? requiredString(req.body.review, "review", 1000) : null },
    });
    return sendData(res, { rating });
});

router.get("/:id/comments", async (req, res) => {
    await publishedRecipe(req.params.id);
    const comments = await prisma.comment.findMany({
        where: { recipeId: req.params.id, status: "VISIBLE" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, displayName: true } } },
    });
    return sendData(res, { comments });
});

router.post("/:id/comments", protect, engagementLimiter, async (req, res) => {
    await publishedRecipe(req.params.id);
    const comment = await prisma.comment.create({
        data: { recipeId: req.params.id, userId: req.user.id, body: requiredString(req.body?.body, "body", 2000) },
        include: { user: { select: { id: true, displayName: true } } },
    });
    return sendData(res, { comment }, 201);
});

export default router;
