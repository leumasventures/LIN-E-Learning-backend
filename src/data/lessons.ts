import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface LessonRecord {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  order: number;
  content: string;
}

type SqlParam = string | number | boolean | null;
type SqlParams = Record<string, SqlParam>;

interface LessonRow extends RowDataPacket {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  order: number;
  content: string;
}

function mapRow(row: LessonRow): LessonRecord {
  return {
    id: String(row.id),
    courseId: String(row.courseId),
    title: row.title,
    duration: row.duration,
    order: Number(row.order) || 0,
    content: row.content ?? "",
  };
}

const SELECT = `
  SELECT id, course_id AS courseId, title, duration,
         sort_order AS \`order\`, content
  FROM lessons
`;

export async function findLessons(courseId?: string): Promise<LessonRecord[]> {
  if (courseId) {
    const [rows] = await pool.execute<LessonRow[]>(
      `${SELECT} WHERE course_id = :courseId ORDER BY sort_order ASC`,
      { courseId } satisfies SqlParams
    );
    return rows.map(mapRow);
  }
  const [rows] = await pool.execute<LessonRow[]>(
    `${SELECT} ORDER BY course_id, sort_order ASC`
  );
  return rows.map(mapRow);
}

export async function findLessonById(
  id: string
): Promise<LessonRecord | undefined> {
  const [rows] = await pool.execute<LessonRow[]>(
    `${SELECT} WHERE id = :id LIMIT 1`,
    { id } satisfies SqlParams
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function countLessonsForCourse(courseId: string): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM lessons WHERE course_id = :courseId`,
    { courseId } satisfies SqlParams
  );
  return Number(rows[0]?.c ?? 0);
}

export async function insertLesson(lesson: LessonRecord): Promise<void> {
  await pool.execute(
    `INSERT INTO lessons (id, course_id, title, duration, sort_order, content)
     VALUES (:id, :courseId, :title, :duration, :order, :content)`,
    {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      duration: lesson.duration,
      order: lesson.order,
      content: lesson.content,
    } satisfies SqlParams
  );
}

export async function updateLessonFields(
  id: string,
  fields: Partial<Pick<LessonRecord, "title" | "duration" | "order" | "content">>
): Promise<boolean> {
  const sets: string[] = [];
  const params: SqlParams = { id };

  if (fields.title !== undefined) {
    sets.push("title = :title");
    params.title = fields.title;
  }
  if (fields.duration !== undefined) {
    sets.push("duration = :duration");
    params.duration = fields.duration;
  }
  if (fields.order !== undefined) {
    sets.push("sort_order = :order");
    params.order = fields.order;
  }
  if (fields.content !== undefined) {
    sets.push("content = :content");
    params.content = fields.content;
  }

  if (sets.length === 0) return true;

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE lessons SET ${sets.join(", ")} WHERE id = :id`,
    params
  );
  return result.affectedRows !== 0;
}

export async function deleteLessonById(id: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM lessons WHERE id = :id`,
    { id } satisfies SqlParams
  );
  return result.affectedRows !== 0;
}
