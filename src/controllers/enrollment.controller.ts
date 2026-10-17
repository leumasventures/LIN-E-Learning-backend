import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { findCourseById } from "../data/courses.js";
import { countLessonsForCourse } from "../data/lessons.js";
import {
  findEnrollmentById,
  findEnrollmentByUserAndCourse,
  findEnrollments,
  insertEnrollment,
  updateEnrollmentProgress,
  type EnrollmentRecord,
} from "../data/enrollments.js";

export async function listEnrollments(
  req: Request,
  res: Response
): Promise<void> {
  try {
    let list =
      req.userRole === "student"
        ? await findEnrollments({ userId: req.userId })
        : req.query.userId
          ? await findEnrollments({ userId: String(req.query.userId) })
          : await findEnrollments();

    const enriched = await Promise.all(
      list.map(async (e) => {
        const course = await findCourseById(e.courseId);
        const totalLessons = await countLessonsForCourse(e.courseId);
        return { ...e, course, totalLessons };
      })
    );
    res.json({ count: enriched.length, enrollments: enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function enroll(req: Request, res: Response): Promise<void> {
  try {
    const userId =
      req.userRole === "student" ? req.userId! : req.body.userId || req.userId;
    const { courseId } = req.body || {};
    if (!courseId) {
      res.status(400).json({ message: "courseId is required" });
      return;
    }
    if (!(await findCourseById(String(courseId)))) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    const existing = await findEnrollmentByUserAndCourse(
      String(userId),
      String(courseId)
    );
    if (existing) {
      res.status(409).json({ message: "Already enrolled" });
      return;
    }
    const record: EnrollmentRecord = {
      id: randomUUID(),
      userId: String(userId),
      courseId: String(courseId),
      progress: 0,
      lessonsCompleted: 0,
      enrolledAt: new Date().toISOString().slice(0, 10),
    };
    await insertEnrollment(record);
    res.status(201).json({ enrollment: record });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "ER_DUP_ENTRY") {
      res.status(409).json({ message: "Already enrolled" });
      return;
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateProgress(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const enrollment = await findEnrollmentById(String(req.params.id));
    if (!enrollment) {
      res.status(404).json({ message: "Enrollment not found" });
      return;
    }
    if (req.userRole === "student" && enrollment.userId !== req.userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const fields: { progress?: number; lessonsCompleted?: number } = {};
    if (req.body.progress !== undefined) {
      fields.progress = Math.min(100, Math.max(0, Number(req.body.progress)));
    }
    if (req.body.lessonsCompleted !== undefined) {
      fields.lessonsCompleted = Number(req.body.lessonsCompleted);
    }
    await updateEnrollmentProgress(enrollment.id, fields);
    const updated = await findEnrollmentById(enrollment.id);
    res.json({ enrollment: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
