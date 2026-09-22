import { Request, Response } from "express";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Temporary data.
// This will later come from PostgreSQL.
const users: User[] = [];

export const getUsers = (
  _req: Request,
  res: Response
): void => {
  res.status(200).json({
    success: true,
    count: users.length,
    users
  });
};

export const getUserById = (
  req: Request,
  res: Response
): void => {
  const { id } = req.params;

  const user = users.find((item) => item.id === id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found"
    });
    return;
  }

  res.status(200).json({
    success: true,
    user
  });
};

export const updateUser = (
  req: Request,
  res: Response
): void => {
  const { id } = req.params;

  const userIndex = users.findIndex(
    (item) => item.id === id
  );

  if (userIndex === -1) {
    res.status(404).json({
      success: false,
      message: "User not found"
    });
    return;
  }

  const { name, email, role } = req.body;

  if (name) {
    users[userIndex].name = name;
  }

  if (email) {
    users[userIndex].email = email;
  }

  if (role) {
    users[userIndex].role = role;
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user: users[userIndex]
  });
};

export const deleteUser = (
  req: Request,
  res: Response
): void => {
  const { id } = req.params;

  const userIndex = users.findIndex(
    (item) => item.id === id
  );

  if (userIndex === -1) {
    res.status(404).json({
      success: false,
      message: "User not found"
    });
    return;
  }

  users.splice(userIndex, 1);

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
};