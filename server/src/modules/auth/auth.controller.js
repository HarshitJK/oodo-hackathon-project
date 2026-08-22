import * as authService from "./auth.service.js";
import { auditLogger } from "../../utils/auditLogger.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

    res.cookie("refreshToken", refreshToken, cookieOptions);

    await auditLogger({
      actorId: user._id,
      action: "USER_LOGIN",
      module: "AUTH",
      targetId: user._id,
      targetType: "User",
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken,
        user,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user._id, req.body);

    await auditLogger({
      actorId: req.user._id,
      action: "PASSWORD_CHANGED",
      module: "AUTH",
      targetId: req.user._id,
      targetType: "User",
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);

    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login.",
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken, refreshToken, user } = await authService.refreshTokens(token);

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: {
        accessToken,
        user: {
          id: user._id,
          employeeId: user.employeeId,
          loginId: user.loginId,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    await authService.logoutUser(userId);

    res.clearCookie("refreshToken", cookieOptions);

    if (userId) {
      await auditLogger({
        actorId: userId,
        action: "USER_LOGOUT",
        module: "AUTH",
        targetId: userId,
        targetType: "User",
        ipAddress: req.ip,
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Current user profile retrieved.",
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};
