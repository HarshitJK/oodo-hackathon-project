const User = require("../models/User");
const { auditLogger } = require("../utils/auditLogger");

// ─────────────────────────────────────────────
// GET /api/employees
// Admin/Manager: list all employees
// Employee: 403 (handled by requireRole middleware)
// ─────────────────────────────────────────────
const getAllEmployees = async (req, res, next) => {
  try {
    // TODO: Add pagination (page, limit query params)
    // TODO: Add search/filter by department, role, name
    const { page = 1, limit = 20, department, role, search } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await User.find(filter)
      .select("-passwordHash -refreshToken")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/employees/:id
// Admin/Manager: any employee. Employee: only self.
// ─────────────────────────────────────────────
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Scope: employees can only view themselves
    if (req.user.role === "employee" && req.user._id.toString() !== id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const employee = await User.findById(id).select("-passwordHash -refreshToken");
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    res.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PUT /api/employees/:id
// Admin: update any employee. Employee: update own profile (limited fields).
// ─────────────────────────────────────────────
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Scope check
    if (req.user.role === "employee" && req.user._id.toString() !== id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Fields employees can update on their own profile
    const allowedSelfUpdate = ["name", "phone", "address", "profilePictureUrl"];
    // Fields only admins can update
    const adminOnlyFields = ["role", "department", "jobTitle", "salary", "employeeId", "isEmailVerified"];

    let updatePayload = {};

    if (req.user.role === "admin") {
      // Admin can update everything (except passwordHash directly)
      const { passwordHash, refreshToken, ...rest } = req.body;
      updatePayload = rest;
    } else {
      // Non-admin: filter to allowed fields only
      allowedSelfUpdate.forEach((field) => {
        if (req.body[field] !== undefined) updatePayload[field] = req.body[field];
      });
    }

    // TODO: Implement full update logic with conflict checks
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).select("-passwordHash -refreshToken");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    await auditLogger({
      actorId: req.user._id,
      action: "EMPLOYEE_UPDATED",
      targetId: updated._id,
      targetType: "User",
      metadata: { updatedFields: Object.keys(updatePayload) },
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, data: { employee: updated } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/employees/:id
// Admin only (enforced by requireRole in routes)
// ─────────────────────────────────────────────
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // TODO: Soft-delete pattern (set isActive: false) rather than hard delete
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    await auditLogger({
      actorId: req.user._id,
      action: "EMPLOYEE_DELETED",
      targetId: deleted._id,
      targetType: "User",
      metadata: { email: deleted.email, employeeId: deleted.employeeId },
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: "Employee deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee };
