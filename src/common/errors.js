export class AppError extends Error {
    constructor(statusCode, code, message, details) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export const badRequest = (message, details) => new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Authentication required") => new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You do not have permission") => new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Resource not found") => new AppError(404, "NOT_FOUND", message);
export const conflict = (message = "Resource already exists") => new AppError(409, "CONFLICT", message);
export const validationError = (details) => new AppError(422, "VALIDATION_ERROR", "Request validation failed", details);
