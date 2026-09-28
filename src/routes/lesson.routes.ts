import { Router } from "express";
import {
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/lesson.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", listLessons);
router.post("/", requireRoles("admin", "lecturer"), createLesson);
router.put("/:id", requireRoles("admin", "lecturer"), updateLesson);
router.delete("/:id", requireRoles("admin", "lecturer"), deleteLesson);
export default router;