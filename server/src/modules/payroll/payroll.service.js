import Payroll from "../../models/Payroll.js";
import User from "../../models/User.js";

export const getMyPayroll = async (userId) => {
  const records = await Payroll.find({ employee: userId }).sort({ year: -1, month: -1 });
  return records;
};

export const getAllPayroll = async (query = {}) => {
  const { page = 1, limit = 20, month, year, department, employeeId } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (employeeId) filter.employee = employeeId;

  const [records, total] = await Promise.all([
    Payroll.find(filter)
      .populate("employee", "firstName lastName employeeId loginId department designation")
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payroll.countDocuments(filter),
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

export const updateEmployeePayroll = async (employeeId, data) => {
  const user = await User.findById(employeeId);
  if (!user) {
    throw new Error("Employee not found.");
  }

  const month = data.month || new Date().getMonth() + 1;
  const year = data.year || new Date().getFullYear();

  let payroll = await Payroll.findOne({ employee: employeeId, month, year });

  const basicSalary = data.basicSalary !== undefined ? Number(data.basicSalary) : payroll?.basicSalary || 0;
  const hra = data.hra !== undefined ? Number(data.hra) : payroll?.hra || 0;
  const specialAllowance = data.specialAllowance !== undefined ? Number(data.specialAllowance) : payroll?.specialAllowance || 0;
  const bonus = data.bonus !== undefined ? Number(data.bonus) : payroll?.bonus || 0;
  const deductions = data.deductions !== undefined ? Number(data.deductions) : payroll?.deductions || 0;
  const netSalary = basicSalary + hra + specialAllowance + bonus - deductions;

  payroll = await Payroll.findOneAndUpdate(
    { employee: employeeId, month, year },
    {
      $set: {
        basicSalary,
        hra,
        specialAllowance,
        bonus,
        deductions,
        netSalary,
        month,
        year,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return payroll;
};
