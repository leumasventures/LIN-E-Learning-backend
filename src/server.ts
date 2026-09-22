import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || "7d";

// In-memory users for local demo — replace with PostgreSQL/Prisma
const passwordHash = await bcrypt.hash("Password123!", 10);
const users = [
  {
    id: "1",
    name: "Chinedu Okafor",
    email: "chinedu.okafor@student.edu",
    matric: "CSC/2023/041",
    role: "student",
    tenantName: "SAHARCO",
    passwordHash,
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@school.edu",
    matric: null,
    role: "admin",
    tenantName: "SAHARCO",
    passwordHash,
  },
];

const refreshStore = new Map(); // token -> userId

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefresh(user) {
  const token = jwt.sign({ sub: user.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
  refreshStore.set(token, user.id);
  return token;
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    matric: u.matric,
    tenantName: u.tenantName,
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const identifier = String(email).trim().toLowerCase();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === identifier ||
      (u.matric && u.matric.toLowerCase() === identifier)
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Optional: enforce selected portal role matches account
  if (role && role !== user.role) {
    return res
      .status(403)
      .json({ message: `This account is a ${user.role}, not a ${role}` });
  }

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  return res.json({
    user: publicUser(user),
    accessToken,
    refreshToken,
  });
});

app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken || !refreshStore.has(refreshToken)) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ message: "User not found" });

    // rotate refresh
    refreshStore.delete(refreshToken);
    const accessToken = signAccess(user);
    const newRefresh = signRefresh(user);
    return res.json({ accessToken, refreshToken: newRefresh });
  } catch {
    refreshStore.delete(refreshToken);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(publicUser(user));
});

app.post("/api/auth/logout", authMiddleware, (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) refreshStore.delete(refreshToken);
  return res.json({ ok: true });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log("Demo logins:");
  console.log("  student: chinedu.okafor@student.edu / Password123!");
  console.log("  admin:   admin@school.edu / Password123!");
});