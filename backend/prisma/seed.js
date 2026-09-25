import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const user = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: { displayName: "Demo User", passwordHash, status: "ACTIVE" },
        create: {
            id: "ed7dcbf7-c7ef-46b3-87e7-78c2a52cd276",
            displayName: "Demo User",
            email: "demo@example.com",
            passwordHash,
            roles: { create: [{ role: "USER" }, { role: "EDITOR" }, { role: "ADMIN" }] },
            preferences: { create: { theme: "SYSTEM", locale: "vi", dietTags: ["healthy"], difficulty: ["EASY"] } },
        },
        include: { roles: true },
    });

    for (const role of ["USER", "EDITOR", "ADMIN"]) {
        await prisma.userRole.upsert({
            where: { userId_role: { userId: user.id, role } },
            update: {},
            create: { userId: user.id, role },
        });
    }

    await prisma.userPreference.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, theme: "SYSTEM", locale: "vi" },
    });

    const category = await prisma.category.upsert({
        where: { name: "Vietnamese" },
        update: {},
        create: { name: "Vietnamese" },
    });

    const beef = await prisma.ingredient.upsert({
        where: { slug: "thit-bo" },
        update: { nameVi: "Thịt bò", kind: "MAIN" },
        create: { nameVi: "Thịt bò", slug: "thit-bo", kind: "MAIN" },
    });

    const broccoli = await prisma.ingredient.upsert({
        where: { slug: "bong-cai" },
        update: { nameVi: "Bông cải", kind: "SECONDARY" },
        create: { nameVi: "Bông cải", slug: "bong-cai", kind: "SECONDARY" },
    });

    const oil = await prisma.ingredient.upsert({
        where: { slug: "dau-an" },
        update: { nameVi: "Dầu ăn", kind: "SEASONING" },
        create: { nameVi: "Dầu ăn", slug: "dau-an", kind: "SEASONING" },
    });

    const recipe = await prisma.recipe.upsert({
        where: { slug: "bo-xao-bong-cai" },
        update: {
            title: "Bò xào bông cải",
            description: "Món bò nhanh, dễ nấu cho bữa tối gia đình.",
            categoryId: category.id,
            authorId: user.id,
            prepMinutes: 10,
            cookMinutes: 15,
            servings: 2,
            difficulty: "EASY",
            status: "PUBLISHED",
            publishedAt: new Date(),
        },
        create: {
            title: "Bò xào bông cải",
            slug: "bo-xao-bong-cai",
            description: "Món bò nhanh, dễ nấu cho bữa tối gia đình.",
            categoryId: category.id,
            authorId: user.id,
            prepMinutes: 10,
            cookMinutes: 15,
            servings: 2,
            difficulty: "EASY",
            status: "PUBLISHED",
            publishedAt: new Date(),
        },
    });

    await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipeIngredient.createMany({
        data: [
            { recipeId: recipe.id, ingredientId: beef.id, quantity: 300, unit: "g", role: "MAIN", sortOrder: 0 },
            { recipeId: recipe.id, ingredientId: broccoli.id, quantity: 250, unit: "g", role: "SECONDARY", sortOrder: 1 },
            { recipeId: recipe.id, ingredientId: oil.id, quantity: 1, unit: "muỗng canh", role: "SEASONING", sortOrder: 2 },
        ],
    });
    await prisma.recipeStep.createMany({
        data: [
            { recipeId: recipe.id, stepNumber: 1, instruction: "Sơ chế thịt bò và bông cải.", timerSeconds: null },
            { recipeId: recipe.id, stepNumber: 2, instruction: "Xào thịt bò ở lửa lớn trong 5 phút.", timerSeconds: 300 },
            { recipeId: recipe.id, stepNumber: 3, instruction: "Thêm bông cải, đảo đều và nêm vừa ăn.", timerSeconds: 300 },
        ],
    });

    const tag = await prisma.tag.upsert({
        where: { slug: "bua-toi" },
        update: { nameVi: "Bữa tối" },
        create: { slug: "bua-toi", nameVi: "Bữa tối", nameEn: "Dinner" },
    });
    await prisma.recipeTag.upsert({
        where: { recipeId_tagId: { recipeId: recipe.id, tagId: tag.id } },
        update: {},
        create: { recipeId: recipe.id, tagId: tag.id },
    });

    const collection = await prisma.collection.upsert({
        where: { userId_name: { userId: user.id, name: "Món yêu thích" } },
        update: {},
        create: { userId: user.id, name: "Món yêu thích", isDefault: true },
    });
    await prisma.collectionRecipe.upsert({
        where: { collectionId_recipeId: { collectionId: collection.id, recipeId: recipe.id } },
        update: {},
        create: { collectionId: collection.id, recipeId: recipe.id },
    });

    console.log("Seed completed for demo@example.com / Password123!");
};

try {
    await seed();
} catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
