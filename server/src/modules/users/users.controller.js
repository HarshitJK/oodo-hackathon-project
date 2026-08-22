import * as usersService from "./users.service.js";
import { auditLogger } from "../../utils/auditLogger.js";

export const createEmployee = async (req, res, next) => {
  try {
    const { user, tempPassword } = await usersService.createEmployee(req.body);

    await auditLogger({
      actorId: req.user._id,
      action: "EMPLOYEE_CREATED",
      module: "USERS",
      targetId: user._id,
      targetType: "User",
      metadata: { employeeId: user.employeeId, email: user.email },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully. Login credentials sent to employee's email.",
      data: {
        employee: user,
        tempPassword,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const data = await usersService.getEmployees(req.query);
    res.status(200).json({
      success: true,
      message: "Employees fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await usersService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
        errors: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee details retrieved.",
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await usersService.updateEmployee(req.params.id, req.body);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
        errors: [],
      });
    }

    await auditLogger({
      actorId: req.user._id,
      action: "EMPLOYEE_UPDATED",
      module: "USERS",
      targetId: employee._id,
      targetType: "User",
      metadata: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

export const softDeleteEmployee = async (req, res, next) => {
  try {
    const employee = await usersService.softDeleteEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
        errors: [],
      });
    }

    await auditLogger({
      actorId: req.user._id,
      action: "EMPLOYEE_DEACTIVATED",
      module: "USERS",
      targetId: employee._id,
      targetType: "User",
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Employee deactivated successfully.",
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const employee = await usersService.getEmployeeById(req.user._id);
    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const employee = await usersService.updateOwnProfile(req.user._id, req.body, req.file);

    await auditLogger({
      actorId: req.user._id,
      action: "PROFILE_UPDATED",
      module: "USERS",
      targetId: req.user._id,
      targetType: "User",
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};
