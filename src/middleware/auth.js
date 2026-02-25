import { verifyToken } from "../utils/jwt.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = req.cookies.session || (header.startsWith("Bearer ") ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = { id: payload.sub };
  return next();
}

export function authOptional(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = req.cookies.session || (header.startsWith("Bearer ") ? header.slice(7) : null);

  if (!token) {
    return next();
  }

  const payload = verifyToken(token);
  if (payload) {
    req.user = { id: payload.sub };
  } else {
    req.user = null;
  }
  return next();
}
