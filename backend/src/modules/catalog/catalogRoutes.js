import express from "express";
import { prisma } from "../../config/db.js";
import { sendData } from "../../common/http.js";

const router = express.Router();

router.get("/ingredients", async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const ingredients = await prisma.ingredient.findMany({
        where: q ? { OR: [{ nameVi: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }] } : undefined,
        orderBy: { nameVi: "asc" },
        take: 50,
    });
    return sendData(res, { ingredients });
});

router.get("/categories", async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return sendData(res, { categories });
});

router.get("/tags", async (_req, res) => {
    const tags = await prisma.tag.findMany({ orderBy: { nameVi: "asc" } });
    return sendData(res, { tags });
});

export default router;
