import { Router } from "express";
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", listCourses);
router.get("/:id", getCourse);
router.post("/", requireRoles("admin", "lecturer"), createCourse);
router.put("/:id", requireRoles("admin", "lecturer"), updateCourse);
router.delete("/:id", requireRoles("admin"), deleteCourse);
export default router;