import { sendData, sendMessage } from "../../common/http.js";
import { moderateRecipe, createRecipe as createRecipeService, getRecipeBySlug, getRecipeForOwner, listRecipes, submitRecipe, updateRecipe } from "./recipeService.js";
import { prisma } from "../../config/db.js";

export const list = async (req, res) => {
    const result = await listRecipes(req);
    return sendData(res, result.data, 200, result.meta);
};

export const detail = async (req, res) => sendData(res, await getRecipeBySlug(req.params.slug));

export const create = async (req, res) => sendData(res, { recipe: await createRecipeService(req.user.id, req.body) }, 201);

export const update = async (req, res) => sendData(res, { recipe: await updateRecipe(req.params.id, req.user.id, req.body) });

export const remove = async (req, res) => {
    await prisma.recipe.update({ where: { id: req.params.id }, data: { status: "ARCHIVED" } });
    return sendMessage(res, "Recipe archived");
};

export const submit = async (req, res) => sendData(res, { recipe: await submitRecipe(req.params.id, req.user.id) });

export const approve = async (req, res) => sendData(res, { recipe: await moderateRecipe(req.params.id, req.user.id, "APPROVE", null, req.requestId) });

export const reject = async (req, res) => sendData(res, { recipe: await moderateRecipe(req.params.id, req.user.id, "REJECT", req.body.reason, req.requestId) });

export const mine = async (req, res) => sendData(res, { recipe: await getRecipeForOwner(req.params.id, req.user.id) });
