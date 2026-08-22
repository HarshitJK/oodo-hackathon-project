import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import Attendance from "../src/models/Attendance.js";
import LeaveRequest from "../src/models/LeaveRequest.js";
import Payroll from "../src/models/Payroll.js";
import Notification from "../src/models/Notification.js";
import AuditLog from "../src/models/AuditLog.js";

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/dayflow-hrms";
    console.log(`Connecting to MongoDB for seeding: ${mongoUri.includes("@") ? mongoUri.split("@")[1] : mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log("🧹 Cleaning old data...");
    await Promise.all([
      User.deleteMany({}),
      Attendance.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Payroll.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log("🌱 Creating initial users...");
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("Password@123", salt);

    // 1. Admin
    const admin = await User.create({
      employeeId: "EMP-2024-0001",
      loginId: "AD24001",
      firstName: "Alex",
      lastName: "Director",
      email: "admin@dayflow.com",
      phone: "+1-555-0101",
      gender: "MALE",
      dob: new Date("1985-04-12"),
      address: "100 Executive Blvd, Tech City",
      department: "Management",
      designation: "Managing Director",
      joiningDate: new Date("2024-01-01"),
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash: defaultPassword,
      passwordChanged: true,
      emailVerified: true,
    });

    // 2. HR Manager
    const hr = await User.create({
      employeeId: "EMP-2024-0002",
      loginId: "HR24002",
      firstName: "Hannah",
      lastName: "Roberts",
      email: "hr@dayflow.com",
      phone: "+1-555-0102",
      gender: "FEMALE",
      dob: new Date("1990-08-25"),
      address: "204 People Way, Tech City",
      department: "Human Resources",
      designation: "HR Manager",
      joiningDate: new Date("2024-01-15"),
      role: "HR",
      status: "ACTIVE",
      manager: admin._id,
      passwordHash: defaultPassword,
      passwordChanged: true,
      emailVerified: true,
    });

    // 3. 10 Employees
    const employeeData = [
      { fn: "David", ln: "Miller", email: "david.miller@dayflow.com", dept: "Engineering", desig: "Senior Fullstack Engineer", salary: 95000, gender: "MALE" },
      { fn: "Sarah", ln: "Jenkins", email: "sarah.jenkins@dayflow.com", dept: "Engineering", desig: "Frontend Developer", salary: 75000, gender: "FEMALE" },
      { fn: "Michael", ln: "Chang", email: "michael.chang@dayflow.com", dept: "Engineering", desig: "Backend Developer", salary: 80000, gender: "MALE" },
      { fn: "Emily", ln: "Watson", email: "emily.watson@dayflow.com", dept: "Design", desig: "Lead UI/UX Designer", salary: 85000, gender: "FEMALE" },
      { fn: "James", ln: "Wilson", email: "james.wilson@dayflow.com", dept: "Design", desig: "Product Designer", salary: 70000, gender: "MALE" },
      { fn: "Rachel", ln: "Green", email: "rachel.green@dayflow.com", dept: "Marketing", desig: "Marketing Strategist", salary: 68000, gender: "FEMALE" },
      { fn: "Daniel", ln: "Brown", email: "daniel.brown@dayflow.com", dept: "Finance", desig: "Financial Analyst", salary: 78000, gender: "MALE" },
      { fn: "Olivia", ln: "Taylor", email: "olivia.taylor@dayflow.com", dept: "Sales", desig: "Sales Lead", salary: 72000, gender: "FEMALE" },
      { fn: "Lucas", ln: "Martinez", email: "lucas.martinez@dayflow.com", dept: "Operations", desig: "Operations Coordinator", salary: 65000, gender: "MALE" },
      { fn: "Sophia", ln: "Anderson", email: "sophia.anderson@dayflow.com", dept: "Human Resources", desig: "HR Executive", salary: 60000, gender: "FEMALE" },
    ];

    const createdEmployees = [];

    for (let i = 0; i < employeeData.length; i++) {
      const emp = employeeData[i];
      const count = i + 3;
      const empId = `EMP-2024-${count.toString().padStart(4, "0")}`;
      const logId = `${emp.fn[0]}${emp.ln[0]}24${count.toString().padStart(3, "0")}`.toUpperCase();

      const newEmp = await User.create({
        employeeId: empId,
        loginId: logId,
        firstName: emp.fn,
        lastName: emp.ln,
        email: emp.email,
        phone: `+1-555-01${10 + i}`,
        gender: emp.gender,
        dob: new Date(`199${i}-0${(i % 9) + 1}-15`),
        address: `${100 + i * 10} Innovation Park, Tech City`,
        department: emp.dept,
        designation: emp.desig,
        joiningDate: new Date("2024-02-01"),
        role: "EMPLOYEE",
        status: "ACTIVE",
        manager: hr._id,
        passwordHash: defaultPassword,
        passwordChanged: false,
        emailVerified: true,
      });

      createdEmployees.push({ user: newEmp, baseSalary: emp.salary });
    }

    console.log(`✅ Created 1 Admin, 1 HR, and ${createdEmployees.length} Employees`);

    console.log("🌱 Generating attendance history (last 30 days)...");
    const allStaff = [admin, hr, ...createdEmployees.map((e) => e.user)];
    const today = new Date();

    for (const staff of allStaff) {
      for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
        const recordDate = new Date(today);
        recordDate.setDate(today.getDate() - dayOffset);
        recordDate.setHours(0, 0, 0, 0);

        // Skip weekends
        const dayOfWeek = recordDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const rand = Math.random();
        let status = "PRESENT";
        let checkIn = new Date(recordDate);
        let checkOut = new Date(recordDate);
        let totalWorkingHours = 8.5;

        if (rand > 0.95) {
          status = "ABSENT";
          checkIn = null;
          checkOut = null;
          totalWorkingHours = 0;
        } else if (rand > 0.90) {
          status = "HALF_DAY";
          checkIn.setHours(9, 30, 0, 0);
          checkOut.setHours(13, 30, 0, 0);
          totalWorkingHours = 4.0;
        } else if (rand > 0.85) {
          status = "LEAVE";
          checkIn = null;
          checkOut = null;
          totalWorkingHours = 0;
        } else {
          checkIn.setHours(9, Math.floor(Math.random() * 15), 0, 0);
          checkOut.setHours(17, 30 + Math.floor(Math.random() * 30), 0, 0);
          totalWorkingHours = 8.5;
        }

        await Attendance.create({
          employee: staff._id,
          date: recordDate,
          checkIn,
          checkOut,
          totalWorkingHours,
          status,
          notes: status === "HALF_DAY" ? "Doctor appointment" : "",
        });
      }
    }
    console.log("✅ Generated 30-day attendance records");

    console.log("🌱 Generating leave requests...");
    const leaveTypes = ["PAID", "SICK", "UNPAID"];
    for (let i = 0; i < createdEmployees.length; i++) {
      const emp = createdEmployees[i].user;
      const leaveType = leaveTypes[i % 3];

      const startDate = new Date();
      startDate.setDate(today.getDate() + (i * 2 + 1));
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);

      const status = i % 3 === 0 ? "APPROVED" : i % 3 === 1 ? "PENDING" : "REJECTED";

      await LeaveRequest.create({
        employee: emp._id,
        leaveType,
        startDate,
        endDate,
        remarks: `Personal leave application for ${leaveType.toLowerCase()} reasons.`,
        status,
        approvedBy: status !== "PENDING" ? hr._id : null,
        rejectionComment: status === "REJECTED" ? "Insufficient advance notice." : "",
        decidedAt: status !== "PENDING" ? new Date() : null,
      });
    }
    console.log("✅ Generated leave requests");

    console.log("🌱 Generating payroll records...");
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    for (const item of createdEmployees) {
      const basicSalary = Math.round(item.baseSalary / 12 * 0.6);
      const hra = Math.round(item.baseSalary / 12 * 0.25);
      const specialAllowance = Math.round(item.baseSalary / 12 * 0.15);
      const bonus = 500;
      const deductions = 300;
      const netSalary = basicSalary + hra + specialAllowance + bonus - deductions;

      await Payroll.create({
        employee: item.user._id,
        basicSalary,
        hra,
        specialAllowance,
        bonus,
        deductions,
        netSalary,
        month: currentMonth,
        year: currentYear,
      });
    }
    console.log("✅ Generated monthly payroll records");

    console.log("🌱 Generating notifications...");
    for (const item of createdEmployees) {
      await Notification.create({
        recipient: item.user._id,
        title: "Welcome to Dayflow HRMS",
        message: `Welcome aboard ${item.user.firstName}! Please make sure to review your profile.`,
        type: "EMPLOYEE_CREATED",
        isRead: false,
      });
    }
    console.log("✅ Generated notifications");

    console.log("🌱 Generating audit logs...");
    await AuditLog.create({
      actor: admin._id,
      action: "DATABASE_SEEDED",
      module: "SYSTEM",
      metadata: { totalEmployeesCreated: createdEmployees.length + 2 },
      ipAddress: "127.0.0.1",
    });
    console.log("✅ Generated audit logs");

    console.log(`
======================================================
🎉 DAYFLOW HRMS DATABASE SEED COMPLETED SUCCESSFULLY!
======================================================
Credentials for Testing:
Admin Login:
  - Email:    admin@dayflow.com
  - Login ID: AD24001
  - Password: Password@123

HR Login:
  - Email:    hr@dayflow.com
  - Login ID: HR24002
  - Password: Password@123

Employee Login:
  - Email:    david.miller@dayflow.com
  - Login ID: DM24003
  - Password: Password@123
======================================================
    `);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedDatabase();
