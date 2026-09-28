import { Router } from "express";
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questions.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", requireRoles("admin", "lecturer"), listQuestions);
router.post("/", requireRoles("admin", "lecturer"), createQuestion);
router.put("/:id", requireRoles("admin", "lecturer"), updateQuestion);
router.delete("/:id", requireRoles("admin", "lecturer"), deleteQuestion);
export default router;