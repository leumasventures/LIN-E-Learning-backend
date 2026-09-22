import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
}

// Temporary users array.
// We will replace this with PostgreSQL + Prisma later.
const users: User[] = [];

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
      return;
    }

    const existingUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "student"
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
      return;
    }

    const user = users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured"
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      secret,
      {
        expiresIn: "7d"
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};