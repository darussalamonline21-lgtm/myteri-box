# 📚 MASTER TECHNICAL DOCUMENTATION

**Project**: Mystery Box Campaign Application  
**Version**: 1.0  
**Date**: 2025-11-25  
**Prepared by**: Senior Software Architect  

---

## 📖 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Complete File Dependency Map](#complete-file-dependency-map)
4. [Routing & Middleware Flow](#routing--middleware-flow)
5. [Feature Documentation Index](#feature-documentation-index)
6. [Database Schema Overview](#database-schema-overview)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Authentication & Authorization](#authentication--authorization)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Performance & Optimization](#performance--optimization)

---

## 1. PROJECT OVERVIEW

**Mystery Box Campaign Application** adalah aplikasi loyalty program berbasis gamifikasi dimana distributor/toko dapat membuka mystery box menggunakan kupon yang mereka dapatkan dari transaksi. Setiap box berisi hadiah dengan sistem probabilitas dinamis.

### Tech Stack

**Frontend:**
- React 18 + Vite
- React Router v6 (routing)
- Framer Motion (animations)
- Axios (HTTP client)
- Tailwind CSS (styling)
- Lucide React (icons)

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL database
- JWT authentication
- bcryptjs (password hashing)
- Multer (file uploads)

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Pages    │  │ Components │  │  Services  │            │
│  │  (Views)   │─▶│  (Reusable)│─▶│ (API Calls)│            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                         │                     │
└─────────────────────────────────────────┼─────────────────────┘
                                          │ HTTP/HTTPS
                                          │ (JSON + JWT)
┌─────────────────────────────────────────┼─────────────────────┐
│                        SERVER LAYER      ▼                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Routes   │─▶│Middlewares │─▶│Controllers │            │
│  │ (Endpoints)│  │  (Auth/    │  │ (Handlers) │            │
│  └────────────┘  │  Validation)│  └────────────┘            │
│                  └────────────┘         │                     │
│                                         ▼                     │
│                                  ┌────────────┐              │
│                                  │  Services  │              │
│                                  │ (Business  │              │
│                                  │   Logic)   │              │
│                                  └────────────┘              │
│                                         │                     │
└─────────────────────────────────────────┼─────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prisma ORM (Type-safe queries)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           PostgreSQL Database (ACID compliant)       │  │
│  │  Tables: User, Admin, Campaign, Box, Prize,          │  │
│  │          UserCouponBalance, UserBoxOpenLog, etc.     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. COMPLETE FILE DEPENDENCY MAP

### 📁 FRONTEND STRUCTURE

```
frontend/
│
├── src/
│   ├── main.jsx (Entry Point)
│   │   ├── imports React from 'react'
│   │   ├── imports ReactDOM from 'react-dom/client'
│   │   ├── imports { BrowserRouter } from 'react-router-dom'
│   │   ├── imports App from './App.jsx'
│   │   └── imports './index.css'
│   │
│   ├── App.jsx (Router Configuration)
│   │   ├── imports { Routes, Route, Navigate } from 'react-router-dom'
│   │   ├── imports ProtectedRoute from './components/ProtectedRoute.jsx'
│   │   ├── imports AdminProtectedRoute from './components/AdminProtectedRoute.jsx'
│   │   ├── imports LoginPage from './pages/LoginPage.jsx'
│   │   ├── imports DashboardPage from './pages/DashboardPage.jsx'
│   │   ├── imports MyPrizesPage from './pages/MyPrizesPage.jsx'
│   │   └── imports [All Admin Pages]
│   │
│   ├── pages/
│   │   │
│   │   ├── LoginPage.jsx (User Login)
│   │   │   ├── imports { useNavigate } from 'react-router-dom'
│   │   │   ├── imports { motion } from 'framer-motion'
│   │   │   ├── imports { Eye, EyeOff } from 'lucide-react'
│   │   │   └── imports apiClient from '../services/apiClient.js'
│   │   │
│   │   ├── DashboardPage.jsx (Main Dashboard)
│   │   │   ├── imports { motion, AnimatePresence } from 'framer-motion'
│   │   │   ├── imports { useNavigate } from 'react-router-dom'
│   │   │   ├── imports { Menu, Home, User, ArrowLeft, X, LogOut } from 'lucide-react'
│   │   │   ├── imports apiClient from '../services/apiClient.js'
│   │   │   ├── imports MysteryBox from '../components/MysteryBox.jsx'
│   │   │   ├── imports RoomCard from '../components/RoomCard.jsx'
│   │   │   └── imports { resolveImageUrl } from '../utils/imageUrl.js'
│   │   │
│   │   ├── MyPrizesPage.jsx (Prize History)
│   │   │   ├── imports apiClient from '../services/apiClient.js'
│   │   │   └── imports { resolveImageUrl } from '../utils/imageUrl.js'
│   │   │
│   │   └── admin/
│   │       ├── AdminLoginPage.jsx
│   │       ├── AdminDashboardPage.jsx
│   │       ├── CampaignListPage.jsx
│   │       ├── CampaignDetailPage.jsx
│   │       │   ├── imports apiClient from '../../services/apiClient.js'
│   │       │   ├── imports campaignApi from '../../services/campaignApi.js'
│   │       │   └── imports { resolveImageUrl } from '../../utils/imageUrl.js'
│   │       ├── CampaignEditPage.jsx
│   │       ├── AdminUserListPage.jsx
│   │       └── AdminAuditPage.jsx
│   │
│   ├── components/
│   │   ├── MysteryBox.jsx (Box Component)
│   │   │   ├── imports React, { useMemo } from 'react'
│   │   │   └── imports { motion } from 'framer-motion'
│   │   │
│   │   ├── RoomCard.jsx (Room Selection Card)
│   │   │   └── imports { motion } from 'framer-motion'
│   │   │
│   │   ├── ProtectedRoute.jsx (User Route Guard)
│   │   │   └── imports { Navigate } from 'react-router-dom'
│   │   │
│   │   ├── AdminProtectedRoute.jsx (Admin Route Guard)
│   │   │   └── imports { Navigate } from 'react-router-dom'
│   │   │
│   │   ├── ImageUpload.jsx (File Upload Component)
│   │   ├── ProgressBar.jsx (Progress Visualization)
│   │   ├── StatisticsCard.jsx (Stats Display)
│   │   └── AchievementBadge.jsx (Achievement Display)
│   │
│   ├── services/
│   │   ├── apiClient.js (Axios Instance)
│   │   │   └── imports axios from 'axios'
│   │   │
│   │   ├── campaignApi.js (Campaign API Wrapper)
│   │   │   └── imports apiClient from './apiClient.js'
│   │   │
│   │   ├── adminUserApi.js (Admin User API)
│   │   │   └── imports apiClient from './apiClient.js'
│   │   │
│   │   └── adminReportsApi.js (Reports API)
│   │       └── imports apiClient from './apiClient.js'
│   │
│   └── utils/
│       └── imageUrl.js (Image URL Helper)
│
└── index.html (HTML Entry)
```

### 📁 BACKEND STRUCTURE

```
backend/
│
├── src/
│   ├── server.js (Server Entry Point)
│   │   └── imports app from './app.js'
│   │
│   ├── app.js (Express App Configuration)
│   │   ├── imports express from 'express'
│   │   ├── imports cors from 'cors'
│   │   ├── imports morgan from 'morgan'
│   │   ├── imports authRoutes from './routes/authRoutes.js'
│   │   ├── imports campaignRoutes from './routes/campaignRoutes.js'
│   │   ├── imports boxRoutes from './routes/boxRoutes.js'
│   │   └── imports adminRoutes from './routes/adminRoutes.js'
│   │
│   ├── routes/
│   │   ├── authRoutes.js (Auth Endpoints)
│   │   │   └── imports { login } from '../controllers/authController.js'
│   │   │
│   │   ├── campaignRoutes.js (Campaign Endpoints)
│   │   │   ├── imports { protect } from '../middlewares/authMiddleware.js'
│   │   │   └── imports { getCampaignSummary, getMyPrizes, getCampaignBoxes }
│   │   │       from '../controllers/campaignController.js'
│   │   │
│   │   ├── boxRoutes.js (Box Endpoints)
│   │   │   ├── imports { protect } from '../middlewares/authMiddleware.js'
│   │   │   └── imports { openBoxController } from '../controllers/campaignController.js'
│   │   │
│   │   └── adminRoutes.js (Admin Endpoints)
│   │       ├── imports { protectAdmin, authorize } from '../middlewares/authMiddleware.js'
│   │       └── imports [All Admin Controllers]
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js (JWT Verification)
│   │   │   ├── imports jwt from 'jsonwebtoken'
│   │   │   └── imports prisma from '../utils/prisma.js'
│   │   │
│   │   ├── uploadMiddleware.js (Multer File Upload)
│   │   │   └── imports multer from 'multer'
│   │   │
│   │   └── errorMiddleware.js (Global Error Handler)
│   │
│   ├── controllers/
│   │   ├── authController.js (Authentication Logic)
│   │   │   ├── imports prisma from '../utils/prisma.js'
│   │   │   ├── imports bcrypt from 'bcryptjs'
│   │   │   └── imports jwt from 'jsonwebtoken'
│   │   │
│   │   ├── campaignController.js (Campaign Logic)
│   │   │   ├── imports prisma from '../utils/prisma.js'
│   │   │   ├── imports { openBoxForUser } from '../services/boxService.js'
│   │   │   ├── imports { getUserAchievements, checkAndUnlockAchievements }
│   │   │   │   from '../services/achievementService.js'
│   │   │   └── imports { [Custom Errors] } from '../utils/errors.js'
│   │   │
│   │   ├── adminController.js (Admin CRUD)
│   │   ├── importController.js (CSV Import)
│   │   └── reportsController.js (Data Export)
│   │
│   ├── services/
│   │   ├── boxService.js (Box Opening Business Logic)
│   │   │   ├── imports { randomInt } from 'crypto'
│   │   │   ├── imports prisma from '../utils/prisma.js'
│   │   │   ├── imports { [Custom Errors] } from '../utils/errors.js'
│   │   │   └── imports { logAudit } from '../utils/auditLogger.js'
│   │   │
│   │   └── achievementService.js (Achievement System)
│   │       └── imports prisma from '../utils/prisma.js'
│   │
│   ├── utils/
│   │   ├── prisma.js (Prisma Client Instance)
│   │   │   └── imports { PrismaClient } from '@prisma/client'
│   │   │
│   │   ├── errors.js (Custom Error Classes)
│   │   │   └── exports: CampaignInactiveError, NoCouponsLeftError, etc.
│   │   │
│   │   └── auditLogger.js (Audit Trail)
│   │       └── imports prisma from './prisma.js'
│   │
│   └── config/
│       └── database.js (DB Configuration)
│
└── prisma/
    └── schema.prisma (Database Schema Definition)
```

---

## 4. ROUTING & MIDDLEWARE FLOW

### 🔀 Request Flow Diagram

```
HTTP REQUEST
    ↓
┌─────────────────────────────────────────┐
│         Express App (app.js)            │
│  - CORS middleware                      │
│  - JSON body parser                     │
│  - Morgan logger                        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│         Route Matching                  │
│  /api/auth/*        → authRoutes        │
│  /api/campaigns/*   → campaignRoutes    │
│  /api/boxes/*       → boxRoutes         │
│  /admin/api/*       → adminRoutes       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│      Authentication Middleware          │
│  - protect() for user routes            │
│  - protectAdmin() for admin routes      │
│  - Verify JWT token                     │
│  - Attach user/admin to req object      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│      Authorization Middleware           │
│  - authorize(...roles) for admin        │
│  - Check admin role permissions         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│           Controller                    │
│  - Validate request parameters          │
│  - Call service layer                   │
│  - Format response                      │
│  - Handle errors                        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  - Business logic                       │
│  - Database transactions                │
│  - Complex calculations                 │
│  - Throw custom errors                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│         Prisma ORM                      │
│  - Type-safe queries                    │
│  - Transaction management               │
│  - Connection pooling                   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│      PostgreSQL Database                │
│  - ACID transactions                    │
│  - Data persistence                     │
└─────────────────────────────────────────┘
    ↓
RESPONSE (JSON)
```

### 🛣️ Route Definitions

**User Routes (Protected with `protect` middleware):**

| Method | Endpoint | Controller | Purpose |
|--------|----------|------------|---------|
| GET | `/api/campaigns/:campaignId/summary` | `getCampaignSummary` | Get campaign stats & user data |
| GET | `/api/campaigns/:campaignId/boxes` | `getCampaignBoxes` | Get all boxes in campaign |
| GET | `/api/campaigns/:campaignId/my-prizes` | `getMyPrizes` | Get user's won prizes |
| POST | `/api/boxes/:boxId/open` | `openBoxController` | Open a mystery box |

**Auth Routes (Public):**

| Method | Endpoint | Controller | Purpose |
|--------|----------|------------|---------|
| POST | `/api/auth/login` | `login` | User authentication |

**Admin Routes (Protected with `protectAdmin` + `authorize`):**

| Method | Endpoint | Controller | Purpose |
|--------|----------|------------|---------|
| POST | `/admin/api/auth/login` | `adminLogin` | Admin authentication |
| GET | `/admin/api/campaigns` | `getAllCampaigns` | List all campaigns |
| GET | `/admin/api/campaigns/:id` | `getCampaignDetail` | Get campaign details |
| POST | `/admin/api/campaigns` | `createCampaign` | Create new campaign |
| PUT | `/admin/api/campaigns/:id` | `updateCampaign` | Update campaign |
| POST | `/admin/api/campaigns/:id/boxes/generate` | `generateBoxes` | Generate boxes |
| POST | `/admin/api/campaigns/:id/prizes` | `createPrize` | Add prize to campaign |
| PUT | `/admin/api/prizes/:id` | `updatePrize` | Update prize |
| GET | `/admin/api/users` | `getAllUsers` | List all users |
| POST | `/admin/api/users/import` | `importUsers` | Bulk import users from CSV |
| GET | `/admin/api/reports/export-winners` | `exportWinners` | Export winners to CSV |

---

## 5. FEATURE DOCUMENTATION INDEX

Dokumentasi detail untuk setiap fitur tersedia di file terpisah:

### 📄 Available Documentation Files:

1. **[TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md](./TECHNICAL_DOCUMENTATION_LOGIN_FLOW.md)**
   - User authentication process
   - JWT token generation & storage
   - Session management
   - Auto-logout mechanism

2. **[TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md](./TECHNICAL_DOCUMENTATION_BOX_OPENING_FLOW.md)**
   - Complete box opening process
   - Prize selection algorithm
   - Race condition prevention
   - Transaction management
   - Real-time sync mechanism

### 🎯 Quick Feature Overview:

| Feature | Frontend Entry | Backend Entry | Key Service |
|---------|---------------|---------------|-------------|
| Login | `LoginPage.jsx` | `authController.js` | JWT signing |
| Box Opening | `DashboardPage.jsx` | `campaignController.js` | `boxService.js` |
| Prize History | `MyPrizesPage.jsx` | `campaignController.js` | Prisma queries |
| Campaign Management | `CampaignDetailPage.jsx` | `adminController.js` | CRUD operations |
| User Import | `AdminUserListPage.jsx` | `importController.js` | CSV parsing |
| Data Export | `AdminAuditPage.jsx` | `reportsController.js` | CSV generation |

---

## 6. DATABASE SCHEMA OVERVIEW

### 📊 Core Tables & Relationships

```
┌──────────────┐         ┌──────────────┐
│     User     │         │    Admin     │
│──────────────│         │──────────────│
│ id (PK)      │         │ id (PK)      │
│ storeCode    │         │ email        │
│ passwordHash │         │ passwordHash │
│ name         │         │ name         │
│ ownerName    │         │ role         │
│ status       │         └──────────────┘
└──────────────┘
       │
       │ 1:N
       ▼
┌──────────────────────┐
│ UserCouponBalance    │
│──────────────────────│
│ id (PK)              │
│ userId (FK)          │◀─────┐
│ campaignId (FK)      │      │
│ totalEarned          │      │
│ totalUsed            │      │
└──────────────────────┘      │
       │                       │
       │ 1:N                   │
       ▼                       │
┌──────────────────────┐      │
│  UserBoxOpenLog      │      │
│──────────────────────│      │
│ id (PK)              │      │
│ userId (FK)          │──────┘
│ campaignId (FK)      │──────┐
│ boxId (FK)           │      │
│ prizeId (FK)         │      │
│ openedAt             │      │
└──────────────────────┘      │
       │                       │
       │ 1:1                   │
       ▼                       │
┌──────────────────────┐      │
│     UserPrize        │      │
│──────────────────────│      │
│ id (PK)              │      │
│ userId (FK)          │      │
│ campaignId (FK)      │──────┤
│ prizeId (FK)         │      │
│ userBoxOpenLogId(FK) │      │
│ status               │      │
│ claimedAt            │      │
└──────────────────────┘      │
                               │
       ┌───────────────────────┘
       │
       ▼
┌──────────────────────┐
│     Campaign         │
│──────────────────────│
│ id (PK)              │
│ name                 │
│ startDate            │
│ endDate              │
│ isActive             │
│ roomSize             │
│ minPurchasePerCoupon │
└──────────────────────┘
       │
       │ 1:N
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│     Box      │   │    Prize     │
│──────────────│   │──────────────│
│ id (PK)      │   │ id (PK)      │
│ campaignId   │   │ campaignId   │
│ name         │   │ name         │
│ status       │   │ tier         │
│ imageUrl     │   │ type         │
└──────────────┘   │ stockTotal   │
                   │ stockRemaining│
                   │ baseProbability│
                   │ isActive     │
                   │ imageUrl     │
                   └──────────────┘
```

### 🔑 Key Relationships:

1. **User → UserCouponBalance** (1:N)
   - One user can have multiple coupon balances (one per campaign)

2. **User → UserBoxOpenLog** (1:N)
   - Track all boxes opened by user

3. **UserBoxOpenLog → UserPrize** (1:1)
   - Each box open creates one prize record

4. **Campaign → Box** (1:N)
   - Campaign contains multiple boxes

5. **Campaign → Prize** (1:N)
   - Campaign has multiple prize types

---

## 7. API ENDPOINTS REFERENCE

### 🔓 Public Endpoints

```http
POST /api/auth/login
Content-Type: application/json

{
  "storeCode": "STORE001",
  "password": "password123"
}

Response 200:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "activeCampaignId": "1"
}
```

### 🔒 Protected User Endpoints

```http
GET /api/campaigns/:campaignId/summary
Authorization: Bearer {token}

Response 200:
{
  "user": { "name": "Toko ABC", "storeCode": "STORE001", ... },
  "campaign": { "id": "1", "name": "End Year Campaign", ... },
  "couponBalance": { "totalEarned": 10, "totalUsed": 3, "balance": 7 },
  "stats": { "totalBoxesOpened": 3, "totalPrizesWon": 3, ... },
  "achievements": [...]
}
```

```http
GET /api/campaigns/:campaignId/boxes
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "1",
    "name": "Box #1",
    "status": "available",
    "openedBy": null
  },
  {
    "id": "2",
    "name": "Box #2",
    "status": "opened",
    "openedBy": { "userId": "5", "name": "Toko XYZ" }
  },
  ...
]
```

```http
POST /api/boxes/:boxId/open
Authorization: Bearer {token}

Response 200:
{
  "prize": {
    "id": "7",
    "name": "Points 5",
    "tier": "C",
    "type": "points",
    "imageUrl": "/uploads/prizes/..."
  },
  "couponBalance": {
    "totalEarned": 10,
    "totalUsed": 4,
    "balance": 6
  }
}

Error 409 (Box already opened):
{
  "code": "BOX_ALREADY_OPENED",
  "message": "This box has already been opened."
}

Error 400 (No coupons):
{
  "code": "NO_COUPONS_LEFT",
  "message": "You have no coupons left."
}
```

```http
GET /api/campaigns/:campaignId/my-prizes
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "15",
    "createdAt": "2025-11-25T10:30:00Z",
    "name": "Points 5",
    "tier": "C",
    "type": "points",
    "status": "unclaimed",
    "imageUrl": "/uploads/prizes/...",
    "campaign": { "id": "1", "name": "End Year Campaign" }
  },
  ...
]
```

### 🔒 Protected Admin Endpoints

```http
POST /admin/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

Response 200:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "superadmin"
  }
}
```

```http
GET /admin/api/campaigns/:id
Authorization: Bearer {adminToken}

Response 200:
{
  "id": "1",
  "name": "End Year Campaign",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "isActive": true,
  "roomSize": 100,
  "totalBoxes": 500,
  "prizes": [...],
  "totalCouponsEarned": 1000,
  "totalCouponsUsed": 350,
  "totalCouponsBalance": 650
}
```

```http
POST /admin/api/campaigns/:id/boxes/generate
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "amount": 100
}

Response 200:
{
  "message": "Successfully generated 100 boxes",
  "totalBoxes": 600
}
```

```http
POST /admin/api/campaigns/:id/prizes
Authorization: Bearer {adminToken}
Content-Type: multipart/form-data

FormData:
  - name: "iPhone 15 Pro"
  - tier: "S"
  - type: "gadget"
  - stockTotal: 5
  - baseProbability: 0.01
  - image: [File]
  - description: "Hadiah utama"

Response 201:
{
  "id": "20",
  "name": "iPhone 15 Pro",
  "tier": "S",
  ...
}
```

---

## 8. AUTHENTICATION & AUTHORIZATION

### 🔐 JWT Token Structure

**User Token Payload:**
```javascript
{
  "userId": "123",        // BigInt converted to string
  "storeCode": "STORE001",
  "role": "user",
  "iat": 1700000000,      // Issued at (timestamp)
  "exp": 1700003600       // Expires at (1 hour later)
}
```

**Admin Token Payload:**
```javascript
{
  "adminId": "1",         // BigInt converted to string
  "email": "admin@example.com",
  "role": "superadmin",   // or "manager"
  "iat": 1700000000,
  "exp": 1700003600
}
```

### 🛡️ Middleware Chain

**User Protected Route:**
```javascript
// Route definition
router.get('/:campaignId/summary', protect, getCampaignSummary);

// Execution flow:
1. protect middleware runs
2. Extract token from Authorization header
3. Verify token with JWT_SECRET
4. Fetch user from database
5. Attach user to req.user
6. Call next() → controller runs
```

**Admin Protected Route:**
```javascript
// Route definition
router.post('/campaigns', protectAdmin, authorize('superadmin'), createCampaign);

// Execution flow:
1. protectAdmin middleware runs
2. Extract token from Authorization header
3. Verify token with JWT_SECRET
4. Fetch admin from database
5. Attach admin to req.admin
6. Call next() → authorize middleware runs
7. Check if req.admin.role in ['superadmin']
8. Call next() → controller runs
```

### 🔄 Token Lifecycle

```
┌─────────────┐
│ User Login  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Backend generates JWT   │
│ - Sign with JWT_SECRET  │
│ - Set expiration (1h)   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Frontend stores token   │
│ - localStorage.setItem  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Subsequent API requests │
│ - Include in header     │
│ - Backend verifies      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Token expires (1h)      │
│ - Backend returns 401   │
│ - Frontend auto-logout  │
│ - Redirect to login     │
└─────────────────────────┘
```

---

## 9. ERROR HANDLING STRATEGY

### 🚨 Custom Error Classes

**Location**: `backend/src/utils/errors.js`

```javascript
// Base error class
class ServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

// Specific error types
class BoxAlreadyOpenedError extends ServiceError {
  constructor() {
    super('This box has already been opened.', 'BOX_ALREADY_OPENED');
  }
}

class NoCouponsLeftError extends ServiceError {
  constructor() {
    super('You have no coupons left.', 'NO_COUPONS_LEFT');
  }
}

class CampaignInactiveError extends ServiceError {
  constructor() {
    super('Campaign is not active.', 'CAMPAIGN_INACTIVE');
  }
}

class NoPrizesAvailableError extends ServiceError {
  constructor() {
    super('No prizes available at this time.', 'NO_PRIZES_AVAILABLE');
  }
}

class PrizeSelectionError extends ServiceError {
  constructor(message = 'Failed to select prize.') {
    super(message, 'PRIZE_SELECTION_ERROR');
  }
}
```

### 🔄 Error Flow

```
Service Layer (boxService.js)
    │
    │ throw new NoCouponsLeftError()
    ▼
Controller Layer (campaignController.js)
    │
    │ catch (error)
    │ if (error instanceof NoCouponsLeftError)
    │   return res.status(400).json({ code, message })
    ▼
HTTP Response (400 Bad Request)
    │
    ▼
Frontend (apiClient.js)
    │
    │ axios catch block
    │ err.response.data.message
    ▼
UI Display (DashboardPage.jsx)
    │
    │ setOpenBoxError(message)
    ▼
Error Modal shown to user
```

### 📋 Error Code Reference

| Error Code | HTTP Status | Thrown By | Meaning |
|------------|-------------|-----------|---------|
| `BOX_ALREADY_OPENED` | 409 Conflict | boxService.js | Box was opened by another user |
| `NO_COUPONS_LEFT` | 400 Bad Request | boxService.js | User has no coupons remaining |
| `CAMPAIGN_INACTIVE` | 403 Forbidden | boxService.js | Campaign is not active or expired |
| `NO_PRIZES_AVAILABLE` | 503 Service Unavailable | boxService.js | No prizes with stock > 0 |
| `PRIZE_SELECTION_ERROR` | 409 Conflict | boxService.js | Failed to select/update prize |
| `INVALID_CAMPAIGN_ID` | 400 Bad Request | campaignController.js | Invalid ID format |
| `BOX_NOT_FOUND` | 404 Not Found | boxService.js | Box ID doesn't exist |

---

## 10. PERFORMANCE & OPTIMIZATION

### ⚡ Frontend Optimizations

**1. React.memo for Components**
```javascript
// MysteryBox.jsx
export default React.memo(MysteryBox);
```
- Prevents unnecessary re-renders
- Only re-render when props change

**2. useMemo for Expensive Calculations**
```javascript
// DashboardPage.jsx
const brandLogo = useMemo(() => resolveImageUrl(brandLogoEnv), [brandLogoEnv]);
```
- Cache computed values
- Recalculate only when dependencies change

**3. useCallback for Event Handlers**
```javascript
// DashboardPage.jsx
const fetchCampaignSummary = useCallback(async () => {
  // ... fetch logic
}, [currentCampaignId]);
```
- Stable function references
- Prevent child re-renders

**4. Equality Checks Before State Updates**
```javascript
// DashboardPage.jsx
setSummary(prev => summariesEqual(prev, response.data) ? prev : response.data);
```
- Only update state if data actually changed
- Reduce re-render cycles

**5. Silent Polling**
```javascript
// DashboardPage.jsx
fetchBoxes({ silent: true }); // No loading indicator
```
- Background sync without UI disruption

**6. Image Lazy Loading**
```javascript
<img loading="lazy" decoding="async" />
```
- Defer offscreen image loading
- Faster initial page load

### ⚡ Backend Optimizations

**1. Parallel Database Queries**
```javascript
// campaignController.js
const [campaign, couponBalance, totalBoxes, ...] = await Promise.all([
  prisma.campaign.findUnique(...),
  prisma.userCouponBalance.findFirst(...),
  prisma.box.count(...),
  // ... more queries
]);
```
- Execute multiple queries simultaneously
- Reduce total query time

**2. Database Transactions**
```javascript
// boxService.js
return prisma.$transaction(async (tx) => {
  // All operations here are atomic
});
```
- ACID compliance
- Prevent partial updates
- Automatic rollback on error

**3. Optimistic Locking**
```javascript
// boxService.js
const result = await tx.box.updateMany({
  where: { id: boxId, status: { not: 'opened' } },
  data: { status: 'opened' }
});
if (result.count === 0) {
  throw new BoxAlreadyOpenedError();
}
```
- Prevent race conditions
- No explicit locks needed
- Better concurrency

**4. Select Only Needed Fields**
```javascript
// campaignController.js
select: {
  id: true,
  name: true,
  storeCode: true,
  // Don't fetch passwordHash or other sensitive data
}
```
- Reduce data transfer
- Better security
- Faster queries

**5. Connection Pooling**
```javascript
// Prisma automatically manages connection pool
// Default: 10 connections
```
- Reuse database connections
- Better resource utilization

### 📊 Performance Metrics

| Operation | Target Time | Optimization Strategy |
|-----------|-------------|----------------------|
| Login | < 500ms | Indexed storeCode, bcrypt rounds = 10 |
| Fetch Summary | < 300ms | Parallel queries, select specific fields |
| Fetch Boxes | < 200ms | Indexed campaignId, pagination |
| Open Box | < 800ms | Transaction, optimistic locking |
| Background Sync | < 200ms | Silent mode, cached results |

---

## 📝 CRITICAL NOTES FOR CONTRIBUTORS

### ⚠️ DO NOT:

1. **Modify transaction logic without full understanding**
   - Risk of race conditions
   - Risk of data inconsistency
   - Always test with concurrent users

2. **Change JWT_SECRET in production**
   - Will invalidate all existing tokens
   - All users will be logged out
   - Plan maintenance window

3. **Remove optimistic locking conditions**
   - `WHERE status != 'opened'` is critical
   - Prevents double-opens
   - Prevents stock overselling

4. **Increase polling frequency below 5 seconds**
   - Server load will increase significantly
   - Database connections may exhaust
   - Use WebSockets if real-time needed

5. **Store sensitive data in localStorage**
   - Vulnerable to XSS attacks
   - Never store passwords
   - Tokens are acceptable with proper CSP

### ✅ BEST PRACTICES:

1. **Always use transactions for multi-step operations**
2. **Always validate IDs with parseIdToBigInt()**
3. **Always check updateMany().count after conditional updates**
4. **Always use custom error classes for business logic errors**
5. **Always log audit trail for critical actions**
6. **Always test error scenarios (no stock, no coupons, concurrent opens)**
7. **Always use React.memo for list item components**
8. **Always use equality checks before setState**

---

## 🔗 QUICK REFERENCE

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mysterybox"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_ACCESS_TOKEN_EXPIRATION="1h"
PORT=5000
NODE_ENV="development"
```

**Frontend (.env):**
```env
VITE_API_BASE_URL="/api"
VITE_ADMIN_API_BASE_URL="/admin/api"
VITE_BRAND_LOGO="/uploads/brand-logo.png"
VITE_BRAND_LOGO_OPENED="/uploads/brand-logo-opened.png"
```

### Common Commands

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Build for production
npm run build
```

### File Locations Quick Reference

| What | Where |
|------|-------|
| User pages | `frontend/src/pages/*.jsx` |
| Admin pages | `frontend/src/pages/admin/*.jsx` |
| Reusable components | `frontend/src/components/*.jsx` |
| API services | `frontend/src/services/*.js` |
| Backend routes | `backend/src/routes/*.js` |
| Controllers | `backend/src/controllers/*.js` |
| Business logic | `backend/src/services/*.js` |
| Middlewares | `backend/src/middlewares/*.js` |
| Database schema | `backend/prisma/schema.prisma` |
| Uploaded files | `backend/public/uploads/` |

---

## 📚 DETAILED DOCUMENTATION FILES

Untuk penjelasan mendalam tentang setiap fitur, baca dokumentasi terpisah:

1. **LOGIN_FLOW.md** - Authentication process, JWT management, session handling
2. **BOX_OPENING_FLOW.md** - Core gameplay, prize algorithm, transaction management

---

## 🎓 LEARNING PATH FOR NEW CONTRIBUTORS

### Beginner Level:
1. Read this master documentation
2. Study database schema in `schema.prisma`
3. Understand routing in `app.js` and route files
4. Review LOGIN_FLOW.md

### Intermediate Level:
1. Study BOX_OPENING_FLOW.md
2. Understand Prisma transactions
3. Review custom error handling
4. Study React state management patterns

### Advanced Level:
1. Understand prize selection algorithm
2. Study race condition prevention
3. Review optimistic locking patterns
4. Understand performance optimizations

---

**END OF MASTER DOCUMENTATION**

*Dokumentasi ini adalah entry point untuk memahami seluruh arsitektur aplikasi Mystery Box. Untuk detail implementasi setiap fitur, lihat dokumentasi spesifik yang terlink di atas.*

---

**Last Updated**: 2025-11-25  
**Maintainer**: Development Team  
**Contact**: [Your contact info]
