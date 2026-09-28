import type { Request, Response } from "express";
import {
  courses,
  enrollments,
  exams,
  results,
  users,
} from "../data/store.js";

export function dashboard(_req: Request, res: Response): void {
  const students = users.filter((u) => u.role === "student").length;
  const lecturers = users.filter((u) => u.role === "lecturer").length;
  const activeCourses = courses.filter((c) => c.status === "Active").length;
  const activeExams = exams.filter((e) => e.status === "Active").length;
  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((s, r) => s + (r.total ? (r.score / r.total) * 100 : 0), 0) /
            results.length
        )
      : 0;
  const passRate =
    results.length > 0
      ? Math.round(
          (results.filter((r) => (r.total ? r.score / r.total : 0) >= 0.45).length /
            results.length) *
            100
        )
      : 0;

  res.json({
    stats: {
      students,
      lecturers,
      courses: courses.length,
      activeCourses,
      enrollments: enrollments.length,
      exams: exams.length,
      activeExams,
      averageScore: avgScore,
      passRate,
    },
  });
}