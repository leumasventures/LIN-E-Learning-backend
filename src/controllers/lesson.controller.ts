import type { Request, Response } from "express";
import { lessons, nextId, type LessonRecord } from "../data/store.js";

export function listLessons(req: Request, res: Response): void {
  const courseId = req.query.courseId as string | undefined;
  let list = lessons;
  if (courseId) list = list.filter((l) => l.courseId === courseId);
  list = [...list].sort((a, b) => a.order - b.order);
  res.json({ count: list.length, lessons: list });
}

export function createLesson(req: Request, res: Response): void {
  const { courseId, title, duration, content, order } = req.body || {};
  if (!courseId || !title) {
    res.status(400).json({ message: "courseId and title are required" });
    return;
  }
  const lesson: LessonRecord = {
    id: nextId("l"),
    courseId,
    title,
    duration: duration || "10 min",
    order: Number(order) || lessons.filter((l) => l.courseId === courseId).length + 1,
    content: content || "",
  };
  lessons.push(lesson);
  res.status(201).json({ lesson });
}

export function updateLesson(req: Request, res: Response): void {
  const lesson = lessons.find((l) => l.id === req.params.id);
  if (!lesson) {
    res.status(404).json({ message: "Lesson not found" });
    return;
  }
  Object.assign(lesson, {
    ...(req.body.title && { title: req.body.title }),
    ...(req.body.duration && { duration: req.body.duration }),
    ...(req.body.content !== undefined && { content: req.body.content }),
    ...(req.body.order !== undefined && { order: Number(req.body.order) }),
  });
  res.json({ lesson });
}

export function deleteLesson(req: Request, res: Response): void {
  const i = lessons.findIndex((l) => l.id === req.params.id);
  if (i === -1) {
    res.status(404).json({ message: "Lesson not found" });
    return;
  }
  lessons.splice(i, 1);
  res.json({ message: "Deleted" });
}