import Attendance from "../../models/Attendance.js";
import { getIO } from "../../sockets/index.js";

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const checkIn = async (employeeId, { notes = "" }) => {
  const startOfDay = getStartOfDay();
  const endOfDay = getEndOfDay();

  const existing = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existing && existing.checkIn) {
    throw new Error("You have already checked in today.");
  }

  const now = new Date();
  let status = "PRESENT";

  const record = existing || new Attendance({
    employee: employeeId,
    date: startOfDay,
  });

  record.checkIn = now;
  record.status = status;
  if (notes) record.notes = notes;
  await record.save();

  try {
    getIO().emit("attendance:update", {
      action: "CHECK_IN",
      employeeId,
      record,
    });
  } catch (e) {}

  return record;
};

export const checkOut = async (employeeId, { notes = "" }) => {
  const startOfDay = getStartOfDay();
  const endOfDay = getEndOfDay();

  const record = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (!record || !record.checkIn) {
    throw new Error("You have not checked in today. Check in first.");
  }

  if (record.checkOut) {
    throw new Error("You have already checked out today.");
  }

  const now = new Date();
  record.checkOut = now;

  const diffMs = now.getTime() - new Date(record.checkIn).getTime();
  const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  record.totalWorkingHours = diffHours;

  if (diffHours < 4) {
    record.status = "HALF_DAY";
  }

  if (notes) record.notes = notes;
  await record.save();

  try {
    getIO().emit("attendance:update", {
      action: "CHECK_OUT",
      employeeId,
      record,
    });
  } catch (e) {}

  return record;
};

export const getEmployeeAttendance = async (employeeId, query = {}) => {
  const { page = 1, limit = 30, period, startDate, endDate, status } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { employee: employeeId };
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = getStartOfDay(startDate);
    if (endDate) filter.date.$lte = getEndOfDay(endDate);
  } else if (period) {
    const now = new Date();
    if (period === "daily") {
      filter.date = { $gte: getStartOfDay(now), $lte: getEndOfDay(now) };
    } else if (period === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      filter.date = { $gte: startOfWeek, $lte: getEndOfDay(now) };
    } else if (period === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.date = { $gte: startOfMonth, $lte: getEndOfDay(now) };
    }
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  return {
    records,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getAllAttendance = async (query = {}) => {
  const { page = 1, limit = 30, employeeId, period, startDate, endDate, status } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (employeeId) filter.employee = employeeId;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = getStartOfDay(startDate);
    if (endDate) filter.date.$lte = getEndOfDay(endDate);
  } else if (period) {
    const now = new Date();
    if (period === "daily") {
      filter.date = { $gte: getStartOfDay(now), $lte: getEndOfDay(now) };
    } else if (period === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      filter.date = { $gte: startOfWeek, $lte: getEndOfDay(now) };
    } else if (period === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.date = { $gte: startOfMonth, $lte: getEndOfDay(now) };
    }
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate("employee", "firstName lastName employeeId loginId department designation")
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(filter),
  ]);

  return {
    records,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getTodayAttendanceForUser = async (employeeId) => {
  const startOfDay = getStartOfDay();
  const endOfDay = getEndOfDay();

  const record = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  return record;
};
