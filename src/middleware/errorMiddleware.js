export const notFound = (req, _res, next) => {
    next({
        statusCode: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

export const errorHandler = (error, _req, res, _next) => {
    console.error(error);

    if (error.code === "P2002") {
        return res.status(409).json({
            status: "error",
            message: "A record with the same unique value already exists",
        });
    }

    if (error.code === "P2025") {
        return res.status(404).json({
            status: "error",
            message: "The requested record was not found",
        });
    }

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        status: "error",
        message: statusCode >= 500 ? "Internal server error" : error.message,
    });
};
