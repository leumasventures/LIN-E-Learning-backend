import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  findUserById,
  findUserByIdentifier,
  insertUser,
  publicUser,
  refreshStore,
  type Role,
  type UserRecord,
} from "../data/users.js";
import { signAccess, signRefresh, verifyRefresh } from "../utils/tokens.js";

const ALLOWED_ROLES: Role[] = ["student", "admin", "lecturer"];

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await findUserByIdentifier(String(email));
    if (!user || !user.isActive) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (role && role !== user.role) {
      res.status(403).json({
        message: `This account is a ${user.role}, not a ${role}`,
      });
      return;
    }

    res.json({
      user: publicUser(user),
      accessToken: signAccess(user),
      refreshToken: signRefresh(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role, matric } = req.body || {};

    if (!name || !email || !password) {
      res.status(400).json({
        message: "Name, email and password are required",
      });
      return;
    }

    if (String(password).length < 8) {
      res.status(400).json({
        message: "Password must be at least 8 characters",
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await findUserByIdentifier(normalizedEmail);
    if (existing) {
      res.status(409).json({ message: "User with this email already exists" });
      return;
    }

    if (matric) {
      const byMatric = await findUserByIdentifier(String(matric));
      if (byMatric) {
        res.status(409).json({ message: "User with this matric already exists" });
        return;
      }
    }

    const assignedRole: Role =
      role && ALLOWED_ROLES.includes(role) ? role : "student";

    // Only admins should create admin/lecturer in production — open for demo
    const passwordHash = await bcrypt.hash(String(password), 10);
    const id = randomUUID();

    const newUser: UserRecord = {
      id,
      name: String(name).trim(),
      email: normalizedEmail,
      matric: matric ? String(matric).trim() : null,
      role: assignedRole,
      tenantName: "SAHARCO",
      passwordHash,
      isActive: true,
    };

    try {
      await insertUser(newUser);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "ER_DUP_ENTRY") {
        res.status(409).json({ message: "User with this email or matric already exists" });
        return;
      }
      throw err;
    }

    res.status(201).json({
      message: "Registration successful",
      user: publicUser(newUser),
      accessToken: signAccess(newUser),
      refreshToken: signRefresh(newUser),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken || !refreshStore.has(refreshToken)) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const payload = verifyRefresh(refreshToken);
    const user = await findUserById(String(payload.sub));
    if (!user || !user.isActive) {
      refreshStore.delete(refreshToken);
      res.status(401).json({ message: "User not found" });
      return;
    }

    refreshStore.delete(refreshToken);
    res.json({
      accessToken: signAccess(user),
      refreshToken: signRefresh(user),
    });
  } catch {
    const { refreshToken } = req.body || {};
    if (refreshToken) refreshStore.delete(refreshToken);
    res.status(401).json({ message: "Invalid refresh token" });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await findUserById(String(req.userId));
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export function logout(req: Request, res: Response): void {
  const { refreshToken } = req.body || {};
  if (refreshToken) refreshStore.delete(refreshToken);
  res.json({ ok: true });
}
