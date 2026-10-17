import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  countLessonsForCourse,
  deleteLessonById,
  findLessonById,
  findLessons,
  insertLesson,
  updateLessonFields,
  type LessonRecord,
} from "../data/lessons.js";
import { findCourseById } from "../data/courses.js";

export async function listLessons(req: Request, res: Response): Promise<void> {
  try {
    const courseId = req.query.courseId as string | undefined;
    const list = await findLessons(courseId);
    res.json({ count: list.length, lessons: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createLesson(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, title, duration, content, order } = req.body || {};
    if (!courseId || !title) {
      res.status(400).json({ message: "courseId and title are required" });
      return;
    }
    const course = await findCourseById(String(courseId));
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    const nextOrder =
      order !== undefined
        ? Number(order)
        : (await countLessonsForCourse(String(courseId))) + 1;
    const lesson: LessonRecord = {
      id: randomUUID(),
      courseId: String(courseId),
      title: String(title),
      duration: duration || "10 min",
      order: nextOrder,
      content: content || "",
    };
    await insertLesson(lesson);
    res.status(201).json({ lesson });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateLesson(req: Request, res: Response): Promise<void> {
  try {
    const lesson = await findLessonById(String(req.params.id));
    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }
    await updateLessonFields(lesson.id, {
      ...(req.body.title && { title: req.body.title }),
      ...(req.body.duration && { duration: req.body.duration }),
      ...(req.body.content !== undefined && { content: req.body.content }),
      ...(req.body.order !== undefined && { order: Number(req.body.order) }),
    });
    const updated = await findLessonById(lesson.id);
    res.json({ lesson: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteLesson(req: Request, res: Response): Promise<void> {
  try {
    const ok = await deleteLessonById(String(req.params.id));
    if (!ok) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
