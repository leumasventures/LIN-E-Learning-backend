import type { Role } from "../data/store.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
    }
  }
}

export {};