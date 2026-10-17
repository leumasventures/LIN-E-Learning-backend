import type { Request, Response } from "express";
import { countCourses } from "../data/courses.js";
import { countEnrollments } from "../data/enrollments.js";
import { countExams, getResultStats } from "../data/exams.js";
import { countUsersByRole } from "../data/users.js";

export async function dashboard(_req: Request, res: Response): Promise<void> {
  try {
    const [students, lecturers, courses, activeCourses, enrollments, exams, activeExams, stats] =
      await Promise.all([
        countUsersByRole("student"),
        countUsersByRole("lecturer"),
        countCourses(),
        countCourses("Active"),
        countEnrollments(),
        countExams(),
        countExams("Active"),
        getResultStats(),
      ]);

    res.json({
      stats: {
        students,
        lecturers,
        courses,
        activeCourses,
        enrollments,
        exams,
        activeExams,
        averageScore: stats.averageScore,
        passRate: stats.passRate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
