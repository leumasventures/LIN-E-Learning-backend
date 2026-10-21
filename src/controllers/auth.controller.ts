import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  findUserById,
  findUserByIdentifier,
  hasValidRefreshToken,
  insertUser,
  publicUser,
  revokeRefreshToken,
  type Role,
  type UserRecord,
} from "../data/users.js";
import { signAccess, signRefresh, verifyAccess, verifyRefresh } from "../utils/tokens.js";

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
      refreshToken: await signRefresh(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * Public signup always creates a student.
 * Elevated roles (admin/lecturer) require a valid admin Bearer token.
 * Tokens are only issued for the new user on public student self-signup
 * (not when an admin creates an account on their behalf).
 */
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

    const requestedRole: Role =
      role && ALLOWED_ROLES.includes(role) ? role : "student";

    let actorIsAdmin = false;
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      try {
        const payload = verifyAccess(header.slice(7));
        actorIsAdmin = payload.role === "admin";
      } catch {
        actorIsAdmin = false;
      }
    }

    if (requestedRole !== "student" && !actorIsAdmin) {
      res.status(403).json({
        message: "Only an authenticated admin can create admin or lecturer accounts",
      });
      return;
    }

    const assignedRole: Role = actorIsAdmin ? requestedRole : "student";

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
        res.status(409).json({
          message: "User with this email or matric already exists",
        });
        return;
      }
      throw err;
    }

    // Admin creating on behalf of someone: return user only (do not switch session)
    if (actorIsAdmin) {
      res.status(201).json({
        message: "User created successfully",
        user: publicUser(newUser),
      });
      return;
    }

    res.status(201).json({
      message: "Registration successful",
      user: publicUser(newUser),
      accessToken: signAccess(newUser),
      refreshToken: await signRefresh(newUser),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken || !(await hasValidRefreshToken(String(refreshToken)))) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const payload = verifyRefresh(String(refreshToken));
    const user = await findUserById(String(payload.sub));
    if (!user || !user.isActive) {
      await revokeRefreshToken(String(refreshToken));
      res.status(401).json({ message: "User not found" });
      return;
    }

    await revokeRefreshToken(String(refreshToken));
    res.json({
      accessToken: signAccess(user),
      refreshToken: await signRefresh(user),
    });
  } catch {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await revokeRefreshToken(String(refreshToken)).catch(() => {});
    }
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

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body || {};
  if (refreshToken) {
    await revokeRefreshToken(String(refreshToken)).catch(() => {});
  }
  res.json({ ok: true });
}
