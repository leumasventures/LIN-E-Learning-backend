import type { Request, Response } from "express";
import { courses, exams, results, users } from "../data/store.js";

export function listResults(req: Request, res: Response): void {
  let list = results;
  if (req.userRole === "student") {
    list = list.filter((r) => r.userId === req.userId);
  } else if (req.query.userId) {
    list = list.filter((r) => r.userId === req.query.userId);
  }
  if (req.query.courseId) {
    list = list.filter((r) => r.courseId === req.query.courseId);
  }
  const enriched = list.map((r) => {
    const user = users.find((u) => u.id === r.userId);
    const exam = exams.find((e) => e.id === r.examId);
    const course = courses.find((c) => c.id === r.courseId);
    const percent = r.total ? Math.round((r.score / r.total) * 100) : 0;
    return {
      ...r,
      student: user?.name,
      matric: user?.matric,
      examTitle: exam?.title,
      courseCode: course?.code,
      percent,
    };
  });
  res.json({ count: enriched.length, results: enriched });
}