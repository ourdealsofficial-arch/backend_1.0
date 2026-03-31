import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "FRANCHISE_ADMIN"],
      default: "FRANCHISE_ADMIN",
    },
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ franchiseId: 1 });

const User = mongoose.model("User", userSchema);

export default User;
