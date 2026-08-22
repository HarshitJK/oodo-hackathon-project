import User from "../models/User.js";

export const generateLoginId = async (firstName, lastName, joiningYear = new Date().getFullYear()) => {
  const fn = (firstName || "E").charAt(0).toUpperCase();
  const ln = (lastName || "E").charAt(0).toUpperCase();
  const yy = joiningYear.toString().slice(-2);
  const prefix = `${fn}${ln}${yy}`;

  const count = await User.countDocuments({
    loginId: { $regex: `^${prefix}` },
  });

  const nextNum = (count + 1).toString().padStart(3, "0");
  return `${prefix}${nextNum}`;
};
