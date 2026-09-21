import { sendData, sendMessage } from "../../common/http.js";
import { clearRefreshCookie, login as loginUser, logout as logoutUser, refresh as refreshSession, register as registerUser, setRefreshCookie } from "./authService.js";

const metadata = (req) => ({ userAgent: req.headers["user-agent"] });

export const register = async (req, res) => {
    const session = await registerUser(req.body, metadata(req));
    setRefreshCookie(res, session.refreshToken);
    return sendData(res, { user: session.user, accessToken: session.accessToken }, 201);
};

export const login = async (req, res) => {
    const session = await loginUser(req.body, metadata(req));
    setRefreshCookie(res, session.refreshToken);
    return sendData(res, { user: session.user, accessToken: session.accessToken });
};

export const refresh = async (req, res) => {
    const session = await refreshSession(req.cookies.refreshToken, metadata(req));
    setRefreshCookie(res, session.refreshToken);
    return sendData(res, { user: session.user, accessToken: session.accessToken });
};

export const logout = async (req, res) => {
    await logoutUser(req.cookies.refreshToken);
    clearRefreshCookie(res);
    return sendMessage(res, "Logged out successfully");
};

export const me = async (req, res) => sendData(res, { user: req.user });
