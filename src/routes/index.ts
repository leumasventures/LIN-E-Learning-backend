import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import courseRoutes from "./course.routes.js";
import lessonRoutes from "./lesson.routes.js";
import enrollmentRoutes from "./enrollment.routes.js";
import questionsRoutes from "./questions.routes.js";
import examRoutes from "./exam.routes.js";
import resultsRoutes from "./results.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "LIN-E-Learning-API" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/lessons", lessonRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/questions", questionsRoutes);
router.use("/exams", examRoutes);
router.use("/results", resultsRoutes);
router.use("/admin", adminRoutes);

export default router;