import jwt from "jsonwebtoken";

export const generateTokens = (payload) => {
  const { userId, role } = payload;

  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || "default_access_secret",
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || "default_refresh_secret");
};
