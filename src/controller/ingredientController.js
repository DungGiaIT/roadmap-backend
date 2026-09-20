import { prisma } from "../config/db.js";

const getIngredients = async (_req, res) => {
    const ingredients = await prisma.ingredient.findMany({
        orderBy: { IngredientName: "asc" },
    });

    return res.json({ status: "success", data: { ingredients } });
};

const getIngredientById = async (req, res) => {
    const ingredient = await prisma.ingredient.findUnique({
        where: { ingredientID: req.params.id },
    });

    if (!ingredient) {
        return res.status(404).json({ status: "error", message: "Ingredient not found" });
    }

    return res.json({ status: "success", data: { ingredient } });
};

const createIngredient = async (req, res) => {
    const { IngredientName } = req.body;

    if (!IngredientName?.trim()) {
        return res.status(400).json({ status: "error", message: "Ingredient name is required" });
    }

    const ingredient = await prisma.ingredient.create({
        data: { IngredientName: IngredientName.trim() },
    });

    return res.status(201).json({ status: "success", data: { ingredient } });
};

const updateIngredient = async (req, res) => {
    const { IngredientName } = req.body;

    if (!IngredientName?.trim()) {
        return res.status(400).json({ status: "error", message: "Ingredient name is required" });
    }

    const ingredient = await prisma.ingredient.update({
        where: { ingredientID: req.params.id },
        data: { IngredientName: IngredientName.trim() },
    });

    return res.json({ status: "success", data: { ingredient } });
};

const deleteIngredient = async (req, res) => {
    await prisma.ingredient.delete({ where: { ingredientID: req.params.id } });
    return res.json({ status: "success", data: { message: "Ingredient deleted successfully" } });
};

export { getIngredients, getIngredientById, createIngredient, updateIngredient, deleteIngredient };
