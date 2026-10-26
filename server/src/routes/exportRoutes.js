import { Router } from "express";
import { exportPlanPdf, exportPlanExcel } from "../controllers/exportController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/plan.pdf", exportPlanPdf);
router.get("/plan.xlsx", exportPlanExcel);

export default router;