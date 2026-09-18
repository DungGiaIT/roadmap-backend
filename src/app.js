import express from "express";
import recipeRouter from "./routes/recipesRoute.js";
import authRouter from "./routes/authRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { parseCookies } from "./middleware/authMiddleware.js";

const app = express();

app.use(express.json());
app.use(parseCookies);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/recipes", recipeRouter);

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "success", message: "API is healthy" });
});

app.use(notFound);
app.use(errorHandler);

export default app;
