import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface CourseRecord {
  id: string;
  code: string;
  title: string;
  lecturerId: string | null;
  lecturerName: string;
  units: number;
  duration: string;
  certification: string;
  status: "Active" | "Draft";
  description?: string;
}

type SqlParam = string | number | boolean | null;
type SqlParams = Record<string, SqlParam>;

interface CourseRow extends RowDataPacket {
  id: string;
  code: string;
  title: string;
  lecturerId: string | null;
  lecturerName: string;
  units: number;
  duration: string;
  certification: string;
  status: "Active" | "Draft";
  description: string | null;
}

function mapRow(row: CourseRow): CourseRecord {
  return {
    id: String(row.id),
    code: row.code,
    title: row.title,
    lecturerId: row.lecturerId ?? null,
    lecturerName: row.lecturerName ?? "",
    units: Number(row.units) || 0,
    duration: row.duration,
    certification: row.certification,
    status: row.status,
    description: row.description ?? undefined,
  };
}

const SELECT = `
  SELECT id, code, title,
         lecturer_id AS lecturerId,
         lecturer_name AS lecturerName,
         units, duration, certification, status, description
  FROM courses
`;

export async function findAllCourses(): Promise<CourseRecord[]> {
  const [rows] = await pool.execute<CourseRow[]>(SELECT);
  return rows.map(mapRow);
}

export async function findCourseByIdOrCode(
  idOrCode: string
): Promise<CourseRecord | undefined> {
  const [rows] = await pool.execute<CourseRow[]>(
    `${SELECT} WHERE id = :key OR code = :key LIMIT 1`,
    { key: idOrCode } satisfies SqlParams
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function findCourseById(
  id: string
): Promise<CourseRecord | undefined> {
  const [rows] = await pool.execute<CourseRow[]>(
    `${SELECT} WHERE id = :id LIMIT 1`,
    { id } satisfies SqlParams
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function insertCourse(course: CourseRecord): Promise<void> {
  await pool.execute(
    `INSERT INTO courses
       (id, code, title, lecturer_id, lecturer_name, units, duration, certification, status, description)
     VALUES
       (:id, :code, :title, :lecturerId, :lecturerName, :units, :duration, :certification, :status, :description)`,
    {
      id: course.id,
      code: course.code,
      title: course.title,
      lecturerId: course.lecturerId,
      lecturerName: course.lecturerName,
      units: course.units,
      duration: course.duration,
      certification: course.certification,
      status: course.status,
      description: course.description ?? null,
    } satisfies SqlParams
  );
}

export async function updateCourseFields(
  id: string,
  fields: Partial<
    Pick<
      CourseRecord,
      | "title"
      | "lecturerId"
      | "lecturerName"
      | "units"
      | "duration"
      | "certification"
      | "status"
      | "description"
    >
  >
): Promise<boolean> {
  const sets: string[] = [];
  const params: SqlParams = { id };

  if (fields.title !== undefined) {
    sets.push("title = :title");
    params.title = fields.title;
  }
  if (fields.lecturerId !== undefined) {
    sets.push("lecturer_id = :lecturerId");
    params.lecturerId = fields.lecturerId;
  }
  if (fields.lecturerName !== undefined) {
    sets.push("lecturer_name = :lecturerName");
    params.lecturerName = fields.lecturerName;
  }
  if (fields.units !== undefined) {
    sets.push("units = :units");
    params.units = fields.units;
  }
  if (fields.duration !== undefined) {
    sets.push("duration = :duration");
    params.duration = fields.duration;
  }
  if (fields.certification !== undefined) {
    sets.push("certification = :certification");
    params.certification = fields.certification;
  }
  if (fields.status !== undefined) {
    sets.push("status = :status");
    params.status = fields.status;
  }
  if (fields.description !== undefined) {
    sets.push("description = :description");
    params.description = fields.description ?? null;
  }

  if (sets.length === 0) return true;

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE courses SET ${sets.join(", ")} WHERE id = :id`,
    params
  );
  return result.affectedRows !== 0;
}

export async function deleteCourseById(id: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM courses WHERE id = :id`,
    { id } satisfies SqlParams
  );
  return result.affectedRows !== 0;
}

export async function countCourses(status?: "Active" | "Draft"): Promise<number> {
  if (status) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM courses WHERE status = :status`,
      { status } satisfies SqlParams
    );
    return Number(rows[0]?.c ?? 0);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM courses`
  );
  return Number(rows[0]?.c ?? 0);
}
