import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { findCourseById } from "../data/courses.js";
import { findQuestionsByIds } from "../data/questions.js";
import {
  deleteExamById,
  findExamById,
  findExams,
  insertExam,
  insertResult,
  updateExamFields,
  type ExamRecord,
  type ResultRecord,
} from "../data/exams.js";

export async function listExams(req: Request, res: Response): Promise<void> {
  try {
    const courseId = req.query.courseId
      ? String(req.query.courseId)
      : undefined;
    const list = await findExams(courseId);
    const enriched = await Promise.all(
      list.map(async (e) => {
        const course = await findCourseById(e.courseId);
        return {
          ...e,
          courseCode: course?.code,
          questionCount: e.questionIds.length,
        };
      })
    );
    res.json({ count: enriched.length, exams: enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getExam(req: Request, res: Response): Promise<void> {
  try {
    const exam = await findExamById(String(req.params.id));
    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }
    const qs = await findQuestionsByIds(exam.questionIds);
    const ordered = exam.questionIds
      .map((id) => qs.find((q) => q.id === id))
      .filter(Boolean);
    const safeQs = ordered.map((q) => {
      if (!q) return q;
      if (req.userRole === "student") {
        const { correctIndex: _, ...safe } = q;
        return safe;
      }
      return q;
    });
    res.json({ exam, questions: safeQs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createExam(req: Request, res: Response): Promise<void> {
  try {
    const { title, courseId, durationMinutes, questionIds, startDate, status } =
      req.body || {};
    if (!title || !courseId) {
      res.status(400).json({ message: "title and courseId required" });
      return;
    }
    if (!(await findCourseById(String(courseId)))) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    const exam: ExamRecord = {
      id: randomUUID(),
      title: String(title),
      courseId: String(courseId),
      durationMinutes: Number(durationMinutes) || 60,
      questionIds: Array.isArray(questionIds) ? questionIds.map(String) : [],
      startDate: startDate || new Date().toISOString(),
      status: status || "Scheduled",
    };
    await insertExam(exam);
    res.status(201).json({ exam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateExam(req: Request, res: Response): Promise<void> {
  try {
    const exam = await findExamById(String(req.params.id));
    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }
    await updateExamFields(exam.id, {
      ...(req.body.title && { title: req.body.title }),
      ...(req.body.durationMinutes !== undefined && {
        durationMinutes: Number(req.body.durationMinutes),
      }),
      ...(req.body.questionIds && { questionIds: req.body.questionIds }),
      ...(req.body.startDate && { startDate: req.body.startDate }),
      ...(req.body.status && { status: req.body.status }),
    });
    const updated = await findExamById(exam.id);
    res.json({ exam: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteExam(req: Request, res: Response): Promise<void> {
  try {
    const ok = await deleteExamById(String(req.params.id));
    if (!ok) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function submitExam(req: Request, res: Response): Promise<void> {
  try {
    const exam = await findExamById(String(req.params.id));
    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }
    const answers: Record<string, number> = req.body?.answers || {};
    const qs = await findQuestionsByIds(exam.questionIds);
    let score = 0;
    let total = 0;
    for (const q of qs) {
      total += q.points;
      if (Number(answers[q.id]) === q.correctIndex) {
        score += q.points;
      }
    }
    const result: ResultRecord = {
      id: randomUUID(),
      userId: String(req.userId),
      examId: exam.id,
      courseId: exam.courseId,
      score,
      total,
      submittedAt: new Date().toISOString(),
    };
    await insertResult(result);
    res.status(201).json({
      result: {
        ...result,
        percent: total ? Math.round((score / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
