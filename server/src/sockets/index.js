/**
 * Socket.io setup module.
 *
 * Exports an `initSocket` function that attaches Socket.io to the HTTP server.
 * Also exports a `getIO` function so controllers can emit events without
 * needing to pass `io` as a parameter everywhere.
 *
 * Events emitted by the server:
 *   - "attendance:new"  — when a new attendance record is created
 *   - "leave:new"       — when a new leave request is submitted
 *
 * Rooms (optional future enhancement):
 *   - Employees can join room "dept:<departmentName>" for targeted events.
 */

const { Server } = require("socket.io");

let io;

/**
 * Initializes Socket.io on the given HTTP server.
 *
 * @param {import("http").Server} httpServer - Node HTTP server instance.
 * @returns {import("socket.io").Server} The Socket.io server instance.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // TODO: Authenticate socket connection using JWT from handshake
    // const token = socket.handshake.auth?.token;
    // if (!token) { socket.disconnect(); return; }

    // Example: allow clients to join a user-specific room
    socket.on("join:room", (roomName) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} — reason: ${reason}`);
    });
  });

  return io;
};

/**
 * Returns the initialized Socket.io instance.
 * Call initSocket() before calling getIO().
 *
 * @returns {import("socket.io").Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }
  return io;
};

module.exports = { initSocket, getIO };
