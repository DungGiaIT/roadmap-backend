import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const getToken = (req) => {
    if (req.cookies?.jwt) return req.cookies.jwt;

    const authorization = req.headers.authorization;
    if (authorization?.startsWith("Bearer ")) return authorization.slice(7);

    return null;
};

export const parseCookies = (req, _res, next) => {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
        for (const part of cookieHeader.split(";")) {
            const separatorIndex = part.indexOf("=");
            if (separatorIndex === -1) continue;

            const key = part.slice(0, separatorIndex).trim();
            const value = part.slice(separatorIndex + 1).trim();
            req.cookies[key] = decodeURIComponent(value);
        }
    }

    next();
};

export const protect = async (req, res, next) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ status: "error", message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { userID: decoded.id },
            select: {
                userID: true,
                userName: true,
                email: true,
                createdAt: true,
                updateAt: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "User associated with token no longer exists",
            });
        }
        req.user = user;
        next();
    } catch (_error) {
        return res.status(401).json({ status: "error", message: "Invalid or expired token" });
    }
};

export const authorizeRecipeOwner = async (req, res, next) => {
    const recipeID = req.params.id || req.params.recipeID;
    const recipe = await prisma.recipes.findUnique({
        where: { recipeID },
        select: { userID: true },
    });
    if (!recipe) {
        return res.status(404).json({ status: "error", message: "Recipe not found" });
    }

    if (recipe.userID !== req.user.userID) {
        return res.status(403).json({
            status: "error",
            message: "You do not have permission to modify this recipe",
        });
    }

    next();
};
