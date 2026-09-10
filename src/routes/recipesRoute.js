import express from "express";
import { getRecipes, createRecipe, getRecipeByName, updateRecipe, deleteRecipe} from "../controller/recipeController.js";

const router =  express.Router();

router.post("/recipe", createRecipe);

router.get("/recipe", getRecipes);
 
router.get("/recipe/:recipeName", getRecipeByName);

router.put("/recipe/:id", updateRecipe);

router.delete("/recipe/:id", deleteRecipe);

export default router