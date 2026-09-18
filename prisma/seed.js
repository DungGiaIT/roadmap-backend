import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
    const password = await bcrypt.hash("Password123!", 10);

    const user = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: { userName: "Demo User" },
        create: {
            userID: "ed7dcbf7-c7ef-46b3-87e7-78c2a52cd276",
            userName: "Demo User",
            email: "demo@example.com",
            password,
        },
    });

    const category = await prisma.category.upsert({
        where: { categoryName: "Vietnamese" },
        update: {},
        create: { categoryName: "Vietnamese" },
    });

    const recipe = await prisma.recipes.upsert({
        where: { recipeName: "Pho Bo" },
        update: {
            description: "Vietnamese beef noodle soup",
            cookingTime: 120,
            userID: user.userID,
            categoryID: category.categoryID,
        },
        create: {
            recipeName: "Pho Bo",
            description: "Vietnamese beef noodle soup",
            cookingTime: 120,
            userID: user.userID,
            categoryID: category.categoryID,
        },
    });

    const ingredient = await prisma.ingredient.upsert({
        where: { ingredientID: "0d5b0b40-1e2f-4b1c-8b6b-5e1f8d5f6f01" },
        update: { IngredientName: "Rice noodles" },
        create: {
            ingredientID: "0d5b0b40-1e2f-4b1c-8b6b-5e1f8d5f6f01",
            IngredientName: "Rice noodles",
        },
    });

    await prisma.recipeIngredient.upsert({
        where: {
            recipeID_ingredientID: {
                recipeID: recipe.recipeID,
                ingredientID: ingredient.ingredientID,
            },
        },
        update: { quantity: 200 },
        create: {
            recipeID: recipe.recipeID,
            ingredientID: ingredient.ingredientID,
            quantity: 200,
        },
    });

    await prisma.watchlist.upsert({
        where: {
            userID_recipeID: {
                userID: user.userID,
                recipeID: recipe.recipeID,
            },
        },
        update: {},
        create: {
            userID: user.userID,
            recipeID: recipe.recipeID,
        },
    });

    console.log("Seed completed for demo@example.com");
};

try {
    await seed();
} catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
