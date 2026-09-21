import express from "express";
import { authorizeRecipeOwner, authorizeRoles, protect } from "../../middleware/authMiddleware.js";
import { approve, create, detail, list, mine, reject, remove, submit, update } from "./recipeController.js";

const router = express.Router();

router.get("/by-main-ingredient", list);
router.get("/", list);
router.post("/", protect, create);
router.get("/mine/:id", protect, mine);
router.get("/:slug", detail);
router.patch("/:id", protect, authorizeRecipeOwner, update);
router.delete("/:id", protect, authorizeRecipeOwner, remove);
router.post("/:id/submit", protect, authorizeRecipeOwner, submit);
router.post("/:id/approve", protect, authorizeRoles("EDITOR", "ADMIN"), approve);
router.post("/:id/reject", protect, authorizeRoles("EDITOR", "ADMIN"), reject);

export default router;
