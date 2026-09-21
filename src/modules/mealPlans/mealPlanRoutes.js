import express from "express";
import { prisma } from "../../config/db.js";
import { protect } from "../../middleware/authMiddleware.js";
import { badRequest, notFound } from "../../common/errors.js";
import { enumValue, sendData, sendMessage } from "../../common/http.js";

const router = express.Router();
router.use(protect);

const dateOnly = (value, field) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!value || Number.isNaN(date.getTime())) throw badRequest(`${field} must be YYYY-MM-DD`);
    return date;
};

router.get("/", async (req, res) => {
    const weekStart = dateOnly(req.query.week, "week");
    const mealPlan = await prisma.mealPlan.findUnique({
        where: { userId_weekStart: { userId: req.user.id, weekStart } },
        include: { items: { include: { recipe: true }, orderBy: { date: "asc" } } },
    });
    return sendData(res, { mealPlan });
});

router.post("/items", async (req, res) => {
    const date = dateOnly(req.body?.date, "date");
    const weekStart = dateOnly(req.body?.weekStart || req.body?.date, "weekStart");
    const recipe = await prisma.recipe.findFirst({ where: { id: req.body?.recipeId, status: "PUBLISHED" }, select: { id: true } });
    if (!recipe) throw notFound("Published recipe not found");

    const mealPlan = await prisma.mealPlan.upsert({
        where: { userId_weekStart: { userId: req.user.id, weekStart } },
        update: {},
        create: { userId: req.user.id, weekStart },
    });
    const item = await prisma.mealPlanItem.create({
        data: {
            mealPlanId: mealPlan.id,
            recipeId: recipe.id,
            date,
            mealType: enumValue(req.body?.mealType, "mealType", ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
            note: req.body?.note || null,
        },
        include: { recipe: true },
    });
    return sendData(res, { item }, 201);
});

router.patch("/items/:id", async (req, res) => {
    const item = await prisma.mealPlanItem.findFirst({ where: { id: req.params.id, mealPlan: { userId: req.user.id } } });
    if (!item) throw notFound("Meal plan item not found");
    const updated = await prisma.mealPlanItem.update({
        where: { id: item.id },
        data: {
            ...(req.body?.date ? { date: dateOnly(req.body.date, "date") } : {}),
            ...(req.body?.mealType ? { mealType: enumValue(req.body.mealType, "mealType", ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]) } : {}),
            ...(req.body?.note !== undefined ? { note: req.body.note || null } : {}),
        },
    });
    return sendData(res, { item: updated });
});

router.delete("/items/:id", async (req, res) => {
    const item = await prisma.mealPlanItem.findFirst({ where: { id: req.params.id, mealPlan: { userId: req.user.id } } });
    if (!item) throw notFound("Meal plan item not found");
    await prisma.mealPlanItem.delete({ where: { id: item.id } });
    return sendMessage(res, "Meal plan item deleted");
});

export default router;
