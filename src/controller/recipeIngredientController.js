import { prisma } from "../config/db.js";

const recipeWhere = (req) => ({ recipeID: req.params.recipeID });

const getRecipeIngredients = async (req, res) => {
    const recipeIngredients = await prisma.recipeIngredient.findMany({
        where: recipeWhere(req),
        include: { ingredient: true },
        orderBy: { ingredient: { IngredientName: "asc" } },
    });

    return res.json({ status: "success", data: { recipeIngredients } });
};

const addRecipeIngredient = async (req, res) => {
    const { ingredientID, quantity } = req.body;
    const parsedQuantity = Number(quantity);

    if (!ingredientID || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({
            status: "error",
            message: "ingredientID and a positive quantity are required",
        });
    }

    const recipeIngredient = await prisma.recipeIngredient.create({
        data: {
            recipeID: req.params.recipeID,
            ingredientID,
            quantity: parsedQuantity,
        },
        include: { ingredient: true },
    });

    return res.status(201).json({ status: "success", data: { recipeIngredient } });
};

const updateRecipeIngredient = async (req, res) => {
    const parsedQuantity = Number(req.body.quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({
            status: "error",
            message: "A positive quantity is required",
        });
    }

    const recipeIngredient = await prisma.recipeIngredient.update({
        where: {
            recipeID_ingredientID: {
                recipeID: req.params.recipeID,
                ingredientID: req.params.ingredientID,
            },
        },
        data: { quantity: parsedQuantity },
        include: { ingredient: true },
    });

    return res.json({ status: "success", data: { recipeIngredient } });
};

const removeRecipeIngredient = async (req, res) => {
    await prisma.recipeIngredient.delete({
        where: {
            recipeID_ingredientID: {
                recipeID: req.params.recipeID,
                ingredientID: req.params.ingredientID,
            },
        },
    });

    return res.json({
        status: "success",
        data: { message: "Ingredient removed from recipe" },
    });
};

export {
    getRecipeIngredients,
    addRecipeIngredient,
    updateRecipeIngredient,
    removeRecipeIngredient,
};
