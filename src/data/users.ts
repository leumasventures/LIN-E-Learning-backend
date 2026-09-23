import bcrypt from "bcryptjs";

export type Role = "student" | "admin" | "lecturer";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  matric: string | null;
  role: Role;
  tenantName: string;
  passwordHash: string;
  isActive: boolean;
}

// Sync hash — avoids top-level await under "type": "commonjs"
const defaultHash = bcrypt.hashSync("Password123!", 10);

/** In-memory store — swap for Prisma later */
export const users: UserRecord[] = [
  {
    id: "1",
    name: "Chinedu Okafor",
    email: "chinedu.okafor@student.edu",
    matric: "CSC/2023/041",
    role: "student",
    tenantName: "SAHARCO",
    passwordHash: defaultHash,
    isActive: true,
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@school.edu",
    matric: null,
    role: "admin",
    tenantName: "SAHARCO",
    passwordHash: defaultHash,
    isActive: true,
  },
  {
    id: "3",
    name: "Dr. A. Obi",
    email: "a.obi@school.edu",
    matric: null,
    role: "lecturer",
    tenantName: "SAHARCO",
    passwordHash: defaultHash,
    isActive: true,
  },
];

/** token -> userId */
export const refreshStore = new Map<string, string>();

export function findUserByIdentifier(identifier: string): UserRecord | undefined {
  const key = identifier.trim().toLowerCase();
  return users.find(
    (u) =>
      u.email.toLowerCase() === key ||
      (u.matric !== null && u.matric.toLowerCase() === key)
  );
}

export function findUserById(id: string): UserRecord | undefined {
  return users.find((u) => u.id === id);
}

export function publicUser(u: UserRecord) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    matric: u.matric,
    tenantName: u.tenantName,
  };
}