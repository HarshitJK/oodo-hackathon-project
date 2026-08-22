import jwt from "jsonwebtoken";

export const createAttendanceQRToken = (date) => {
  const payload = {
    office: "DAYFLOW_HQ",
    type: "ATTENDANCE",
    date: date,
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || "default_access_secret",
    { expiresIn: "5m" }
  );

  return token;
};

export const verifyAttendanceQRToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || "default_access_secret");
};
