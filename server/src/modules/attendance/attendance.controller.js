import * as attendanceService from "./attendance.service.js";
import { auditLogger } from "../../utils/auditLogger.js";

export const checkIn = async (req, res, next) => {
  try {
    const record = await attendanceService.checkIn(req.user._id, req.body);

    await auditLogger({
      actorId: req.user._id,
      action: "ATTENDANCE_CHECK_IN",
      module: "ATTENDANCE",
      targetId: record._id,
      targetType: "Attendance",
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Checked in successfully.",
      data: { attendance: record },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const record = await attendanceService.checkOut(req.user._id, req.body);

    await auditLogger({
      actorId: req.user._id,
      action: "ATTENDANCE_CHECK_OUT",
      module: "ATTENDANCE",
      targetId: record._id,
      targetType: "Attendance",
      metadata: { totalWorkingHours: record.totalWorkingHours },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Checked out successfully.",
      data: { attendance: record },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const data = await attendanceService.getEmployeeAttendance(req.user._id, req.query);
    res.status(200).json({
      success: true,
      message: "Attendance records retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceByEmployeeId = async (req, res, next) => {
  try {
    const data = await attendanceService.getEmployeeAttendance(req.params.employeeId, req.query);
    res.status(200).json({
      success: true,
      message: "Employee attendance records retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAttendance = async (req, res, next) => {
  try {
    const data = await attendanceService.getAllAttendance(req.query);
    res.status(200).json({
      success: true,
      message: "All attendance records retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.getTodayAttendanceForUser(req.user._id);
    res.status(200).json({
      success: true,
      message: "Today's attendance status retrieved.",
      data: { attendance: record || null },
    });
  } catch (error) {
    next(error);
  }
};

import { createAttendanceQRToken } from "../../utils/createAttendanceQR.js";

export const generateQR = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const token = createAttendanceQRToken(today);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    res.status(200).json({
      success: true,
      token,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

export const checkInQR = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required.",
      });
    }

    const employeeName = req.user.fullName || req.user.firstName;
    const record = await attendanceService.checkInQR(req.user._id, token, employeeName);

    await auditLogger({
      actorId: req.user._id,
      action: "ATTENDANCE_CHECK_IN_QR",
      module: "ATTENDANCE",
      targetId: record._id,
      targetType: "Attendance",
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Check-in successful",
      data: { attendance: record },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};
