const express = require("express");
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employee.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// All employee routes require authentication
router.use(verifyToken);

// GET /api/employees — Admin/Manager only
router.get("/", requireRole("admin", "manager"), getAllEmployees);

// GET /api/employees/:id — Admin/Manager/Employee (scoped in controller)
router.get("/:id", getEmployeeById);

// PUT /api/employees/:id — Admin (full update) or self (limited fields)
router.put("/:id", updateEmployee);

// DELETE /api/employees/:id — Admin only
router.delete("/:id", requireRole("admin"), deleteEmployee);

module.exports = router;
