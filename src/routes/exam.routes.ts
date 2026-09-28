import { Router } from "express";
import {
  listExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  submitExam,
} from "../controllers/exam.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", listExams);
router.get("/:id", getExam);
router.post("/", requireRoles("admin", "lecturer"), createExam);
router.put("/:id", requireRoles("admin", "lecturer"), updateExam);
router.delete("/:id", requireRoles("admin"), deleteExam);
router.post("/:id/submit", requireRoles("student"), submitExam);
export default router;