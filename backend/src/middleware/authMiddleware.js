import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { forbidden, notFound, unauthorized } from "../common/errors.js";

const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "dev-access-secret";

export const parseCookies = (req, _res, next) => {
    req.cookies = {};
    const header = req.headers.cookie;
    if (!header) return next();

    for (const part of header.split(";")) {
        const separator = part.indexOf("=");
        if (separator === -1) continue;
        const key = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        req.cookies[key] = decodeURIComponent(value);
    }

    next();
};

const accessTokenFromRequest = (req) => {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return req.cookies.accessToken || null;
};

export const protect = async (req, _res, next) => {
    const token = accessTokenFromRequest(req);
    if (!token) return next(unauthorized());

    try {
        const payload = jwt.verify(token, accessSecret());
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            include: { roles: true, preferences: true },
        });

        if (!user || user.status !== "ACTIVE") return next(unauthorized("User is not active"));

        req.user = {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            roles: user.roles.map(({ role }) => role),
            preferences: user.preferences,
        };
        return next();
    } catch {
        return next(unauthorized("Invalid or expired access token"));
    }
};

export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
    const hasRole = req.user?.roles?.some((role) => allowedRoles.includes(role));
    return hasRole ? next() : next(forbidden());
};

export const authorizeRecipeOwner = async (req, _res, next) => {
    const recipeId = req.params.id || req.params.recipeId || req.params.recipeID;
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { authorId: true } });

    if (!recipe) return next(notFound("Recipe not found"));
    if (recipe.authorId !== req.user.id && !req.user.roles.some((role) => ["EDITOR", "ADMIN"].includes(role))) {
        return next(forbidden("You do not have permission to modify this recipe"));
    }

    req.recipeOwnerCheck = recipe;
    return next();
};
