import { Router } from "express";
import {
  login,
  register,
  refresh,
  me,
  logout,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/refresh", refresh);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

export default router;