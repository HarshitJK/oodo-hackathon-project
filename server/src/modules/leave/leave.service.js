import LeaveRequest from "../../models/LeaveRequest.js";
import { getIO } from "../../sockets/index.js";
import { createNotification } from "../notifications/notifications.service.js";

export const applyLeave = async (employeeId, data, file) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (end < start) {
    throw new Error("End date cannot be earlier than start date.");
  }

  let attachment = data.attachment || "";
  if (file) {
    attachment = `/uploads/${file.filename}`;
  }

  const leave = await LeaveRequest.create({
    employee: employeeId,
    leaveType: data.leaveType,
    startDate: start,
    endDate: end,
    remarks: data.remarks || "",
    attachment,
    status: "PENDING",
  });

  try {
    getIO().emit("leave:new", {
      action: "APPLY_LEAVE",
      employeeId,
      leave,
    });
  } catch (e) {}

  return leave;
};

export const getMyLeaves = async (employeeId, query = {}) => {
  const { page = 1, limit = 20, status } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { employee: employeeId };
  if (status) filter.status = status;

  const [leaves, total] = await Promise.all([
    LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LeaveRequest.countDocuments(filter),
  ]);

  return {
    leaves,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getAllLeaves = async (query = {}) => {
  const { page = 1, limit = 20, status, leaveType, employeeId } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (status) filter.status = status;
  if (leaveType) filter.leaveType = leaveType;
  if (employeeId) filter.employee = employeeId;

  const [leaves, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate("employee", "firstName lastName employeeId loginId department designation email")
      .populate("approvedBy", "firstName lastName employeeId role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LeaveRequest.countDocuments(filter),
  ]);

  return {
    leaves,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const approveLeave = async (leaveId, approverId) => {
  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) {
    throw new Error("Leave request not found.");
  }

  if (leave.status !== "PENDING") {
    throw new Error(`Leave request is already ${leave.status.toLowerCase()}.`);
  }

  leave.status = "APPROVED";
  leave.approvedBy = approverId;
  leave.decidedAt = new Date();
  await leave.save();

  await createNotification({
    recipient: leave.employee,
    title: "Leave Approved",
    message: `Your ${leave.leaveType} leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been approved.`,
    type: "LEAVE_APPROVED",
  });

  try {
    getIO().emit("leave:update", {
      action: "LEAVE_APPROVED",
      leaveId,
      leave,
    });
  } catch (e) {}

  return leave;
};

export const rejectLeave = async (leaveId, approverId, comment) => {
  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) {
    throw new Error("Leave request not found.");
  }

  if (leave.status !== "PENDING") {
    throw new Error(`Leave request is already ${leave.status.toLowerCase()}.`);
  }

  leave.status = "REJECTED";
  leave.approvedBy = approverId;
  leave.rejectionComment = comment;
  leave.decidedAt = new Date();
  await leave.save();

  await createNotification({
    recipient: leave.employee,
    title: "Leave Rejected",
    message: `Your ${leave.leaveType} leave request was rejected. Reason: ${comment}`,
    type: "LEAVE_REJECTED",
  });

  try {
    getIO().emit("leave:update", {
      action: "LEAVE_REJECTED",
      leaveId,
      leave,
    });
  } catch (e) {}

  return leave;
};
