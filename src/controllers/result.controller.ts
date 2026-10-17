import type { Request, Response } from "express";
import { findCourseById } from "../data/courses.js";
import { findExamById, findResults } from "../data/exams.js";
import { findUserById } from "../data/users.js";

export async function listResults(req: Request, res: Response): Promise<void> {
  try {
    const filters: { userId?: string; courseId?: string } = {};
    if (req.userRole === "student") {
      filters.userId = req.userId;
    } else if (req.query.userId) {
      filters.userId = String(req.query.userId);
    }
    if (req.query.courseId) {
      filters.courseId = String(req.query.courseId);
    }
    const list = await findResults(filters);
    const enriched = await Promise.all(
      list.map(async (r) => {
        const user = await findUserById(r.userId);
        const exam = await findExamById(r.examId);
        const course = await findCourseById(r.courseId);
        const percent = r.total ? Math.round((r.score / r.total) * 100) : 0;
        return {
          ...r,
          student: user?.name,
          matric: user?.matric,
          examTitle: exam?.title,
          courseCode: course?.code,
          percent,
        };
      })
    );
    res.json({ count: enriched.length, results: enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
