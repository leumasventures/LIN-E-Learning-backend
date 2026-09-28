import { Router } from "express";
import { listResults } from "../controllers/result.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", listResults);
export default router;