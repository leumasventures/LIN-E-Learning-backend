import type { Request, Response, NextFunction } from "express";
import type { Role } from "../data/users.js";

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}