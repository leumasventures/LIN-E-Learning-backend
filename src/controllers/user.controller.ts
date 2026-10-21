import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  deleteUserById,
  findAllUsers,
  findUserById,
  findUserByIdentifier,
  insertUser,
  publicUser,
  updateUserFields,
  type Role,
  type UserRecord,
} from "../data/users.js";

const ALLOWED_ROLES: Role[] = ["student", "admin", "lecturer"];

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const list = await findAllUsers();
    res.json({
      count: list.length,
      users: list.map(publicUser),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const user = await findUserById(String(req.params.id));
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Students may only read themselves
    if (req.userRole === "student" && req.userId !== user.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

/** Admin-only: create user in MySQL without issuing session tokens for the new user. */
export async function createUser(req: Request, res: Response): Promise<void> {
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
    if (await findUserByIdentifier(normalizedEmail)) {
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

    const newUser: UserRecord = {
      id: randomUUID(),
      name: String(name).trim(),
      email: normalizedEmail,
      matric: matric ? String(matric).trim() : null,
      role: assignedRole,
      tenantName: "SAHARCO",
      passwordHash: await bcrypt.hash(String(password), 10),
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

    res.status(201).json({
      message: "User created successfully",
      user: publicUser(newUser),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await findUserById(String(req.params.id));
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Students can only update themselves; lecturers cannot update others
    if (req.userRole !== "admin" && req.userId !== user.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const { name, email, matric } = req.body || {};
    const fields: {
      name?: string;
      email?: string;
      matric?: string | null;
      role?: Role;
    } = {};

    if (name) fields.name = String(name).trim();
    if (email) fields.email = String(email).trim().toLowerCase();
    if (matric !== undefined) fields.matric = matric ? String(matric).trim() : null;

    // Only admin can change role
    if (req.body?.role && req.userRole === "admin") {
      if (ALLOWED_ROLES.includes(req.body.role)) {
        fields.role = req.body.role as Role;
      }
    }

    await updateUserFields(user.id, fields);
    const updated = await findUserById(user.id);
    res.json({
      message: "User updated successfully",
      user: publicUser(updated!),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (req.userId === id) {
      res.status(400).json({ message: "Cannot delete your own account" });
      return;
    }
    const ok = await deleteUserById(id);
    if (!ok) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
