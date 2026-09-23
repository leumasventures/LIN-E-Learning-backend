import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { refreshStore, type UserRecord } from "../data/users.js";

export function signAccess(user: UserRecord): string {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.accessSecret,
    { expiresIn: env.accessTtl as jwt.SignOptions["expiresIn"] }
  );
}

export function signRefresh(user: UserRecord): string {
  const token = jwt.sign({ sub: user.id }, env.refreshSecret, {
    expiresIn: env.refreshTtl as jwt.SignOptions["expiresIn"],
  });
  refreshStore.set(token, user.id);
  return token;
}

export function verifyAccess(token: string): jwt.JwtPayload {
  return jwt.verify(token, env.accessSecret) as jwt.JwtPayload;
}

export function verifyRefresh(token: string): jwt.JwtPayload {
  return jwt.verify(token, env.refreshSecret) as jwt.JwtPayload;
}