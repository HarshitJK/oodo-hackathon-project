const express = require("express");
const router = express.Router();
const {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveById,
  approveLeaveRequest,
  cancelLeaveRequest,
} = require("../controllers/leave.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { z } = require("zod");

// ── Validation Schema ───────────────────────────────────────────────────────

const createLeaveSchema = z.object({
  type: z.enum(["paid", "sick", "unpaid"]),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid startDate"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid endDate"),
  remarks: z.string().max(500).optional(),
});

// All leave routes require authentication
router.use(verifyToken);

// POST /api/leave — Create new request
router.post("/", validate(createLeaveSchema), createLeaveRequest);

// GET /api/leave — Scoped in controller
router.get("/", getLeaveRequests);

// GET /api/leave/:id
router.get("/:id", getLeaveById);

// PATCH /api/leave/:id/approve — Manager or Admin
router.patch("/:id/approve", requireRole("admin", "manager"), approveLeaveRequest);

// DELETE /api/leave/:id — Cancel own pending request
router.delete("/:id", cancelLeaveRequest);

module.exports = router;
