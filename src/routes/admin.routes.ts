import { Router } from "express";
import { dashboard } from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate, requireRoles("admin", "lecturer"));
router.get("/dashboard", dashboard);
export default router;