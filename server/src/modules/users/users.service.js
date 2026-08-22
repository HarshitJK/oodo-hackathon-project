import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import Payroll from "../../models/Payroll.js";
import { generateEmployeeId } from "../../utils/generateEmployeeId.js";
import { generateLoginId } from "../../utils/generateLoginId.js";
import { generateTempPassword } from "../../utils/generateTempPassword.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { createNotification } from "../notifications/notifications.service.js";

export const createEmployee = async (data) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new Error("An employee with this email already exists.");
  }

  const joiningYear = data.joiningDate ? new Date(data.joiningDate).getFullYear() : new Date().getFullYear();
  const employeeId = await generateEmployeeId(joiningYear);
  const loginId = await generateLoginId(data.firstName, data.lastName, joiningYear);
  const tempPassword = generateTempPassword(8);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(tempPassword, salt);

  const user = await User.create({
    employeeId,
    loginId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    phone: data.phone || "",
    gender: data.gender || null,
    dob: data.dob ? new Date(data.dob) : null,
    address: data.address || "",
    department: data.department,
    designation: data.designation,
    manager: data.manager || null,
    joiningDate: new Date(data.joiningDate),
    role: data.role || "EMPLOYEE",
    status: "ACTIVE",
    passwordHash,
    passwordChanged: false,
    emailVerified: false,
  });

  const basicSalary = Number(data.basicSalary) || 0;
  const hra = Number(data.hra) || 0;
  const specialAllowance = Number(data.specialAllowance) || 0;
  const netSalary = basicSalary + hra + specialAllowance;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  await Payroll.create({
    employee: user._id,
    basicSalary,
    hra,
    specialAllowance,
    bonus: 0,
    deductions: 0,
    netSalary,
    month: currentMonth,
    year: currentYear,
  });

  await sendEmail({
    to: user.email,
    subject: "Welcome to Dayflow HRMS — Your Account Credentials",
    html: `
      <h2>Welcome to Dayflow HRMS!</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your employee account has been created with the following details:</p>
      <ul>
        <li><strong>Employee ID:</strong> ${employeeId}</li>
        <li><strong>Login ID:</strong> ${loginId}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Temporary Password:</strong> <code>${tempPassword}</code></li>
      </ul>
      <p>Please log in at <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">${process.env.CLIENT_URL || 'http://localhost:5173'}</a> and change your password immediately.</p>
    `,
  });

  await createNotification({
    recipient: user._id,
    title: "Welcome to Dayflow",
    message: `Your account ${employeeId} has been created. Please change your password on first login.`,
    type: "EMPLOYEE_CREATED",
  });

  const userObj = user.toObject();
  delete userObj.passwordHash;

  return { user: userObj, tempPassword };
};

export const getEmployees = async (query = {}) => {
  const { page = 1, limit = 20, search, department, role, status } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (role) filter.role = role;

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
      { loginId: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
    ];
  }

  const [employees, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash -refreshToken")
      .populate("manager", "firstName lastName employeeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    employees,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getEmployeeById = async (id) => {
  const user = await User.findById(id)
    .select("-passwordHash -refreshToken")
    .populate("manager", "firstName lastName employeeId email");
  return user;
};

export const updateEmployee = async (id, data) => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).select("-passwordHash -refreshToken");

  return user;
};

export const softDeleteEmployee = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { status: "INACTIVE" } },
    { new: true }
  ).select("-passwordHash -refreshToken");

  return user;
};

export const updateOwnProfile = async (userId, data, file) => {
  const allowed = {};
  if (data.phone !== undefined) allowed.phone = data.phone;
  if (data.address !== undefined) allowed.address = data.address;
  if (file) {
    allowed.profileImage = `/uploads/${file.filename}`;
  } else if (data.profileImage !== undefined) {
    allowed.profileImage = data.profileImage;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: allowed },
    { new: true, runValidators: true }
  ).select("-passwordHash -refreshToken");

  return user;
};
