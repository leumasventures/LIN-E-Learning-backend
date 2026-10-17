import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import {
  storeRefreshToken,
  type UserRecord,
} from "../data/users.js";

function parseTtlToMs(ttl: string): number {
  const m = /^(\d+)([smhd])$/i.exec(ttl.trim());
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  switch (m[2].toLowerCase()) {
    case "s":
      return n * 1000;
    case "m":
      return n * 60 * 1000;
    case "h":
      return n * 60 * 60 * 1000;
    case "d":
      return n * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export function signAccess(user: UserRecord): string {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.accessSecret,
    { expiresIn: env.accessTtl as jwt.SignOptions["expiresIn"] }
  );
}

export async function signRefresh(user: UserRecord): Promise<string> {
  const token = jwt.sign({ sub: user.id }, env.refreshSecret, {
    expiresIn: env.refreshTtl as jwt.SignOptions["expiresIn"],
  });
  const expiresAt = new Date(Date.now() + parseTtlToMs(env.refreshTtl));
  await storeRefreshToken(user.id, token, expiresAt);
  return token;
}

export function verifyAccess(token: string) {
  return jwt.verify(token, env.accessSecret) as jwt.JwtPayload;
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, env.refreshSecret) as jwt.JwtPayload;
}
