import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);
  const message =
    err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({
    message: env.nodeEnv === "production" ? "Internal server error" : message,
  });
}