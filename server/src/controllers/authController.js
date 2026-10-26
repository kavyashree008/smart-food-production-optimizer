import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

/**
 * Generate JWT for authenticated user
 */
function createToken(userId, role) {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

/**
 * Register a new user
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "staff"
    });

    const token = createToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Login user with email and password
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = createToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get current authenticated user profile
 */
export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return next(error);
  }
}
