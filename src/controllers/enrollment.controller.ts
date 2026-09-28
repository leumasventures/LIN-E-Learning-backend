import type { Request, Response } from "express";
import {
  courses,
  enrollments,
  lessons,
  nextId,
  type EnrollmentRecord,
} from "../data/store.js";

export function listEnrollments(req: Request, res: Response): void {
  let list = enrollments;
  if (req.userRole === "student") {
    list = list.filter((e) => e.userId === req.userId);
  } else if (req.query.userId) {
    list = list.filter((e) => e.userId === req.query.userId);
  }
  const enriched = list.map((e) => {
    const course = courses.find((c) => c.id === e.courseId);
    const totalLessons = lessons.filter((l) => l.courseId === e.courseId).length;
    return { ...e, course, totalLessons };
  });
  res.json({ count: enriched.length, enrollments: enriched });
}

export function enroll(req: Request, res: Response): void {
  const userId =
    req.userRole === "student" ? req.userId! : req.body.userId || req.userId;
  const { courseId } = req.body || {};
  if (!courseId) {
    res.status(400).json({ message: "courseId is required" });
    return;
  }
  if (!courses.find((c) => c.id === courseId)) {
    res.status(404).json({ message: "Course not found" });
    return;
  }
  if (enrollments.some((e) => e.userId === userId && e.courseId === courseId)) {
    res.status(409).json({ message: "Already enrolled" });
    return;
  }
  const record: EnrollmentRecord = {
    id: nextId("e"),
    userId: String(userId),
    courseId,
    progress: 0,
    lessonsCompleted: 0,
    enrolledAt: new Date().toISOString().slice(0, 10),
  };
  enrollments.push(record);
  res.status(201).json({ enrollment: record });
}

export function updateProgress(req: Request, res: Response): void {
  const enrollment = enrollments.find((e) => e.id === req.params.id);
  if (!enrollment) {
    res.status(404).json({ message: "Enrollment not found" });
    return;
  }
  if (req.userRole === "student" && enrollment.userId !== req.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  if (req.body.progress !== undefined) {
    enrollment.progress = Math.min(100, Math.max(0, Number(req.body.progress)));
  }
  if (req.body.lessonsCompleted !== undefined) {
    enrollment.lessonsCompleted = Number(req.body.lessonsCompleted);
  }
  res.json({ enrollment });
}