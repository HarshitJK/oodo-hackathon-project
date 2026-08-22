import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./sockets/index.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

initSocket(httpServer);

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`
🚀 Dayflow HRMS Server
   ├── HTTP:      http://localhost:${PORT}
   ├── Health:    http://localhost:${PORT}/api/health
   ├── Socket.io: ws://localhost:${PORT}
   └── Env:       ${process.env.NODE_ENV || "development"}
    `);
  });
};

startServer();
