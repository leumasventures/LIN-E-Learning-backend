import type { Request, Response } from "express";
import {
  deleteUserById,
  findAllUsers,
  findUserById,
  publicUser,
  updateUserFields,
  type Role,
} from "../data/users.js";

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
    res.json({ user: publicUser(user) });
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

    // Students can only update themselves
    if (req.userRole === "student" && req.userId !== user.id) {
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
      fields.role = req.body.role as Role;
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
    const ok = await deleteUserById(String(req.params.id));
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
