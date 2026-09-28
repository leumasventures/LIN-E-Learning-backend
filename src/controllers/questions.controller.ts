import type { Request, Response } from "express";
import { nextId, questions, type QuestionRecord } from "../data/store.js";

export function listQuestions(req: Request, res: Response): void {
  let list = questions;
  if (req.query.courseId) {
    list = list.filter((q) => q.courseId === req.query.courseId);
  }
  // Students taking exams shouldn't see correctIndex in a real system —
  // strip for student role on list if needed later
  res.json({ count: list.length, questions: list });
}

export function createQuestion(req: Request, res: Response): void {
  const { courseId, type, text, options, correctIndex, points } = req.body || {};
  if (!courseId || !text || !Array.isArray(options)) {
    res.status(400).json({ message: "courseId, text, options required" });
    return;
  }
  const q: QuestionRecord = {
    id: nextId("q"),
    courseId,
    type: type === "True/False" ? "True/False" : "MCQ",
    text,
    options,
    correctIndex: Number(correctIndex) || 0,
    points: Number(points) || 1,
  };
  questions.push(q);
  res.status(201).json({ question: q });
}

export function updateQuestion(req: Request, res: Response): void {
  const q = questions.find((x) => x.id === req.params.id);
  if (!q) {
    res.status(404).json({ message: "Question not found" });
    return;
  }
  Object.assign(q, {
    ...(req.body.text && { text: req.body.text }),
    ...(req.body.options && { options: req.body.options }),
    ...(req.body.correctIndex !== undefined && {
      correctIndex: Number(req.body.correctIndex),
    }),
    ...(req.body.points !== undefined && { points: Number(req.body.points) }),
    ...(req.body.type && { type: req.body.type }),
  });
  res.json({ question: q });
}

export function deleteQuestion(req: Request, res: Response): void {
  const i = questions.findIndex((q) => q.id === req.params.id);
  if (i === -1) {
    res.status(404).json({ message: "Question not found" });
    return;
  }
  questions.splice(i, 1);
  res.json({ message: "Deleted" });
}