import User from "../models/user.js";
import OrderBill from "../models/Order.js";
import Food from "../models/Food.js";
import Franchise from "../models/Franchise.js";
import {
  generateToken,
  hashPassword,
  comparePassword,
} from "../utils/helper.js";
import { generateOTP, otpExpiry, sendOTPSMS } from "../utils/otp.js";
const register = async (req, res) => {
  try {
    const { name, email, password, mobileNo, role } = req.body;

    if (!name || !email || !password || !mobileNo || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashed,
      mobileNo,
      role: role || "FRANCHISE_ADMIN",
      isActive: role === "SUPER_ADMIN",
      isVerified: role === "SUPER_ADMIN",
    });

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email }).populate("franchiseId");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exist" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: "Your account is inactive. Please contact administrator to activate your account." 
      });
    }

    // Check if franchise is active (for franchise admins)
    if (user.role === "FRANCHISE_ADMIN") {
      if (!user.franchiseId) {
        return res.status(403).json({ 
          success: false, 
          message: "No franchise assigned to your account. Please contact administrator." 
        });
      }
      
      // Check if franchiseId is populated (object) or just an ID (string)
      const franchiseIsActive = typeof user.franchiseId === 'object' 
        ? user.franchiseId.isActive 
        : (await Franchise.findById(user.franchiseId))?.isActive;
      
      if (!franchiseIsActive) {
        return res.status(403).json({ 
          success: false, 
          message: "Your franchise is inactive. Please contact administrator to activate your franchise." 
        });
      }
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: "Your account is not verified. Please verify your account using OTP." 
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        mobileNo: user.mobileNo,
        franchiseId: user.franchiseId,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ success: true, message: "Logout successful" });
};

const generateOtp = async (req, res) => {
  try {
    const { mobileNo } = req.body;

    if (!mobileNo) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const user = await User.findOne({ mobileNo });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = generateOTP();
    const expiry = otpExpiry(10);

    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();

    const smsResult = await sendOTPSMS(mobileNo, otp);
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again later.",
      });
    }

    console.log(`✅ OTP for ${mobileNo} is ${otp} (valid till ${expiry})`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      expiry,
    });
  } catch (error) {
    console.error("❌ Generate OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { mobileNo, otp } = req.body;

    const user = await User.findOne({ mobileNo }).populate("franchiseId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified",
      });
    }
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      isActive: true,
      otp: null,
      otpExpiry: null,
    });

    if (user.franchiseId && user.role === "FRANCHISE_ADMIN") {
      await Franchise.findByIdAndUpdate(user.franchiseId._id, {
        isActive: true,
      });
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "OTP verified successfully. Account and franchise activated.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        franchiseId: user.franchiseId,
        franchise: user.franchiseId,
        isVerified: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const createFranchiseWithAdmin = async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      country,
      adminPassword,
    } = req.body;

    if (
      !businessName ||
      !ownerName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !country ||
      !adminPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const existingFranchise = await Franchise.findOne({ email });

    if (existingFranchise) {
      return res.status(400).json({
        success: false,
        message: "Franchise with this email already exists",
      });
    }
    const adminName = ownerName;
    const adminEmail = email;
    const adminMobile = phone;

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists with this email",
      });
    }

    const hashedPassword = await hashPassword(adminPassword);

    const franchise = await Franchise.create({
      businessName,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      country,
      createdBy: req.user?._id,
      isActive: false,
    });
    const otp = generateOTP();
    const expiry = otpExpiry(10);
    const otpResponse = await sendOTPSMS(adminMobile, otp);

    if (!otpResponse.success) {
      // Rollback franchise creation if OTP sending fails
      await Franchise.findByIdAndDelete(franchise._id);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP via AWS SNS. Franchise creation rolled back.",
      });
    }

    console.log(`✅ OTP for ${adminMobile} sent via AWS SNS (valid till ${expiry})`);

    const user = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      mobileNo: adminMobile,
      role: "FRANCHISE_ADMIN",
      franchiseId: franchise._id,
      isVerified: false,
      isActive: false,
      otp,
      otpExpiry: expiry,
    });

    res.status(201).json({
      success: true,
      message: "Franchise and Admin created successfully (inactive)",
      data: {
        franchise: {
          id: franchise._id,
          businessName: franchise.businessName,
          email: franchise.email,
          phone: franchise.phone,
          address: franchise.address,
          city: franchise.city,
          state: franchise.state,
          pincode: franchise.pincode,
          country: franchise.country,
        },
        admin: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNo: user.mobileNo,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error creating franchise and admin:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error", error });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const user = await User.findById(userId)
      .populate("franchiseId")
      .select("-password -otp -otpExpiry -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const response = {
      success: true,
      data: {
        profile: user,
      },
    };

    if (userRole === "FRANCHISE_ADMIN") {
      if (user.franchiseId) {
        const franchiseUsers = await User.find({
          franchiseId: user.franchiseId._id,
        })
          .select("name email mobileNo role isActive isVerified createdAt")
          .sort({ createdAt: -1 });
      }
    }

    if (userRole === "SUPER_ADMIN") {
      const createdFranchises = await Franchise.find({ createdBy: userId })
        .select(
          "businessName ownerName email phone city state isActive createdAt"
        )
        .sort({ createdAt: -1 });

      const franchiseIds = createdFranchises.map((f) => f._id);
      const createdUsers = await User.find({
        franchiseId: { $in: franchiseIds },
      })
        .populate("franchiseId", "businessName email")
        .select("name email mobileNo role isActive isVerified createdAt")
        .sort({ createdAt: -1 });

      response.data.createdFranchises = createdFranchises;
      response.data.createdUsers = createdUsers;
      response.data.stats = {
        totalFranchises: createdFranchises.length,
        activeFranchises: createdFranchises.filter((f) => f.isActive).length,
        totalUsers: createdUsers.length,
        activeUsers: createdUsers.filter((u) => u.isActive).length,
        verifiedUsers: createdUsers.filter((u) => u.isVerified).length,
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Get Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// Toggle franchise active status (Super Admin only)
const toggleFranchiseStatus = async (req, res) => {
  try {
    const { franchiseId } = req.params;

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise not found",
      });
    }

    franchise.isActive = !franchise.isActive;
    await franchise.save();

    // Also update all users of this franchise
    const updateResult = await User.updateMany(
      { franchiseId: franchiseId },
      { $set: { isActive: franchise.isActive } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} user(s) for franchise ${franchise.businessName}`);

    res.status(200).json({
      success: true,
      message: `Franchise ${franchise.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        franchiseId: franchise._id,
        businessName: franchise.businessName,
        isActive: franchise.isActive,
      },
    });
  } catch (error) {
    console.error("❌ Toggle Franchise Status Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to toggle franchise status",
    });
  }
};

// Get all franchises (Super Admin only)
const getAllFranchises = async (req, res) => {
  try {
    const franchises = await Franchise.find()
      .populate("createdBy", "name email")
      .select("businessName ownerName email phone city state isActive createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: franchises,
    });
  } catch (error) {
    console.error("❌ Get All Franchises Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch franchises",
    });
  }
};

// Get franchise details with dashboard data (Super Admin only)
const getFranchiseDetails = async (req, res) => {
  try {
    const { franchiseId } = req.params;

    // Get franchise info
    const franchise = await Franchise.findById(franchiseId)
      .populate("createdBy", "name email");

    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise not found",
      });
    }

    // Get franchise admin
    const franchiseAdmin = await User.findOne({ 
      franchiseId: franchiseId,
      role: "FRANCHISE_ADMIN" 
    }).select("name email mobileNo isActive isVerified createdAt");

    // Get franchise stats
    const OrderBill = (await import("../models/Order.js")).default;
    const Food = (await import("../models/Food.js")).default;

    // Get bills for this franchise
    const bills = await OrderBill.find({ generatedBy: franchiseAdmin?._id })
      .sort({ paidAt: -1 })
      .limit(10);

    // Calculate stats
    const totalBills = await OrderBill.countDocuments({ generatedBy: franchiseAdmin?._id });
    const totalRevenue = await OrderBill.aggregate([
      { $match: { generatedBy: franchiseAdmin?._id } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Get food items count
    const totalFoodItems = await Food.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        franchise,
        admin: franchiseAdmin,
        stats: {
          totalBills,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalFoodItems,
          recentBills: bills,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get Franchise Details Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch franchise details",
    });
  }
};

export {
  register,
  login,
  logout,
  generateOtp,
  verifyOTP,
  createFranchiseWithAdmin,
  getProfile,
  toggleFranchiseStatus,
  getAllFranchises,
  getFranchiseDetails,
};
