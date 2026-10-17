import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface ExamRecord {
  id: string;
  title: string;
  courseId: string;
  durationMinutes: number;
  questionIds: string[];
  startDate: string;
  status: "Scheduled" | "Active" | "Closed";
}

export interface ResultRecord {
  id: string;
  userId: string;
  examId: string;
  courseId: string;
  score: number;
  total: number;
  submittedAt: string;
}

type SqlParam = string | number | boolean | null;
type SqlParams = Record<string, SqlParam>;

interface ExamRow extends RowDataPacket {
  id: string;
  title: string;
  courseId: string;
  durationMinutes: number;
  startDate: string | Date;
  status: "Scheduled" | "Active" | "Closed";
}

interface ResultRow extends RowDataPacket {
  id: string;
  userId: string;
  examId: string;
  courseId: string;
  score: number;
  total: number;
  submittedAt: string | Date;
}

function formatDateTime(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapExam(row: ExamRow, questionIds: string[] = []): ExamRecord {
  return {
    id: String(row.id),
    title: row.title,
    courseId: String(row.courseId),
    durationMinutes: Number(row.durationMinutes) || 60,
    questionIds,
    startDate: formatDateTime(row.startDate),
    status: row.status,
  };
}

function mapResult(row: ResultRow): ResultRecord {
  return {
    id: String(row.id),
    userId: String(row.userId),
    examId: String(row.examId),
    courseId: String(row.courseId),
    score: Number(row.score) || 0,
    total: Number(row.total) || 0,
    submittedAt: formatDateTime(row.submittedAt),
  };
}

const EXAM_SELECT = `
  SELECT id, title, course_id AS courseId,
         duration_minutes AS durationMinutes,
         start_date AS startDate, status
  FROM exams
`;

async function loadQuestionIds(examId: string): Promise<string[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT question_id AS qid FROM exam_questions
     WHERE exam_id = :examId ORDER BY sort_order ASC`,
    { examId } satisfies SqlParams
  );
  return rows.map((r) => String(r.qid));
}

export async function findExams(courseId?: string): Promise<ExamRecord[]> {
  const [rows] = courseId
    ? await pool.execute<ExamRow[]>(
        `${EXAM_SELECT} WHERE course_id = :courseId`,
        { courseId } satisfies SqlParams
      )
    : await pool.execute<ExamRow[]>(EXAM_SELECT);

  const result: ExamRecord[] = [];
  for (const row of rows) {
    const qids = await loadQuestionIds(String(row.id));
    result.push(mapExam(row, qids));
  }
  return result;
}

export async function findExamById(
  id: string
): Promise<ExamRecord | undefined> {
  const [rows] = await pool.execute<ExamRow[]>(
    `${EXAM_SELECT} WHERE id = :id LIMIT 1`,
    { id } satisfies SqlParams
  );
  if (!rows[0]) return undefined;
  const qids = await loadQuestionIds(id);
  return mapExam(rows[0], qids);
}

export async function insertExam(exam: ExamRecord): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `INSERT INTO exams
         (id, title, course_id, duration_minutes, start_date, status)
       VALUES
         (:id, :title, :courseId, :durationMinutes, :startDate, :status)`,
      {
        id: exam.id,
        title: exam.title,
        courseId: exam.courseId,
        durationMinutes: exam.durationMinutes,
        startDate: exam.startDate.slice(0, 19).replace("T", " "),
        status: exam.status,
      }
    );

    for (let i = 0; i < exam.questionIds.length; i++) {
      await conn.execute(
        `INSERT INTO exam_questions (exam_id, question_id, sort_order)
         VALUES (:examId, :questionId, :sortOrder)`,
        {
          examId: exam.id,
          questionId: exam.questionIds[i],
          sortOrder: i,
        }
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateExamFields(
  id: string,
  fields: Partial<
    Pick<
      ExamRecord,
      "title" | "durationMinutes" | "questionIds" | "startDate" | "status"
    >
  >
): Promise<boolean> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const sets: string[] = [];
    const params: SqlParams = { id };

    if (fields.title !== undefined) {
      sets.push("title = :title");
      params.title = fields.title;
    }
    if (fields.durationMinutes !== undefined) {
      sets.push("duration_minutes = :durationMinutes");
      params.durationMinutes = fields.durationMinutes;
    }
    if (fields.startDate !== undefined) {
      sets.push("start_date = :startDate");
      params.startDate = fields.startDate.slice(0, 19).replace("T", " ");
    }
    if (fields.status !== undefined) {
      sets.push("status = :status");
      params.status = fields.status;
    }

    if (sets.length > 0) {
      const [result] = await conn.execute<ResultSetHeader>(
        `UPDATE exams SET ${sets.join(", ")} WHERE id = :id`,
        params
      );
      if (result.affectedRows === 0) {
        await conn.rollback();
        return false;
      }
    }

    if (fields.questionIds !== undefined) {
      await conn.execute(`DELETE FROM exam_questions WHERE exam_id = :id`, {
        id,
      });
      for (let i = 0; i < fields.questionIds.length; i++) {
        await conn.execute(
          `INSERT INTO exam_questions (exam_id, question_id, sort_order)
           VALUES (:examId, :questionId, :sortOrder)`,
          {
            examId: id,
            questionId: fields.questionIds[i],
            sortOrder: i,
          }
        );
      }
    }

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function deleteExamById(id: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM exams WHERE id = :id`,
    { id } satisfies SqlParams
  );
  return result.affectedRows !== 0;
}

export async function countExams(status?: string): Promise<number> {
  if (status) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM exams WHERE status = :status`,
      { status } satisfies SqlParams
    );
    return Number(rows[0]?.c ?? 0);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM exams`
  );
  return Number(rows[0]?.c ?? 0);
}

// --- results ---

const RESULT_SELECT = `
  SELECT id, user_id AS userId, exam_id AS examId, course_id AS courseId,
         score, total, submitted_at AS submittedAt
  FROM results
`;

export async function findResults(filters?: {
  userId?: string;
  courseId?: string;
}): Promise<ResultRecord[]> {
  const clauses: string[] = [];
  const params: SqlParams = {};
  if (filters?.userId) {
    clauses.push("user_id = :userId");
    params.userId = filters.userId;
  }
  if (filters?.courseId) {
    clauses.push("course_id = :courseId");
    params.courseId = filters.courseId;
  }
  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.execute<ResultRow[]>(
    `${RESULT_SELECT}${where}`,
    params
  );
  return rows.map(mapResult);
}

export async function insertResult(result: ResultRecord): Promise<void> {
  await pool.execute(
    `INSERT INTO results
       (id, user_id, exam_id, course_id, score, total, submitted_at)
     VALUES
       (:id, :userId, :examId, :courseId, :score, :total, :submittedAt)`,
    {
      id: result.id,
      userId: result.userId,
      examId: result.examId,
      courseId: result.courseId,
      score: result.score,
      total: result.total,
      submittedAt: result.submittedAt.slice(0, 19).replace("T", " "),
    } satisfies SqlParams
  );
}

export async function getResultStats(): Promise<{
  averageScore: number;
  passRate: number;
  count: number;
}> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS c,
       COALESCE(AVG(CASE WHEN total > 0 THEN (score / total) * 100 ELSE 0 END), 0) AS avgScore,
       COALESCE(SUM(CASE WHEN total > 0 AND (score / total) >= 0.45 THEN 1 ELSE 0 END), 0) AS passed
     FROM results`
  );
  const c = Number(rows[0]?.c ?? 0);
  const avg = Math.round(Number(rows[0]?.avgScore ?? 0));
  const passed = Number(rows[0]?.passed ?? 0);
  return {
    count: c,
    averageScore: avg,
    passRate: c > 0 ? Math.round((passed / c) * 100) : 0,
  };
}
