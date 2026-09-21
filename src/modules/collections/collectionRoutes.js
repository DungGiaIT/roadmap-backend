import express from "express";
import { prisma } from "../../config/db.js";
import { protect } from "../../middleware/authMiddleware.js";
import { notFound } from "../../common/errors.js";
import { optionalString, requiredString, sendData, sendMessage } from "../../common/http.js";

const router = express.Router();
router.use(protect);

const ownedCollection = async (userId, id) => {
    const collection = await prisma.collection.findFirst({ where: { id, userId }, include: { recipes: { include: { recipe: true } } } });
    if (!collection) throw notFound("Collection not found");
    return collection;
};

router.get("/", async (req, res) => {
    const collections = await prisma.collection.findMany({
        where: { userId: req.user.id },
        include: { recipes: { include: { recipe: { select: { id: true, title: true, slug: true, imageUrl: true } } } } },
        orderBy: { updatedAt: "desc" },
    });
    return sendData(res, { collections });
});

router.post("/", async (req, res) => {
    const collection = await prisma.collection.create({
        data: {
            userId: req.user.id,
            name: requiredString(req.body?.name, "name", 100),
            description: optionalString(req.body?.description, "description", 500),
        },
    });
    return sendData(res, { collection }, 201);
});

router.patch("/:id", async (req, res) => {
    await ownedCollection(req.user.id, req.params.id);
    const collection = await prisma.collection.update({
        where: { id: req.params.id },
        data: {
            ...(req.body?.name !== undefined ? { name: requiredString(req.body.name, "name", 100) } : {}),
            ...(req.body?.description !== undefined ? { description: optionalString(req.body.description, "description", 500) } : {}),
        },
    });
    return sendData(res, { collection });
});

router.delete("/:id", async (req, res) => {
    await ownedCollection(req.user.id, req.params.id);
    await prisma.collection.delete({ where: { id: req.params.id } });
    return sendMessage(res, "Collection deleted");
});

router.post("/:id/recipes", async (req, res) => {
    await ownedCollection(req.user.id, req.params.id);
    const recipe = await prisma.recipe.findFirst({ where: { id: req.body?.recipeId, status: "PUBLISHED" }, select: { id: true } });
    if (!recipe) throw notFound("Published recipe not found");

    const item = await prisma.collectionRecipe.upsert({
        where: { collectionId_recipeId: { collectionId: req.params.id, recipeId: recipe.id } },
        update: { note: optionalString(req.body?.note, "note", 300) },
        create: { collectionId: req.params.id, recipeId: recipe.id, note: optionalString(req.body?.note, "note", 300) },
        include: { recipe: true },
    });
    return sendData(res, { item }, 201);
});

router.delete("/:id/recipes/:recipeId", async (req, res) => {
    await ownedCollection(req.user.id, req.params.id);
    await prisma.collectionRecipe.delete({ where: { collectionId_recipeId: { collectionId: req.params.id, recipeId: req.params.recipeId } } });
    return sendMessage(res, "Recipe removed from collection");
});

export default router;
