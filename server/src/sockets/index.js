import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) {
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "default_access_secret");
      socket.user = decoded;
      next();
    } catch (err) {
      next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.user?.userId) {
      socket.join(`user:${socket.user.userId}`);
      socket.join(`role:${socket.user.role}`);
    }

    socket.on("join:room", (roomName) => {
      socket.join(roomName);
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }
  return io;
};
