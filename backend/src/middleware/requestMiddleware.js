import crypto from "node:crypto";

export const requestId = (req, res, next) => {
    const id = req.headers["x-request-id"] || `req_${crypto.randomUUID()}`;
    req.requestId = String(id);
    res.setHeader("X-Request-Id", req.requestId);
    next();
};

export const securityHeaders = (_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "same-origin");
    next();
};

export const cors = (req, res, next) => {
    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
    const origin = req.headers.origin;

    if (origin === allowedOrigin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-Id");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");

    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
};

export const createRateLimiter = ({ windowMs, max, message }) => {
    const hits = new Map();

    return (req, res, next) => {
        const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
        const now = Date.now();
        const current = hits.get(key);

        if (!current || current.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        current.count += 1;
        if (current.count > max) {
            res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
            return res.status(429).json({
                error: { code: "RATE_LIMITED", message, requestId: req.requestId },
            });
        }

        next();
    };
};

// ponytail: in-memory limiter is enough for this single-instance portfolio API; use Redis when scaling horizontally.
