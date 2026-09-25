import { Prisma } from "@prisma/client";

export const notFound = (req, _res, next) => {
    next({
        statusCode: 404,
        code: "ROUTE_NOT_FOUND",
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

export const errorHandler = (error, req, res, _next) => {
    console.error({
        requestId: req.requestId,
        code: error.code,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            return res.status(409).json({
                error: { code: "CONFLICT", message: "A record with the same unique value already exists", requestId: req.requestId },
            });
        }
        if (error.code === "P2025") {
            return res.status(404).json({
                error: { code: "NOT_FOUND", message: "The requested record was not found", requestId: req.requestId },
            });
        }
        if (error.code === "P2003") {
            return res.status(409).json({
                error: { code: "RELATED_RECORD_MISSING", message: "A related record was not found", requestId: req.requestId },
            });
        }
    }

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        error: {
            code: error.code || "INTERNAL_ERROR",
            message: statusCode >= 500 ? "Internal server error" : error.message,
            ...(error.details ? { details: error.details } : {}),
            requestId: req.requestId,
        },
    });
};
