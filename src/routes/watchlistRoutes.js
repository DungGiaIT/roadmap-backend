import express from "express";
import {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
} from "../controller/watchlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getWatchlist);
router.post("/:recipeID", addToWatchlist);
router.delete("/:recipeID", removeFromWatchlist);

export default router;
