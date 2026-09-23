import type { Role } from "../data/users.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
    }
  }
}

export {};