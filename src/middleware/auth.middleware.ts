import type { Request, Response, NextFunction } from "express";
import { verifyAccess } from "../utils/tokens.js";
import type { Role } from "../data/users.js";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyAccess(token);
    req.userId = String(payload.sub);
    req.userRole = payload.role as Role;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}