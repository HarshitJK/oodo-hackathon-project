import * as dashboardService from "./dashboard.service.js";

export const getEmployeeDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getEmployeeDashboard(req.user._id);
    res.status(200).json({
      success: true,
      message: "Employee dashboard data retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminDashboard();
    res.status(200).json({
      success: true,
      message: "Admin dashboard data retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
