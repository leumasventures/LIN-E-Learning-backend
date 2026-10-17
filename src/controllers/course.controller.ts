import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  deleteCourseById,
  findAllCourses,
  findCourseById,
  findCourseByIdOrCode,
  insertCourse,
  updateCourseFields,
  type CourseRecord,
} from "../data/courses.js";

export async function listCourses(_req: Request, res: Response): Promise<void> {
  try {
    const courses = await findAllCourses();
    res.json({ count: courses.length, courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getCourse(req: Request, res: Response): Promise<void> {
  try {
    const course = await findCourseByIdOrCode(String(req.params.id));
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    res.json({ course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createCourse(req: Request, res: Response): Promise<void> {
  try {
    const { code, title, lecturerName, units, duration, certification, status } =
      req.body || {};
    if (!code || !title) {
      res.status(400).json({ message: "code and title are required" });
      return;
    }
    const normalizedCode = String(code).toUpperCase();
    const existing = await findCourseByIdOrCode(normalizedCode);
    if (existing) {
      res.status(409).json({ message: "Course code already exists" });
      return;
    }
    const course: CourseRecord = {
      id: randomUUID(),
      code: normalizedCode,
      title: String(title),
      lecturerId: req.body.lecturerId || null,
      lecturerName: lecturerName || "",
      units: Number(units) || 0,
      duration: duration || "12 Weeks",
      certification: certification || "Certificate of Completion",
      status: status === "Draft" ? "Draft" : "Active",
      description: req.body.description,
    };
    await insertCourse(course);
    res.status(201).json({ course });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "ER_DUP_ENTRY") {
      res.status(409).json({ message: "Course code already exists" });
      return;
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateCourse(req: Request, res: Response): Promise<void> {
  try {
    const course = await findCourseById(String(req.params.id));
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    await updateCourseFields(course.id, {
      ...(req.body.title && { title: req.body.title }),
      ...(req.body.lecturerName !== undefined && {
        lecturerName: req.body.lecturerName,
      }),
      ...(req.body.lecturerId !== undefined && {
        lecturerId: req.body.lecturerId || null,
      }),
      ...(req.body.units !== undefined && { units: Number(req.body.units) }),
      ...(req.body.duration && { duration: req.body.duration }),
      ...(req.body.certification && { certification: req.body.certification }),
      ...(req.body.status && { status: req.body.status }),
      ...(req.body.description !== undefined && {
        description: req.body.description,
      }),
    });
    const updated = await findCourseById(course.id);
    res.json({ course: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteCourse(req: Request, res: Response): Promise<void> {
  try {
    const ok = await deleteCourseById(String(req.params.id));
    if (!ok) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
