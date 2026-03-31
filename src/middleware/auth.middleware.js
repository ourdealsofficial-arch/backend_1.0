import jwt from "jsonwebtoken";
import User from "../models/user.js";


export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token)
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const user = await User.findById(decoded.userId).select(
      "_id email name role franchiseId isActive isVerified"
    );

    if (!user)
      return res.status(401).json({
        success: false,
        message: "User not found or deleted.",
      });

    if (!user.isActive)
      return res.status(403).json({
        success: false,
        message: "User account is inactive. Contact admin.",
      });

    req.user = {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      franchiseId: user.franchiseId,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };

    next();
  } catch (error) {
    console.error("❌ Auth Error:", error.message);
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Session expired. Please log in again."
          : "Invalid authentication token.",
    });
  }
};



export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions",
      });
    }
    next();
  };
};
