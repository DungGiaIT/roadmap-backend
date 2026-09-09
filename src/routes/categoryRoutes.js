import express from "express";
import {createCategory, getCategories, getCategoryById, updateCategory, deleteCategory} from "../controller/categoryController.js";

const router = express.Router();

router.post("/category", createCategory);
router.get("/category", getCategories);
router.get("/category/:id", getCategoryById);
router.put("/category/:id", updateCategory);
router.delete("/category/:id", deleteCategory);

export default router;