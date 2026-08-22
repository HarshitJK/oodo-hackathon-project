const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateTokens, verifyRefreshToken } = require("../utils/generateTokens");
const { auditLogger } = require("../utils/auditLogger");

// ─────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { name, email, password, employeeId, department, jobTitle, phone } = req.body;

    // Check for existing user
    const existing = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email or employee ID already exists.",
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user (role defaults to "employee" per schema)
    const user = await User.create({
      name,
      email,
      employeeId,
      passwordHash,
      department: department || "",
      jobTitle: jobTitle || "",
      phone: phone || "",
    });

    await auditLogger({
      actorId: user._id,
      action: "USER_SIGNED_UP",
      targetId: user._id,
      targetType: "User",
      metadata: { email, employeeId },
      ipAddress: req.ip,
    });

    // TODO: Send email verification link (see /verify-email stub below)
    // For now, log the verification link to console
    console.log(`📧 [DEV] Verify email link: http://localhost:5000/api/auth/verify-email?token=FAKE_TOKEN&userId=${user._id}`);

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      data: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Include passwordHash (select: false by default)
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      role: user.role,
    });

    // Store refresh token hash in DB (optional security hardening)
    // const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    // await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    await auditLogger({
      actorId: user._id,
      action: "USER_LOGGED_IN",
      targetId: user._id,
      targetType: "User",
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken,
        user: {
          id: user._id,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          jobTitle: user.jobTitle,
          profilePictureUrl: user.profilePictureUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token found." });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user._id.toString(),
      role: user.role,
    });

    // Rotate refresh token
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Clear the httpOnly refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // TODO: If storing refresh token hash in DB, clear it here:
    // if (req.user) await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/verify-email?token=&userId=
// STUB: In production, send a real email with a signed token
// ─────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    // TODO: Verify the token is valid (e.g., signed JWT with userId + expiry)
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId parameter." });
    }

    // TODO: Replace with real token validation logic
    await User.findByIdAndUpdate(userId, { isEmailVerified: true });

    res.status(200).json({
      success: true,
      message: "Email verified successfully. [STUB — implement real token validation]",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/me  (requires verifyToken middleware)
// ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is already populated by verifyToken middleware
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, refresh, logout, verifyEmail, getMe };
