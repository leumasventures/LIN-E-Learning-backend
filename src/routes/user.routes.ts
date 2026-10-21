import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", requireRoles("admin"), getUsers);
router.post("/", requireRoles("admin"), createUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", requireRoles("admin"), deleteUser);

export default router;
