const LeaveRequest = require("../models/LeaveRequest");
const { getIO } = require("../sockets");
const { auditLogger } = require("../utils/auditLogger");

// ─────────────────────────────────────────────
// POST /api/leave
// Employee submits a leave request
// ─────────────────────────────────────────────
const createLeaveRequest = async (req, res, next) => {
  try {
    const { type, startDate, endDate, remarks } = req.body;

    // TODO: Check leave balance before allowing submission
    // TODO: Prevent overlapping leave requests for the same date range
    // TODO: Auto-populate approverChain based on user's department manager

    const leaveRequest = await LeaveRequest.create({
      userId: req.user._id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      remarks,
      status: "pending",
      approverChain: [
        // Step 1: Manager approval (manager _id to be populated when assigned)
        { role: "manager", decision: "pending" },
        // Step 2: HR/Admin approval
        { role: "admin", decision: "pending" },
      ],
    });

    // Emit real-time event
    try {
      getIO().emit("leave:new", {
        userId: req.user._id.toString(),
        leaveRequest,
      });
    } catch {}

    await auditLogger({
      actorId: req.user._id,
      action: "LEAVE_REQUEST_CREATED",
      targetId: leaveRequest._id,
      targetType: "LeaveRequest",
      metadata: { type, startDate, endDate },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully.",
      data: { leaveRequest },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/leave
// Employee: own requests. Admin/Manager: all requests.
// Query: ?status=&userId=&page=&limit=
// ─────────────────────────────────────────────
const getLeaveRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let { userId } = req.query;

    if (req.user.role === "employee") {
      userId = req.user._id.toString();
    }

    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const requests = await LeaveRequest.find(filter)
      .populate("userId", "name employeeId department")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await LeaveRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/leave/:id
// ─────────────────────────────────────────────
const getLeaveById = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findById(req.params.id)
      .populate("userId", "name employeeId department");

    if (!request) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    // Scope: employee can only view their own
    if (req.user.role === "employee" && request.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.status(200).json({ success: true, data: { request } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/leave/:id/approve
// Manager/Admin approves or rejects a leave request
// Body: { decision: "approved" | "rejected", comment: "" }
// ─────────────────────────────────────────────
const approveLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, comment } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'approved' or 'rejected'." });
    }

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "This leave request has already been decided." });
    }

    // TODO: Implement 2-step chain logic:
    // Find the first approverChain entry matching req.user.role that is still "pending",
    // update it, then check if all steps are done to set overall status.

    // STUB: Simplified single-step approval
    const approverRole = req.user.role; // "manager" or "admin"
    const chainEntry = request.approverChain.find(
      (a) => a.role === approverRole && a.decision === "pending"
    );

    if (!chainEntry) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to make a decision on this request at this stage.",
      });
    }

    chainEntry.approverId = req.user._id;
    chainEntry.decision = decision;
    chainEntry.comment = comment || "";
    chainEntry.decidedAt = new Date();

    // Check if all chain steps are resolved
    const allResolved = request.approverChain.every((a) => a.decision !== "pending");
    const anyRejected = request.approverChain.some((a) => a.decision === "rejected");

    if (allResolved) {
      request.status = anyRejected ? "rejected" : "approved";
      request.approverComments = comment || "";
    }

    await request.save();

    await auditLogger({
      actorId: req.user._id,
      action: `LEAVE_${decision.toUpperCase()}`,
      targetId: request._id,
      targetType: "LeaveRequest",
      metadata: { decision, comment },
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: `Leave request ${decision}.`, data: { request } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/leave/:id
// Employee: cancel own pending request only
// ─────────────────────────────────────────────
const cancelLeaveRequest = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    if (request.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be cancelled.",
      });
    }

    await request.deleteOne();

    await auditLogger({
      actorId: req.user._id,
      action: "LEAVE_REQUEST_CANCELLED",
      targetId: request._id,
      targetType: "LeaveRequest",
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: "Leave request cancelled." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveById,
  approveLeaveRequest,
  cancelLeaveRequest,
};
