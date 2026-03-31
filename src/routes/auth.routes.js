import { Router } from "express";
import { register,login,logout, generateOtp, verifyOTP, createFranchiseWithAdmin, getProfile, toggleFranchiseStatus, getAllFranchises, getFranchiseDetails } from "../controllers/auth.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/admin/ncb/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/generate-otp").post(generateOtp);
router.route("/verify-otp").post(verifyOTP);

router.route("/create-franchise-user").post(authenticate, authorize("SUPER_ADMIN"), createFranchiseWithAdmin);

router.route("/profile").get(authenticate, getProfile);

// Franchise management routes (Super Admin only)
router.route("/franchises").get(authenticate, authorize("SUPER_ADMIN"), getAllFranchises);
router.route("/franchise/:franchiseId/toggle-status").put(authenticate, authorize("SUPER_ADMIN"), toggleFranchiseStatus);
router.route("/franchise/:franchiseId/details").get(authenticate, authorize("SUPER_ADMIN"), getFranchiseDetails);

export default router;