import express from "express";
import { getRecipes, createRecipe, getRecipeByName, updateRecipe, deleteRecipe } from "../controller/recipeController.js";
import { authorizeRecipeOwner, protect } from "../middleware/authMiddleware.js";
import {
    getRecipeIngredients,
    addRecipeIngredient,
    updateRecipeIngredient,
    removeRecipeIngredient,
} from "../controller/recipeIngredientController.js";

const router =  express.Router();

router.post("/", protect, createRecipe);

router.get("/", getRecipes);
 
router.get("/name/:recipeName", getRecipeByName);

router.get("/:recipeID/ingredients", getRecipeIngredients);
router.post("/:recipeID/ingredients", protect, authorizeRecipeOwner, addRecipeIngredient);
router.patch("/:recipeID/ingredients/:ingredientID", protect, authorizeRecipeOwner, updateRecipeIngredient);
router.delete("/:recipeID/ingredients/:ingredientID", protect, authorizeRecipeOwner, removeRecipeIngredient);

router.put("/:id", protect, authorizeRecipeOwner, updateRecipe);

router.delete("/:id", protect, authorizeRecipeOwner, deleteRecipe);

export default router
