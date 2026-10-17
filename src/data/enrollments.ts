import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface EnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  lessonsCompleted: number;
  enrolledAt: string;
}

type SqlParam = string | number | boolean | null;
type SqlParams = Record<string, SqlParam>;

interface EnrollmentRow extends RowDataPacket {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  lessonsCompleted: number;
  enrolledAt: string | Date;
}

function mapRow(row: EnrollmentRow): EnrollmentRecord {
  const enrolledAt =
    row.enrolledAt instanceof Date
      ? row.enrolledAt.toISOString().slice(0, 10)
      : String(row.enrolledAt).slice(0, 10);
  return {
    id: String(row.id),
    userId: String(row.userId),
    courseId: String(row.courseId),
    progress: Number(row.progress) || 0,
    lessonsCompleted: Number(row.lessonsCompleted) || 0,
    enrolledAt,
  };
}

const SELECT = `
  SELECT id, user_id AS userId, course_id AS courseId,
         progress, lessons_completed AS lessonsCompleted,
         enrolled_at AS enrolledAt
  FROM enrollments
`;

export async function findEnrollments(filters?: {
  userId?: string;
}): Promise<EnrollmentRecord[]> {
  if (filters?.userId) {
    const [rows] = await pool.execute<EnrollmentRow[]>(
      `${SELECT} WHERE user_id = :userId`,
      { userId: filters.userId } satisfies SqlParams
    );
    return rows.map(mapRow);
  }
  const [rows] = await pool.execute<EnrollmentRow[]>(SELECT);
  return rows.map(mapRow);
}

export async function findEnrollmentById(
  id: string
): Promise<EnrollmentRecord | undefined> {
  const [rows] = await pool.execute<EnrollmentRow[]>(
    `${SELECT} WHERE id = :id LIMIT 1`,
    { id } satisfies SqlParams
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function findEnrollmentByUserAndCourse(
  userId: string,
  courseId: string
): Promise<EnrollmentRecord | undefined> {
  const [rows] = await pool.execute<EnrollmentRow[]>(
    `${SELECT} WHERE user_id = :userId AND course_id = :courseId LIMIT 1`,
    { userId, courseId } satisfies SqlParams
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function insertEnrollment(
  record: EnrollmentRecord
): Promise<void> {
  await pool.execute(
    `INSERT INTO enrollments
       (id, user_id, course_id, progress, lessons_completed, enrolled_at)
     VALUES
       (:id, :userId, :courseId, :progress, :lessonsCompleted, :enrolledAt)`,
    {
      id: record.id,
      userId: record.userId,
      courseId: record.courseId,
      progress: record.progress,
      lessonsCompleted: record.lessonsCompleted,
      enrolledAt: record.enrolledAt,
    } satisfies SqlParams
  );
}

export async function updateEnrollmentProgress(
  id: string,
  fields: { progress?: number; lessonsCompleted?: number }
): Promise<boolean> {
  const sets: string[] = [];
  const params: SqlParams = { id };

  if (fields.progress !== undefined) {
    sets.push("progress = :progress");
    params.progress = fields.progress;
  }
  if (fields.lessonsCompleted !== undefined) {
    sets.push("lessons_completed = :lessonsCompleted");
    params.lessonsCompleted = fields.lessonsCompleted;
  }

  if (sets.length === 0) return true;

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE enrollments SET ${sets.join(", ")} WHERE id = :id`,
    params
  );
  return result.affectedRows !== 0;
}

export async function countEnrollments(): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM enrollments`
  );
  return Number(rows[0]?.c ?? 0);
}
