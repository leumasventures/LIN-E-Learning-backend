import type { Request, Response } from "express";
import { courses, nextId, type CourseRecord } from "../data/store.js";

export function listCourses(_req: Request, res: Response): void {
  res.json({ count: courses.length, courses });
}

export function getCourse(req: Request, res: Response): void {
  const course = courses.find(
    (c) => c.id === req.params.id || c.code === req.params.id
  );
  if (!course) {
    res.status(404).json({ message: "Course not found" });
    return;
  }
  res.json({ course });
}

export function createCourse(req: Request, res: Response): void {
  const { code, title, lecturerName, units, duration, certification, status } =
    req.body || {};
  if (!code || !title) {
    res.status(400).json({ message: "code and title are required" });
    return;
  }
  if (courses.some((c) => c.code === code)) {
    res.status(409).json({ message: "Course code already exists" });
    return;
  }
  const course: CourseRecord = {
    id: nextId("c"),
    code: String(code).toUpperCase(),
    title: String(title),
    lecturerId: req.body.lecturerId || null,
    lecturerName: lecturerName || "",
    units: Number(units) || 0,
    duration: duration || "12 Weeks",
    certification: certification || "Certificate of Completion",
    status: status === "Draft" ? "Draft" : "Active",
  };
  courses.push(course);
  res.status(201).json({ course });
}

export function updateCourse(req: Request, res: Response): void {
  const course = courses.find((c) => c.id === req.params.id);
  if (!course) {
    res.status(404).json({ message: "Course not found" });
    return;
  }
  Object.assign(course, {
    ...(req.body.title && { title: req.body.title }),
    ...(req.body.lecturerName !== undefined && {
      lecturerName: req.body.lecturerName,
    }),
    ...(req.body.units !== undefined && { units: Number(req.body.units) }),
    ...(req.body.duration && { duration: req.body.duration }),
    ...(req.body.certification && { certification: req.body.certification }),
    ...(req.body.status && { status: req.body.status }),
  });
  res.json({ course });
}

export function deleteCourse(req: Request, res: Response): void {
  const i = courses.findIndex((c) => c.id === req.params.id);
  if (i === -1) {
    res.status(404).json({ message: "Course not found" });
    return;
  }
  courses.splice(i, 1);
  res.json({ message: "Deleted" });
}