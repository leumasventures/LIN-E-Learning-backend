import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface QuestionRecord {
  id: string;
  courseId: string;
  type: "MCQ" | "True/False";
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
}

type SqlParam = string | number | boolean | null;
type SqlParams = Record<string, SqlParam>;

interface QuestionRow extends RowDataPacket {
  id: string;
  courseId: string;
  type: "MCQ" | "True/False";
  text: string;
  optionsJson: string | string[] | unknown;
  correctIndex: number;
  points: number;
}

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapRow(row: QuestionRow): QuestionRecord {
  return {
    id: String(row.id),
    courseId: String(row.courseId),
    type: row.type,
    text: row.text,
    options: parseOptions(row.optionsJson),
    correctIndex: Number(row.correctIndex) || 0,
    points: Number(row.points) || 1,
  };
}

const SELECT = `
  SELECT id, course_id AS courseId, type, text,
         options_json AS optionsJson,
         correct_index AS correctIndex,
         points
  FROM questions
`;

export async function findQuestions(courseId?: string): Promise<QuestionRecord[]> {
  if (courseId) {
    const [rows] = await pool.execute<QuestionRow[]>(
      `${SELECT} WHERE course_id = :courseId`,
      { courseId } satisfies SqlParams
    );
    return rows.map(mapRow);
  }
  const [rows] = await pool.execute<QuestionRow[]>(SELECT);
  return rows.map(mapRow);
}

export async function findQuestionById(
  id: string
): Promise<QuestionRecord | undefined> {
  const [rows] = await pool.execute<QuestionRow[]>(
    `${SELECT} WHERE id = :id LIMIT 1`,
    { id } satisfies SqlParams
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function findQuestionsByIds(
  ids: string[]
): Promise<QuestionRecord[]> {
  if (ids.length === 0) return [];
  // Named placeholders for IN lists are awkward; use positional for this query
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await pool.query<QuestionRow[]>(
    `SELECT id, course_id AS courseId, type, text,
            options_json AS optionsJson,
            correct_index AS correctIndex,
            points
     FROM questions WHERE id IN (${placeholders})`,
    ids
  );
  return rows.map(mapRow);
}

export async function insertQuestion(q: QuestionRecord): Promise<void> {
  await pool.execute(
    `INSERT INTO questions
       (id, course_id, type, text, options_json, correct_index, points)
     VALUES
       (:id, :courseId, :type, :text, :optionsJson, :correctIndex, :points)`,
    {
      id: q.id,
      courseId: q.courseId,
      type: q.type,
      text: q.text,
      optionsJson: JSON.stringify(q.options),
      correctIndex: q.correctIndex,
      points: q.points,
    } satisfies SqlParams
  );
}

export async function updateQuestionFields(
  id: string,
  fields: Partial<
    Pick<QuestionRecord, "text" | "options" | "correctIndex" | "points" | "type">
  >
): Promise<boolean> {
  const sets: string[] = [];
  const params: SqlParams = { id };

  if (fields.text !== undefined) {
    sets.push("text = :text");
    params.text = fields.text;
  }
  if (fields.options !== undefined) {
    sets.push("options_json = :optionsJson");
    params.optionsJson = JSON.stringify(fields.options);
  }
  if (fields.correctIndex !== undefined) {
    sets.push("correct_index = :correctIndex");
    params.correctIndex = fields.correctIndex;
  }
  if (fields.points !== undefined) {
    sets.push("points = :points");
    params.points = fields.points;
  }
  if (fields.type !== undefined) {
    sets.push("type = :type");
    params.type = fields.type;
  }

  if (sets.length === 0) return true;

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE questions SET ${sets.join(", ")} WHERE id = :id`,
    params
  );
  return result.affectedRows !== 0;
}

export async function deleteQuestionById(id: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM questions WHERE id = :id`,
    { id } satisfies SqlParams
  );
  return result.affectedRows !== 0;
}
