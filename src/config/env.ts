import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  accessSecret: required("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
  refreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtl: process.env.REFRESH_TOKEN_TTL || "7d",
  corsOrigin: process.env.CORS_ORIGIN || true,
};