import { Router } from "express";
import {
  createFood,
  getAllFoods,
  updateFood,
  deleteFood,
  toggleFoodAvailability,
} from "../controllers/food.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../utils/s3.js";

const router = Router();

router
  .route("/create-food")
  .post(
    authenticate,
    authorize("SUPER_ADMIN"),
    upload.single("image"),
    createFood
  );

router
  .route("/all-foods")
  .get(authenticate, authorize("SUPER_ADMIN", "FRANCHISE_ADMIN"), getAllFoods);

router
  .route("/update-food/:id")
  .put(
    authenticate,
    authorize("SUPER_ADMIN"),
    upload.single("image"),
    updateFood
  );

router
  .route("/delete-food/:id")
  .delete(authenticate, authorize("SUPER_ADMIN"), deleteFood);

router
  .route("/toggle-food-availability/:id")
  .put(
    authenticate,
    authorize("SUPER_ADMIN", "FRANCHISE_ADMIN"),
    toggleFoodAvailability
  );

export default router;

