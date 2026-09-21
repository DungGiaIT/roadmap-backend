import { prisma } from "../../config/db.js";
import { badRequest, forbidden, notFound } from "../../common/errors.js";
import { enumValue, optionalString, pagination, paginationMeta, positiveInteger, requiredString } from "../../common/http.js";
import { slugify } from "../../common/slug.js";

const recipeInclude = {
    author: { select: { id: true, displayName: true } },
    category: true,
    ingredients: {
        orderBy: { sortOrder: "asc" },
        include: { ingredient: true },
    },
    steps: { orderBy: { stepNumber: "asc" } },
    tags: { include: { tag: true } },
    _count: { select: { favorites: true, comments: true, ratings: true } },
};

const serializeRecipe = (recipe) => ({
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    status: recipe.status,
    rejectionReason: recipe.rejectionReason,
    publishedAt: recipe.publishedAt,
    author: recipe.author,
    category: recipe.category,
    ingredients: recipe.ingredients?.map(({ ingredient, ...item }) => ({
        ...item,
        ingredient: {
            id: ingredient.id,
            nameVi: ingredient.nameVi,
            nameEn: ingredient.nameEn,
            slug: ingredient.slug,
            kind: ingredient.kind,
        },
    })),
    steps: recipe.steps,
    tags: recipe.tags?.map(({ tag }) => tag),
    counts: recipe._count,
});

const normalizedIngredient = async (tx, item) => {
    const ingredientId = item.ingredientId || item.id;
    if (ingredientId) return { id: ingredientId };

    const nameVi = requiredString(item.nameVi || item.name, "ingredient.nameVi", 100);
    const slug = slugify(nameVi);
    return tx.ingredient.upsert({
        where: { slug },
        update: { nameVi },
        create: {
            nameVi,
            slug,
            nameEn: optionalString(item.nameEn, "ingredient.nameEn", 100),
            kind: item.kind || "MAIN",
        },
        select: { id: true },
    });
};

const buildIngredientRows = async (tx, ingredients = []) => {
    if (!Array.isArray(ingredients)) throw badRequest("ingredients must be an array");

    const rows = [];
    for (const [index, item] of ingredients.entries()) {
        const ingredient = await normalizedIngredient(tx, item);
        const quantity = Number(item.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) throw badRequest(`ingredients[${index}].quantity must be positive`);

        rows.push({
            ingredientId: ingredient.id,
            quantity,
            unit: optionalString(item.unit, `ingredients[${index}].unit`, 30),
            note: optionalString(item.note, `ingredients[${index}].note`, 160),
            role: enumValue(item.role, `ingredients[${index}].role`, ["MAIN", "SECONDARY", "SEASONING"], "SECONDARY"),
            sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
        });
    }

    if (!rows.some(({ role }) => role === "MAIN")) throw badRequest("At least one MAIN ingredient is required");
    return rows;
};

const buildStepRows = (steps = []) => {
    if (!Array.isArray(steps)) throw badRequest("steps must be an array");
    return steps.map((step, index) => ({
        stepNumber: Number.isInteger(step.stepNumber) ? step.stepNumber : index + 1,
        instruction: requiredString(step.instruction, `steps[${index}].instruction`, 2000),
        imageUrl: optionalString(step.imageUrl, `steps[${index}].imageUrl`, 1000),
        timerSeconds: step.timerSeconds === undefined || step.timerSeconds === null
            ? null
            : positiveInteger(step.timerSeconds, `steps[${index}].timerSeconds`),
    }));
};

const ensureCategory = async (tx, categoryId) => {
    if (categoryId) return { id: categoryId };
    return tx.category.upsert({
        where: { name: "Vietnamese" },
        update: {},
        create: { name: "Vietnamese" },
        select: { id: true },
    });
};

const ensureTags = async (tx, tags = []) => {
    if (!Array.isArray(tags)) throw badRequest("tags must be an array");
    const rows = [];
    for (const item of tags) {
        const nameVi = requiredString(item.nameVi || item.name || item, "tag.nameVi", 80);
        const tag = await tx.tag.upsert({
            where: { slug: slugify(nameVi) },
            update: { nameVi, nameEn: item.nameEn || undefined },
            create: { nameVi, nameEn: item.nameEn || null, slug: slugify(nameVi) },
            select: { id: true },
        });
        rows.push({ tagId: tag.id });
    }
    return rows;
};

export const listRecipes = async (req) => {
    const { page, pageSize, skip } = pagination(req);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const where = {
        status: "PUBLISHED",
        ...(q ? {
            OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
            ],
        } : {}),
        ...(req.query.difficulty ? { difficulty: req.query.difficulty } : {}),
        ...(req.query.maxMinutes ? { cookMinutes: { lte: positiveInteger(req.query.maxMinutes, "maxMinutes") } } : {}),
        ...(req.query.mainIngredient ? {
            ingredients: {
                some: {
                    role: "MAIN",
                    ingredient: { slug: String(req.query.mainIngredient) },
                },
            },
        } : {}),
        ...(req.query.diet ? {
            tags: { some: { tag: { slug: { in: String(req.query.diet).split(",") } } } },
        } : {}),
    };

    const sort = {
        newest: { createdAt: "desc" },
        popular: { favorites: { _count: "desc" } },
        rating: { ratings: { _count: "desc" } },
    }[req.query.sort] || { publishedAt: "desc" };

    const [recipes, total] = await prisma.$transaction([
        prisma.recipe.findMany({ where, include: recipeInclude, orderBy: sort, skip, take: pageSize }),
        prisma.recipe.count({ where }),
    ]);

    return {
        data: recipes.map(serializeRecipe),
        meta: paginationMeta(page, pageSize, total),
    };
};

export const getRecipeBySlug = async (slug) => {
    const recipe = await prisma.recipe.findFirst({ where: { slug, status: "PUBLISHED" }, include: recipeInclude });
    if (!recipe) throw notFound("Recipe not found");
    return serializeRecipe(recipe);
};

export const createRecipe = async (userId, input) => {
    const title = requiredString(input.title || input.recipeName, "title", 160);
    const slug = slugify(input.slug || title);
    const category = await prisma.category.findFirst({ where: { id: input.categoryId || input.categoryID } });

    const recipe = await prisma.$transaction(async (tx) => {
        const selectedCategory = category || await ensureCategory(tx, input.categoryId || input.categoryID);
        const created = await tx.recipe.create({
            data: {
                title,
                slug,
                description: optionalString(input.description, "description", 5000) || "",
                imageUrl: optionalString(input.imageUrl || input.recipeImg, "imageUrl", 1000),
                prepMinutes: input.prepMinutes === undefined ? 0 : positiveInteger(input.prepMinutes, "prepMinutes", 0),
                cookMinutes: positiveInteger(input.cookMinutes ?? input.cookingTime, "cookMinutes"),
                servings: positiveInteger(input.servings, "servings", 1),
                difficulty: enumValue(input.difficulty, "difficulty", ["EASY", "MEDIUM", "HARD"], "EASY"),
                authorId: userId,
                categoryId: selectedCategory.id,
            },
        });

        const ingredients = await buildIngredientRows(tx, input.ingredients || []);
        await tx.recipeIngredient.createMany({ data: ingredients.map((item) => ({ recipeId: created.id, ...item })) });

        const steps = buildStepRows(input.steps || []);
        if (steps.length) await tx.recipeStep.createMany({ data: steps.map((step) => ({ recipeId: created.id, ...step })) });

        const tags = await ensureTags(tx, input.tags || []);
        if (tags.length) await tx.recipeTag.createMany({ data: tags.map((tag) => ({ recipeId: created.id, ...tag })) });
        return created;
    });

    return getRecipeForOwner(recipe.id, userId);
};

export const getRecipeForOwner = async (id, userId) => {
    const recipe = await prisma.recipe.findFirst({
        where: { id, OR: [{ authorId: userId }, { status: "PUBLISHED" }] },
        include: recipeInclude,
    });
    if (!recipe) throw notFound("Recipe not found");
    return serializeRecipe(recipe);
};

export const updateRecipe = async (id, userId, input) => {
    const current = await prisma.recipe.findUnique({ where: { id }, select: { authorId: true, status: true } });
    if (!current) throw notFound("Recipe not found");
    if (current.authorId !== userId) throw forbidden("You do not have permission to modify this recipe");
    if (["PUBLISHED", "PENDING_REVIEW"].includes(current.status)) throw badRequest("Published or pending recipes must be edited by an Editor");

    await prisma.$transaction(async (tx) => {
        await tx.recipe.update({
            where: { id },
            data: {
                ...(input.title || input.recipeName ? { title: requiredString(input.title || input.recipeName, "title", 160) } : {}),
                ...(input.description !== undefined ? { description: optionalString(input.description, "description", 5000) || "" } : {}),
                ...(input.imageUrl !== undefined || input.recipeImg !== undefined ? { imageUrl: optionalString(input.imageUrl || input.recipeImg, "imageUrl", 1000) } : {}),
                ...(input.prepMinutes !== undefined ? { prepMinutes: positiveInteger(input.prepMinutes, "prepMinutes", 0) } : {}),
                ...(input.cookMinutes !== undefined || input.cookingTime !== undefined ? { cookMinutes: positiveInteger(input.cookMinutes ?? input.cookingTime, "cookMinutes") } : {}),
                ...(input.servings !== undefined ? { servings: positiveInteger(input.servings, "servings") } : {}),
                ...(input.difficulty !== undefined ? { difficulty: enumValue(input.difficulty, "difficulty", ["EASY", "MEDIUM", "HARD"]) } : {}),
            },
        });

        if (input.ingredients) {
            await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
            const rows = await buildIngredientRows(tx, input.ingredients);
            await tx.recipeIngredient.createMany({ data: rows.map((item) => ({ recipeId: id, ...item })) });
        }
        if (input.steps) {
            await tx.recipeStep.deleteMany({ where: { recipeId: id } });
            const rows = buildStepRows(input.steps);
            if (rows.length) await tx.recipeStep.createMany({ data: rows.map((step) => ({ recipeId: id, ...step })) });
        }
    });

    return getRecipeForOwner(id, userId);
};

export const submitRecipe = async (id, userId) => {
    const recipe = await prisma.recipe.findUnique({ where: { id }, select: { authorId: true, status: true } });
    if (!recipe) throw notFound("Recipe not found");
    if (recipe.authorId !== userId) throw forbidden("You do not own this recipe");
    if (!["DRAFT", "REJECTED"].includes(recipe.status)) throw badRequest("Only draft or rejected recipes can be submitted");

    return prisma.$transaction(async (tx) => {
        const updated = await tx.recipe.update({ where: { id }, data: { status: "PENDING_REVIEW", rejectionReason: null } });
        await tx.moderationEvent.create({ data: { recipeId: id, reviewerId: userId, action: "SUBMIT" } });
        return updated;
    });
};

export const moderateRecipe = async (id, reviewerId, action, reason, requestId) => {
    const recipe = await prisma.recipe.findUnique({ where: { id }, select: { status: true } });
    if (!recipe) throw notFound("Recipe not found");
    if (recipe.status !== "PENDING_REVIEW") throw badRequest("Only pending recipes can be moderated");
    if (action === "REJECT" && !reason?.trim()) throw badRequest("A rejection reason is required");

    return prisma.$transaction(async (tx) => {
        const updated = await tx.recipe.update({
            where: { id },
            data: {
                status: action === "APPROVE" ? "PUBLISHED" : "REJECTED",
                publishedAt: action === "APPROVE" ? new Date() : null,
                rejectionReason: action === "REJECT" ? reason.trim() : null,
            },
        });
        await tx.moderationEvent.create({ data: { recipeId: id, reviewerId, action, reason: reason || null } });
        await tx.auditLog.create({
            data: { actorId: reviewerId, action: `RECIPE_${action}`, entityType: "Recipe", entityId: id, requestId },
        });
        return updated;
    });
};

