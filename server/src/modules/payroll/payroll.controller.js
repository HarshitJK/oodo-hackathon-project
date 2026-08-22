import * as payrollService from "./payroll.service.js";
import { auditLogger } from "../../utils/auditLogger.js";

export const getMyPayroll = async (req, res, next) => {
  try {
    const payroll = await payrollService.getMyPayroll(req.user._id);
    res.status(200).json({
      success: true,
      message: "Payroll history retrieved.",
      data: { payroll },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPayroll = async (req, res, next) => {
  try {
    const data = await payrollService.getAllPayroll(req.query);
    res.status(200).json({
      success: true,
      message: "Payroll records retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayroll = async (req, res, next) => {
  try {
    const payroll = await payrollService.updateEmployeePayroll(req.params.employeeId, req.body);

    await auditLogger({
      actorId: req.user._id,
      action: "PAYROLL_UPDATED",
      module: "PAYROLL",
      targetId: payroll._id,
      targetType: "Payroll",
      metadata: { employeeId: req.params.employeeId, netSalary: payroll.netSalary },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Payroll updated successfully.",
      data: { payroll },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};
