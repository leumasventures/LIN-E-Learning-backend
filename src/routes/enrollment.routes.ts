import { Router } from "express";
import {
  listEnrollments,
  enroll,
  updateProgress,
} from "../controllers/enrollment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", listEnrollments);
router.post("/", enroll);
router.patch("/:id/progress", updateProgress);
export default router;