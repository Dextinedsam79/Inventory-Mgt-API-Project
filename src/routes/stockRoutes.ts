import { Router } from "express";
import { setInitialStockLevel } from "../controllers/stockLevelController";
import { recordStockAdjustment } from "../controllers/stockAdjustmentController";
import { initiateStockTransfer } from "../controllers/stockTransferController";
import { validateBody } from "../middlewares/validation";
import {
  initialStockLevelSchema,
  stockAdjustmentSchema,
  stockTransferSchema,
} from "../validations/schemas";

const router = Router();

// POST /api/stocklevels/initial - Set Initial Stock Level
router.post(
  "/stocklevels/initial",
  validateBody(initialStockLevelSchema),
  setInitialStockLevel
);

// POST /api/stockadjustments - Record Stock Adjustment
router.post(
  "/stockadjustments",
  validateBody(stockAdjustmentSchema),
  recordStockAdjustment
);

// POST /api/stocktransfers - Initiate Stock Transfer
router.post(
  "/stocktransfers",
  validateBody(stockTransferSchema),
  initiateStockTransfer
);

export default router;
