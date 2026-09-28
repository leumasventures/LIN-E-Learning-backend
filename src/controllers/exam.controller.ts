import type { Request, Response } from "express";
import {
  courses,
  exams,
  nextId,
  questions,
  results,
  type ExamRecord,
  type ResultRecord,
} from "../data/store.js";

export function listExams(req: Request, res: Response): void {
  let list = exams;
  if (req.query.courseId) {
    list = list.filter((e) => e.courseId === req.query.courseId);
  }
  const enriched = list.map((e) => {
    const course = courses.find((c) => c.id === e.courseId);
    return {
      ...e,
      courseCode: course?.code,
      questionCount: e.questionIds.length,
    };
  });
  res.json({ count: enriched.length, exams: enriched });
}

export function getExam(req: Request, res: Response): void {
  const exam = exams.find((e) => e.id === req.params.id);
  if (!exam) {
    res.status(404).json({ message: "Exam not found" });
    return;
  }
  const qs = questions
    .filter((q) => exam.questionIds.includes(q.id))
    .map((q) => {
      if (req.userRole === "student") {
        const { correctIndex: _, ...safe } = q;
        return safe;
      }
      return q;
    });
  res.json({ exam, questions: qs });
}

export function createExam(req: Request, res: Response): void {
  const { title, courseId, durationMinutes, questionIds, startDate, status } =
    req.body || {};
  if (!title || !courseId) {
    res.status(400).json({ message: "title and courseId required" });
    return;
  }
  const exam: ExamRecord = {
    id: nextId("x"),
    title,
    courseId,
    durationMinutes: Number(durationMinutes) || 60,
    questionIds: Array.isArray(questionIds) ? questionIds : [],
    startDate: startDate || new Date().toISOString(),
    status: status || "Scheduled",
  };
  exams.push(exam);
  res.status(201).json({ exam });
}

export function updateExam(req: Request, res: Response): void {
  const exam = exams.find((e) => e.id === req.params.id);
  if (!exam) {
    res.status(404).json({ message: "Exam not found" });
    return;
  }
  Object.assign(exam, {
    ...(req.body.title && { title: req.body.title }),
    ...(req.body.durationMinutes !== undefined && {
      durationMinutes: Number(req.body.durationMinutes),
    }),
    ...(req.body.questionIds && { questionIds: req.body.questionIds }),
    ...(req.body.startDate && { startDate: req.body.startDate }),
    ...(req.body.status && { status: req.body.status }),
  });
  res.json({ exam });
}

export function deleteExam(req: Request, res: Response): void {
  const i = exams.findIndex((e) => e.id === req.params.id);
  if (i === -1) {
    res.status(404).json({ message: "Exam not found" });
    return;
  }
  exams.splice(i, 1);
  res.json({ message: "Deleted" });
}

/** Student submits answers: { answers: { [questionId]: selectedIndex } } */
export function submitExam(req: Request, res: Response): void {
  const exam = exams.find((e) => e.id === req.params.id);
  if (!exam) {
    res.status(404).json({ message: "Exam not found" });
    return;
  }
  if (exam.status === "Closed") {
    res.status(400).json({ message: "Exam is closed" });
    return;
  }
  const answers = (req.body?.answers || {}) as Record<string, number>;
  let score = 0;
  let total = 0;
  for (const qid of exam.questionIds) {
    const q = questions.find((x) => x.id === qid);
    if (!q) continue;
    total += q.points;
    if (Number(answers[qid]) === q.correctIndex) score += q.points;
  }
  const result: ResultRecord = {
    id: nextId("r"),
    userId: req.userId!,
    examId: exam.id,
    courseId: exam.courseId,
    score,
    total: total || 100,
    submittedAt: new Date().toISOString(),
  };
  results.push(result);
  res.status(201).json({ result, percent: total ? Math.round((score / total) * 100) : 0 });
}