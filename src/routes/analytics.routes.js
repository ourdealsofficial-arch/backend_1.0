import { Router } from "express";
import {
  getAnalytics,
  generateDailyAnalytics,
  getDashboardSummary,
  getRevenueTrends,
  getCategorySales,
} from "../controllers/analytics.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Get analytics for date range (both roles)
router.get("/", getAnalytics);

// Generate daily analytics (both roles)
router.post("/generate", generateDailyAnalytics);

// Get dashboard summary (both roles)
router.get("/dashboard", getDashboardSummary);

// Get revenue trends (both roles)
router.get("/revenue-trends", getRevenueTrends);

// Get category-wise sales (both roles)
router.get("/category-sales", getCategorySales);

export default router;
