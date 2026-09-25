import express from "express";
import authRouter from "./modules/auth/authRoutes.js";
import recipeRouter from "./modules/recipes/recipeRoutes.js";
import catalogRouter from "./modules/catalog/catalogRoutes.js";
import userRouter from "./modules/users/userRoutes.js";
import collectionRouter from "./modules/collections/collectionRoutes.js";
import mealPlanRouter from "./modules/mealPlans/mealPlanRoutes.js";
import engagementRouter from "./modules/recipes/engagementRoutes.js";
import cookingRouter from "./modules/cooking/cookingRoutes.js";
import adminRouter from "./modules/admin/adminRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { parseCookies } from "./middleware/authMiddleware.js";
import { cors, requestId, securityHeaders } from "./middleware/requestMiddleware.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(requestId);
app.use(securityHeaders);
app.use(cors);
app.use(parseCookies);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1", catalogRouter);
app.use("/api/v1/recipes", recipeRouter);
app.use("/api/v1/recipes", engagementRouter);
app.use("/api/v1", cookingRouter);
app.use("/api/v1/me", userRouter);
app.use("/api/v1/collections", collectionRouter);
app.use("/api/v1/meal-plans", mealPlanRouter);
app.use("/api/v1/admin", adminRouter);

app.get("/health", (_req, res) => {
    res.status(200).json({ data: { status: "ok" } });
});

app.use(notFound);
app.use(errorHandler);

export default app;
