import type { Request, Response } from "express";
import {
  findUserById,
  publicUser,
  users,
  type Role,
} from "../data/users.js";

export function getUsers(_req: Request, res: Response): void {
  res.json({
    count: users.length,
    users: users.map(publicUser),
  });
}

export function getUserById(req: Request, res: Response): void {
  const user = findUserById(String(req.params.id));
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ user: publicUser(user) });
}

export function updateUser(req: Request, res: Response): void {
  const user = findUserById(String(req.params.id));
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
  if (name) user.name = String(name).trim();
  if (email) user.email = String(email).trim().toLowerCase();
  if (matric !== undefined) user.matric = matric ? String(matric).trim() : null;

  // Only admin can change role
  if (req.body?.role && req.userRole === "admin") {
    user.role = req.body.role as Role;
  }

  res.json({ message: "User updated successfully", user: publicUser(user) });
}

export function deleteUser(req: Request, res: Response): void {
  const index = users.findIndex((u) => u.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  users.splice(index, 1);
  res.json({ message: "User deleted successfully" });
}