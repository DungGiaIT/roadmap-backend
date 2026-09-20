import express from "express";
import {
    getIngredients,
    getIngredientById,
    createIngredient,
    updateIngredient,
    deleteIngredient,
} from "../controller/ingredientController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getIngredients);
router.get("/:id", getIngredientById);
router.post("/", protect, createIngredient);
router.put("/:id", protect, updateIngredient);
router.delete("/:id", protect, deleteIngredient);

export default router;
