import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import { conflict, unauthorized, badRequest } from "../../common/errors.js";

const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "dev-access-secret";
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-refresh-secret";
const refreshCookieName = "refreshToken";
const refreshMaxAgeMs = 1000 * 60 * 60 * 24 * 30;

const publicUser = (user) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: user.roles?.map(({ role }) => role) || [],
    preferences: user.preferences || null,
});

const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (user) => jwt.sign(
    { sub: user.id, roles: user.roles?.map(({ role }) => role) || [] },
    accessSecret(),
    { expiresIn: process.env.ACCESS_TOKEN_TTL || process.env.JWT_EXPIRES_IN || "15m" },
);

const createRefreshToken = (userId) => jwt.sign(
    { sub: userId, type: "refresh", nonce: crypto.randomUUID() },
    refreshSecret(),
    { expiresIn: process.env.REFRESH_TOKEN_TTL || "30d" },
);

export const setRefreshCookie = (res, token) => {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
        "Set-Cookie",
        `${refreshCookieName}=${encodeURIComponent(token)}; Max-Age=${refreshMaxAgeMs / 1000}; Path=/api/v1/auth; HttpOnly; SameSite=Lax${secure}`,
    );
};

export const clearRefreshCookie = (res) => {
    res.setHeader(
        "Set-Cookie",
        `${refreshCookieName}=; Max-Age=0; Path=/api/v1/auth; HttpOnly; SameSite=Lax`,
    );
};

const issueSession = async (user, metadata = {}) => {
    const refreshToken = createRefreshToken(user.id);
    const decoded = jwt.decode(refreshToken);

    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: hashRefreshToken(refreshToken),
            expiresAt: new Date(decoded.exp * 1000),
            userAgent: metadata.userAgent?.slice(0, 500),
        },
    });

    return { accessToken: createAccessToken(user), refreshToken };
};

export const register = async ({ displayName, name, email, password }, metadata) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(displayName || name || "").trim();

    if (!normalizedName || !normalizedEmail || !password) {
        throw badRequest("displayName, email and password are required");
    }
    if (password.length < 8) throw badRequest("Password must be at least 8 characters");

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) throw conflict("An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.$transaction((tx) => tx.user.create({
        data: {
            displayName: normalizedName,
            email: normalizedEmail,
            passwordHash,
            roles: { create: { role: "USER" } },
            preferences: { create: {} },
        },
        include: { roles: true, preferences: true },
    }));

    return { user: publicUser(user), ...(await issueSession(user, metadata)) };
};

export const login = async ({ email, password }, metadata) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { roles: true, preferences: true },
    });

    if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
        throw unauthorized("Invalid credentials");
    }

    return { user: publicUser(user), ...(await issueSession(user, metadata)) };
};

export const refresh = async (rawToken, metadata) => {
    if (!rawToken) throw unauthorized("Refresh token is required");

    let decoded;
    try {
        decoded = jwt.verify(rawToken, refreshSecret());
    } catch {
        throw unauthorized("Invalid or expired refresh token");
    }

    if (decoded.type !== "refresh") throw unauthorized("Invalid refresh token");

    const stored = await prisma.refreshToken.findFirst({
        where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
        include: { user: { include: { roles: true, preferences: true } } },
    });

    if (!stored || stored.expiresAt <= new Date() || stored.user.status !== "ACTIVE") {
        throw unauthorized("Invalid or expired refresh token");
    }

    const nextRefreshToken = createRefreshToken(stored.user.id);
    const nextDecoded = jwt.decode(nextRefreshToken);
    await prisma.$transaction([
        prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
        prisma.refreshToken.create({
            data: {
                userId: stored.user.id,
                tokenHash: hashRefreshToken(nextRefreshToken),
                expiresAt: new Date(nextDecoded.exp * 1000),
                userAgent: metadata.userAgent?.slice(0, 500),
            },
        }),
    ]);

    return {
        user: publicUser(stored.user),
        accessToken: createAccessToken(stored.user),
        refreshToken: nextRefreshToken,
    };
};

export const logout = async (rawToken) => {
    if (!rawToken) return;
    await prisma.refreshToken.updateMany({
        where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
        data: { revokedAt: new Date() },
    });
};

