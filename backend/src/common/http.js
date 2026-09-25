import { badRequest } from "./errors.js";

export const sendData = (res, data, status = 200, meta) => {
    const body = { data };
    if (meta) body.meta = meta;
    return res.status(status).json(body);
};

export const sendMessage = (res, message, status = 200) => res.status(status).json({ data: { message } });

export const pagination = (req) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 20, 1), 50);
    return { page, pageSize, skip: (page - 1) * pageSize };
};

export const paginationMeta = (page, pageSize, total) => ({
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
});

export const requiredString = (value, field, maxLength = 255) => {
    if (typeof value !== "string" || !value.trim()) throw badRequest(`${field} is required`);
    if (value.trim().length > maxLength) throw badRequest(`${field} is too long`);
    return value.trim();
};

export const optionalString = (value, field, maxLength = 255) => {
    if (value === undefined || value === null || value === "") return null;
    return requiredString(value, field, maxLength);
};

export const positiveInteger = (value, field, fallback) => {
    if (value === undefined && fallback !== undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw badRequest(`${field} must be a positive integer`);
    return parsed;
};

export const enumValue = (value, field, allowed, fallback) => {
    const selected = value ?? fallback;
    if (!allowed.includes(selected)) throw badRequest(`${field} must be one of: ${allowed.join(", ")}`);
    return selected;
};

export const parseIdList = (value) => {
    if (value === undefined) return [];
    const values = Array.isArray(value) ? value : String(value).split(",");
    return values.map((item) => item.trim()).filter(Boolean);
};
