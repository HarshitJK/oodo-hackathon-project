# Dayflow HRMS

Dayflow is a full-stack HR management system built with React, Express, and MongoDB.

## Features

- Authentication and role-based access for employees, managers, and admins
- Employee profiles, attendance check-in/check-out, and leave requests
- Manager and HR leave approvals
- Admin dashboard with payroll, analytics, and audit logs
- Real-time attendance and leave updates through Socket.io

## Tech stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Authentication: JWT and httpOnly cookies

## Getting started

Requirements: Node.js 18+ and a MongoDB database.

1. Install all dependencies from the project root:

   ```bash
   npm install
   npm run install:all
   ```

2. Copy the environment templates and set their values:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Add your MongoDB URI and JWT secrets to `server/.env`. Set the API and Socket URLs in `client/.env`.

3. Start the app:

   ```bash
   npm run dev
   ```

The client runs at `http://localhost:5173` and the API runs at `http://localhost:5000`.

## Available commands

```bash
npm run dev          # Start client and server
npm run dev:client   # Start the client only
npm run dev:server   # Start the server only
```

## Project structure

```
client/  # React application
server/  # Express API and MongoDB models
```
