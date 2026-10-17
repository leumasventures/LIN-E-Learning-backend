import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  deleteQuestionById,
  findQuestionById,
  findQuestions,
  insertQuestion,
  updateQuestionFields,
  type QuestionRecord,
} from "../data/questions.js";

export async function listQuestions(req: Request, res: Response): Promise<void> {
  try {
    const courseId = req.query.courseId as string | undefined;
    const list = await findQuestions(courseId);
    res.json({ count: list.length, questions: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { courseId, type, text, options, correctIndex, points } = req.body || {};
    if (!courseId || !text || !Array.isArray(options)) {
      res.status(400).json({ message: "courseId, text, options required" });
      return;
    }
    const q: QuestionRecord = {
      id: randomUUID(),
      courseId: String(courseId),
      type: type === "True/False" ? "True/False" : "MCQ",
      text: String(text),
      options: options.map(String),
      correctIndex: Number(correctIndex) || 0,
      points: Number(points) || 1,
    };
    await insertQuestion(q);
    res.status(201).json({ question: q });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateQuestion(req: Request, res: Response): Promise<void> {
  try {
    const q = await findQuestionById(String(req.params.id));
    if (!q) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    await updateQuestionFields(q.id, {
      ...(req.body.text && { text: req.body.text }),
      ...(req.body.options && { options: req.body.options }),
      ...(req.body.correctIndex !== undefined && {
        correctIndex: Number(req.body.correctIndex),
      }),
      ...(req.body.points !== undefined && { points: Number(req.body.points) }),
      ...(req.body.type && { type: req.body.type }),
    });
    const updated = await findQuestionById(q.id);
    res.json({ question: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    const ok = await deleteQuestionById(String(req.params.id));
    if (!ok) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
