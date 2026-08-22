import User from "../models/User.js";

export const generateEmployeeId = async (year = new Date().getFullYear()) => {
  const prefix = `EMP-${year}-`;
  const count = await User.countDocuments({
    employeeId: { $regex: `^EMP-${year}-` },
  });

  const nextNum = (count + 1).toString().padStart(4, "0");
  return `${prefix}${nextNum}`;
};
