import * as leaveService from "./leave.service.js";
import { auditLogger } from "../../utils/auditLogger.js";

export const applyLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.applyLeave(req.user._id, req.body, req.file);

    await auditLogger({
      actorId: req.user._id,
      action: "LEAVE_APPLIED",
      module: "LEAVE",
      targetId: leave._id,
      targetType: "LeaveRequest",
      metadata: { leaveType: leave.leaveType, startDate: leave.startDate, endDate: leave.endDate },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully.",
      data: { leave },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const getMyLeaves = async (req, res, next) => {
  try {
    const data = await leaveService.getMyLeaves(req.user._id, req.query);
    res.status(200).json({
      success: true,
      message: "Leave records retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLeaves = async (req, res, next) => {
  try {
    const data = await leaveService.getAllLeaves(req.query);
    res.status(200).json({
      success: true,
      message: "All leave requests retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const approveLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.approveLeave(req.params.id, req.user._id);

    await auditLogger({
      actorId: req.user._id,
      action: "LEAVE_APPROVED",
      module: "LEAVE",
      targetId: leave._id,
      targetType: "LeaveRequest",
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Leave request approved successfully.",
      data: { leave },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const rejectLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.rejectLeave(req.params.id, req.user._id, req.body.comment);

    await auditLogger({
      actorId: req.user._id,
      action: "LEAVE_REJECTED",
      module: "LEAVE",
      targetId: leave._id,
      targetType: "LeaveRequest",
      metadata: { comment: req.body.comment },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Leave request rejected.",
      data: { leave },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};
