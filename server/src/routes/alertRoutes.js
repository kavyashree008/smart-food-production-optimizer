import { Router } from "express";
import {
  getAlerts,
  markAlertRead,
  markAllAlertsRead
} from "../controllers/alertController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", getAlerts);
router.patch("/:id/read", markAlertRead);
router.patch("/read-all", markAllAlertsRead);

export default router;