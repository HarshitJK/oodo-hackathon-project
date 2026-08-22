/**
 * Role-Based Access Control (RBAC) middleware factory.
 *
 * Usage:
 *   router.get("/admin-only", verifyToken, requireRole("admin"), handler);
 *   router.get("/managers-and-admins", verifyToken, requireRole("admin", "manager"), handler);
 *
 * Must be used AFTER verifyToken middleware (requires req.user to be populated).
 *
 * @param {...string} allowedRoles - Roles that are permitted to access the route.
 * @returns Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthenticated. Please log in.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
