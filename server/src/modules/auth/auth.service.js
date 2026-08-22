import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../../models/User.js";
import { generateTokens, verifyRefreshToken } from "../../utils/generateTokens.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { createNotification } from "../notifications/notifications.service.js";

export const loginUser = async ({ identifier, password }) => {
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { loginId: identifier.toUpperCase() }],
  }).select("+passwordHash +refreshToken");

  if (!user) {
    throw new Error("Invalid credentials.");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is deactivated. Please contact HR or Administrator.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid credentials.");
  }

  const { accessToken, refreshToken } = generateTokens({
    userId: user._id.toString(),
    role: user.role,
  });

  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  user.refreshToken = hashedRefresh;
  await user.save();

  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new Error("User not found.");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error("Incorrect current password.");
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.passwordChanged = true;
  await user.save();

  await createNotification({
    recipient: user._id,
    title: "Password Changed",
    message: "Your account password was updated successfully.",
    type: "GENERAL",
  });

  return true;
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return true; // Avoid user enumeration
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await user.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Dayflow HRMS — Password Reset Request",
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.firstName},</p>
      <p>You requested a password reset. Click the button below to reset your password. This link is valid for 15 minutes.</p>
      <a href="${resetLink}" style="padding: 10px 18px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });

  await createNotification({
    recipient: user._id,
    title: "Password Reset Requested",
    message: "A password reset link was sent to your registered email.",
    type: "PASSWORD_RESET",
  });

  return true;
};

export const resetPassword = async ({ token, newPassword }) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+passwordHash +resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new Error("Invalid or expired password reset token.");
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.passwordChanged = true;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  await createNotification({
    recipient: user._id,
    title: "Password Reset Successful",
    message: "Your password has been successfully reset. You can now login with your new password.",
    type: "PASSWORD_RESET",
  });

  return true;
};

export const refreshTokens = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new Error("No refresh token provided.");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (err) {
    throw new Error("Invalid or expired refresh token.");
  }

  const user = await User.findById(decoded.userId).select("+refreshToken");
  if (!user || !user.refreshToken) {
    throw new Error("Invalid session. Please login again.");
  }

  const isTokenValid = await bcrypt.compare(incomingRefreshToken, user.refreshToken);
  if (!isTokenValid) {
    throw new Error("Invalid token reuse detected. Please login again.");
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    userId: user._id.toString(),
    role: user.role,
  });

  user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
  await user.save();

  return { accessToken, refreshToken: newRefreshToken, user };
};

export const logoutUser = async (userId) => {
  if (userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
  return true;
};
