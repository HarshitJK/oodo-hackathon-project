# 🚀 Dayflow HRMS

> A full-stack HR Management System built with the MERN stack.  
> **MongoDB · Express · React (Vite + TypeScript) · Node.js**

---

## ✨ Features

| Module | Description |
|---|---|
| **Auth** | JWT (access + refresh), bcrypt, httpOnly cookie, email verify stub |
| **RBAC** | Role-based route guards — `employee`, `manager`, `admin` |
| **Attendance** | Daily check-in/out, status tracking, admin corrections |
| **Leave** | Request submission, 2-step manager→HR approval chain |
| **Payroll** | Salary data display (calculation TODO) |
| **Analytics** | Recharts — Attendance trend line + Leave breakdown pie |
| **Real-time** | Socket.io — live attendance/leave events without polling |
| **Audit Log** | Every state-changing action is logged with actor + metadata |

---

## 🗂️ Project Structure

```
/dayflow-hrms
  /client          — React + Vite + TypeScript + Tailwind + Recharts
  /server          — Node + Express + MongoDB/Mongoose + Socket.io
  package.json     — Root: runs both via concurrently
  .gitignore
  README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone the repo
```bash
git clone https://github.com/<your-org>/dayflow-hrms.git
cd dayflow-hrms
```

### 2. Set up the server
```bash
cd server
npm install
cp .env.example .env
# Edit .env — fill in MONGO_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

### 3. Set up the client
```bash
cd ../client
npm install
cp .env.example .env
# Edit .env — set VITE_API_URL and VITE_SOCKET_URL
```

### 4. Run both concurrently (from repo root)
```bash
cd ..
npm install          # installs concurrently at root
npm run dev          # starts both server (port 5000) and client (port 5173)
```

Or run individually:
```bash
npm run dev:server   # server only
npm run dev:client   # client only
```

### 5. Verify it's working
- **Server health**: http://localhost:5000/api/health
- **Client**: http://localhost:5173

---

## 🔐 Default Auth Flow

1. `POST /api/auth/signup` — create an account  
2. Open the server console — copy the `/verify-email` link (dev mode)  
3. `POST /api/auth/login` — get access token + refresh cookie  
4. All protected routes require `Authorization: Bearer <accessToken>`  
5. On 401 `TOKEN_EXPIRED`, client interceptor calls `/api/auth/refresh` automatically  

> **First admin account**: Manually set `role: "admin"` in MongoDB Compass after signup.

---

## 🌐 API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get tokens |
| POST | `/api/auth/refresh` | Cookie | Rotate access token |
| POST | `/api/auth/logout` | — | Clear cookie |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/employees` | Admin/Manager | List employees |
| PUT | `/api/employees/:id` | Scoped | Update profile |
| POST | `/api/attendance/check-in` | ✅ | Daily check-in |
| POST | `/api/attendance/check-out` | ✅ | Daily check-out |
| GET | `/api/attendance` | Scoped | List records |
| POST | `/api/leave` | ✅ | Submit leave request |
| PATCH | `/api/leave/:id/approve` | Admin/Manager | Approve/Reject |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/analytics/attendance` | Admin | Chart data |
| GET | `/api/admin/analytics/leave` | Admin | Pie chart data |
| GET | `/api/admin/payroll` | Admin | Payroll listing |

---

## 🔌 Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| `attendance:new` | Server → Client | `{ type, userId, record }` |
| `leave:new` | Server → Client | `{ userId, leaveRequest }` |
| `join:room` | Client → Server | `roomName` (string) |

---

## 👥 Team Workflow

> We are two contributors splitting work cleanly via Git.

### Branch strategy
- `main` — production-ready code. **No direct pushes.**
- `feat/<name>` — feature branches, one per task
- PR into `main` from your branch

### Work split (suggested)
| Person A | Person B |
|---|---|
| `/server` — Auth, Attendance, Leave controllers | `/client` — Pages, Components, UX polish |
| Socket.io real-time events | Recharts analytics |
| RBAC middleware + Zod schemas | Zod client validation + form handling |
| MongoDB indexes & audit logging | Payroll calculation logic |

### Commands
```bash
git checkout -b feat/your-feature
# ... work ...
git add .
git commit -m "feat: describe your change"
git push origin feat/your-feature
# Then open a Pull Request on GitHub for review
```

---

## 📦 Tech Stack

### Server
| Package | Purpose |
|---|---|
| `express` | HTTP framework |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT access + refresh tokens |
| `zod` | Schema validation |
| `socket.io` | Real-time events |
| `helmet` | Security headers |
| `cors` | Cross-origin requests |
| `express-rate-limit` | Auth route rate limiting |

### Client
| Package | Purpose |
|---|---|
| `react` + `vite` + `typescript` | Frontend framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client with interceptors |
| `socket.io-client` | Real-time event subscription |
| `zod` | Client-side form validation |
| `recharts` | Attendance + Leave charts |
| `lucide-react` | Icon library |
| `tailwindcss` | Utility-first CSS |

---

## 📝 TODO (post-hackathon)

- [ ] Real email verification (SendGrid / Nodemailer)
- [ ] Leave balance tracking per employee
- [ ] Payroll deduction calculation (absences, unpaid leaves)
- [ ] PDF payslip export
- [ ] Department-scoped Socket.io rooms
- [ ] Socket.io JWT authentication on handshake
- [ ] Refresh token rotation with DB storage
- [ ] Unit tests (Jest + Supertest for server, Vitest for client)
- [ ] Docker Compose for local dev environment
- [ ] CI/CD pipeline (GitHub Actions)
