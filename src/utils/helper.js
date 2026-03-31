import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const generateToken = (payload) => {
  const userId = payload.userId || payload._id;
  
  return jwt.sign(
    {
      userId: userId,
      email: payload.email,
      role: payload.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};


export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    console.error("Refresh token verification failed:", error.message);
    return null;
  }
};

export const generatePassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
  return Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
