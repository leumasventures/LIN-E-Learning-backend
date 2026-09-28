import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

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

/** token -> userId (in-memory for now) */
export const refreshStore = new Map<string, string>();

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  matric: string | null;
  role: Role;
  tenantName: string;
  passwordHash: string;
  isActive: number | boolean;
}

function mapRow(row: UserRow): UserRecord {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    matric: row.matric ?? null,
    role: row.role,
    tenantName: row.tenantName,
    passwordHash: row.passwordHash,
    isActive: Boolean(row.isActive),
  };
}

const USER_SELECT = `
  SELECT id, name, email, matric, role,
         tenant_name AS tenantName,
         password_hash AS passwordHash,
         is_active AS isActive
  FROM users
`;

export async function findUserByIdentifier(
  identifier: string
): Promise<UserRecord | undefined> {
  const key = identifier.trim().toLowerCase();
  const [rows] = await pool.execute<UserRow[]>(
    `${USER_SELECT}
     WHERE (LOWER(email) = :id OR (matric IS NOT NULL AND LOWER(matric) = :id))
     LIMIT 1`,
    { id: key }
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const [rows] = await pool.execute<UserRow[]>(
    `${USER_SELECT} WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function findAllUsers(): Promise<UserRecord[]> {
  const [rows] = await pool.execute<UserRow[]>(USER_SELECT);
  return rows.map(mapRow);
}

export async function insertUser(user: {
  id: string;
  name: string;
  email: string;
  matric: string | null;
  role: Role;
  tenantName: string;
  passwordHash: string;
}): Promise<void> {
  await pool.execute(
    `INSERT INTO users (id, name, email, matric, role, tenant_name, password_hash, is_active)
     VALUES (:id, :name, :email, :matric, :role, :tenantName, :passwordHash, 1)`,
    {
      id: user.id,
      name: user.name,
      email: user.email,
      matric: user.matric,
      role: user.role,
      tenantName: user.tenantName,
      passwordHash: user.passwordHash,
    }
  );
}

export async function updateUserFields(
  id: string,
  fields: {
    name?: string;
    email?: string;
    matric?: string | null;
    role?: Role;
  }
): Promise<boolean> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };

  if (fields.name !== undefined) {
    sets.push("name = :name");
    params.name = fields.name;
  }
  if (fields.email !== undefined) {
    sets.push("email = :email");
    params.email = fields.email;
  }
  if (fields.matric !== undefined) {
    sets.push("matric = :matric");
    params.matric = fields.matric;
  }
  if (fields.role !== undefined) {
    sets.push("role = :role");
    params.role = fields.role;
  }

  if (sets.length === 0) return true;

  const [result] = await pool.execute(
    `UPDATE users SET ${sets.join(", ")} WHERE id = :id`,
    params
  );
  return (result as { affectedRows?: number }).affectedRows !== 0;
}

export async function deleteUserById(id: string): Promise<boolean> {
  const [result] = await pool.execute(`DELETE FROM users WHERE id = :id`, {
    id,
  });
  return (result as { affectedRows?: number }).affectedRows !== 0;
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
