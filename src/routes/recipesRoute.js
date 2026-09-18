import express from "express";
import { getRecipes, createRecipe, getRecipeByName, updateRecipe, deleteRecipe } from "../controller/recipeController.js";
import { authorizeRecipeOwner, protect } from "../middleware/authMiddleware.js";

const router =  express.Router();

router.post("/", protect, createRecipe);

router.get("/", getRecipes);
 
router.get("/name/:recipeName", getRecipeByName);

router.put("/:id", protect, authorizeRecipeOwner, updateRecipe);

router.delete("/:id", protect, authorizeRecipeOwner, deleteRecipe);

export default router
