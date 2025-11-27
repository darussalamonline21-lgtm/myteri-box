# Mystery Box Campaign Application

## Daftar Isi
- [Tentang Aplikasi](#tentang-aplikasi)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Project](#struktur-project)
- [Instalasi dan Setup](#instalasi-dan-setup)
- [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
- [Fitur Utama](#fitur-utama)
- [Penjelasan Alur Kerja](#penjelasan-alur-kerja)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

---

## Tentang Aplikasi

**Mystery Box Campaign Application** adalah sistem gamifikasi untuk program loyalitas distributor. Aplikasi ini memungkinkan pemilik toko menggunakan kupon yang diperoleh dari pembelian untuk membuka kotak misteri digital dan memenangkan berbagai hadiah.

### Konsep Dasar
- **User (Pemilik Toko)**: Mendapatkan kupon dari pembelian, menggunakan kupon untuk membuka kotak misteri, dan memenangkan hadiah
- **Admin**: Mengelola kampanye, mengatur hadiah, membuat kotak, dan mengelola pengguna
- **Campaign**: Periode promosi dengan kotak dan hadiah tertentu
- **Box**: Kotak misteri yang bisa dibuka oleh user
- **Prize**: Hadiah yang bisa dimenangkan dari kotak

### Tujuan Aplikasi
1. Meningkatkan engagement distributor melalui gamifikasi
2. Memberikan reward kepada distributor yang aktif
3. Memudahkan admin dalam mengelola program loyalitas
4. Menciptakan pengalaman interaktif yang menyenangkan

---

## Arsitektur Sistem

Aplikasi ini menggunakan arsitektur **Headless** (Frontend dan Backend terpisah):

```
┌─────────────────────────────────────────┐
│         FRONTEND (Client)               │
│  React + Vite + Tailwind CSS            │
│  - User Interface                       │
│  - Admin Panel                          │
│  - Komunikasi API via Axios             │
└──────────────┬──────────────────────────┘
               │
               │ HTTP/JSON (RESTful API)
               │
┌──────────────▼──────────────────────────┐
│         BACKEND (Server)                │
│  Node.js + Express.js                   │
│  - RESTful API                          │
│  - Business Logic                       │
│  - Authentication (JWT)                 │
│  - Prize Randomization                  │
└──────────────┬──────────────────────────┘
               │
               │ Prisma ORM
               │
┌──────────────▼──────────────────────────┐
│      DATABASE (PostgreSQL)              │
│  - Campaigns, Boxes, Prizes             │
│  - Users, Transactions                  │
│  - Logs, Achievements                   │
└─────────────────────────────────────────┘
```

### Keuntungan Arsitektur Ini
- **Scalability**: Frontend dan Backend dapat di-scale secara terpisah
- **Flexibility**: Mudah untuk menambah platform lain (Mobile App, Desktop)
- **Maintainability**: Pemisahan yang jelas antara UI dan Business Logic
- **Security**: Backend dapat dilindungi dengan lebih baik
- **Performance**: Frontend dapat di-deploy ke CDN

---

## Teknologi yang Digunakan

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19.2.0 | Library untuk membangun user interface |
| Vite | 7.2.2 | Build tool modern dengan Hot Module Replacement |
| Tailwind CSS | 3.4.17 | Framework CSS untuk styling |
| Framer Motion | 12.23.24 | Library untuk animasi |
| Lucide React | 0.554.0 | Icon library |
| Axios | 1.13.2 | HTTP client untuk komunikasi dengan API |
| React Router DOM | 7.9.6 | Routing untuk Single Page Application |

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Node.js | LTS | JavaScript runtime untuk server |
| Express.js | 4.19.2 | Web framework |
| Prisma | 5.16.1 | ORM untuk database |
| PostgreSQL | Latest | Relational database |
| JSON Web Token | 9.0.2 | Authentication |
| BCrypt.js | 2.4.3 | Password hashing |
| Zod | 4.1.12 | Schema validation |
| Multer | 1.4.5 | File upload handling |
| Morgan | 1.10.0 | HTTP request logger |
| CORS | 2.8.5 | Cross-Origin Resource Sharing |

---

## Struktur Project

```
MISTERI BOX/
│
├── backend/                    # Backend application
│   ├── prisma/                # Database schema dan migrations
│   │   ├── schema.prisma      # Database schema definition
│   │   ├── seed.js            # Data seeding script
│   │   └── migrations/        # Database migrations
│   │
│   ├── src/                   # Source code backend
│   │   ├── controllers/       # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── campaignController.js
│   │   │   ├── adminController.js
│   │   │   ├── importController.js
│   │   │   └── reportsController.js
│   │   │
│   │   ├── middlewares/       # Custom middlewares
│   │   │   ├── authMiddleware.js
│   │   │   ├── uploadMiddleware.js
│   │   │   └── errorHandler.js
│   │   │
│   │   ├── routes/            # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── campaignRoutes.js
│   │   │   ├── boxRoutes.js
│   │   │   └── adminRoutes.js
│   │   │
│   │   ├── services/          # Business logic
│   │   │   ├── prizeService.js
│   │   │   └── achievementService.js
│   │   │
│   │   ├── utils/             # Utility functions
│   │   ├── config/            # Configuration files
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Server entry point
│   │
│   ├── public/                # Static files
│   │   └── uploads/           # Uploaded images
│   │       ├── prizes/
│   │       └── boxes/
│   │
│   ├── .env                   # Environment variables
│   ├── package.json           # Dependencies
│   └── verify-*.js            # Testing scripts
│
└── frontend/                  # Frontend application
    ├── src/                   # Source code frontend
    │   ├── components/        # Reusable components
    │   │   ├── MysteryBox.jsx
    │   │   ├── RoomCard.jsx
    │   │   ├── StatisticsCard.jsx
    │   │   ├── ProgressBar.jsx
    │   │   ├── AchievementsSection.jsx
    │   │   ├── ImageUpload.jsx
    │   │   ├── ImportUsersModal.jsx
    │   │   ├── UserFormModal.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── AdminProtectedRoute.jsx
    │   │
    │   ├── pages/             # Page components
    │   │   ├── LoginPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── MyPrizesPage.jsx
    │   │   └── admin/         # Admin pages
    │   │       ├── AdminLoginPage.jsx
    │   │       ├── AdminDashboardPage.jsx
    │   │       ├── CampaignListPage.jsx
    │   │       ├── CampaignDetailPage.jsx
    │   │       ├── CampaignFormPage.jsx
    │   │       ├── AdminUserListPage.jsx
    │   │       └── CreateUserPage.jsx
    │   │
    │   ├── services/          # API service functions
    │   │   ├── authService.js
    │   │   ├── campaignService.js
    │   │   └── adminService.js
    │   │
    │   ├── App.jsx            # Main app component
    │   ├── main.jsx           # Entry point
    │   └── index.css          # Global styles
    │
    ├── public/                # Public assets
    ├── .env                   # Environment variables
    ├── package.json           # Dependencies
    ├── vite.config.js         # Vite configuration
    └── tailwind.config.js     # Tailwind configuration
```

---

## Instalasi dan Setup

### Prasyarat
Pastikan Anda sudah menginstall:
- **Node.js** (versi 18 atau lebih baru)
- **PostgreSQL** (versi 14 atau lebih baru)
- **npm** atau **yarn** (package manager)

### Langkah 1: Clone atau Download Project
```bash
# Jika menggunakan Git
git clone <repository-url>
cd "MISTERI BOX"

# Atau extract file ZIP ke folder
```

### Langkah 2: Setup Backend

#### 2.1 Install Dependencies
```bash
cd backend
npm install
```

#### 2.2 Konfigurasi Environment Variables
Buat file `.env` di folder `backend/` dengan isi:
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/mystery_box_db"

# JWT Secret (ganti dengan string random yang aman)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Penjelasan:**
- `DATABASE_URL`: Connection string ke PostgreSQL Anda
  - Format: `postgresql://[username]:[password]@[host]:[port]/[database_name]`
  - Contoh: `postgresql://postgres:admin123@localhost:5432/mystery_box_db`
- `JWT_SECRET`: Kunci rahasia untuk enkripsi token (gunakan string random yang panjang)
- `PORT`: Port untuk backend server (default: 5000)

#### 2.3 Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migrations (membuat tabel di database)
npx prisma migrate dev --name init

# Seed database dengan data awal (opsional tapi disarankan)
npm run seed
```

**Catatan:** Perintah `migrate dev` akan otomatis membuat database jika belum ada.

### Langkah 3: Setup Frontend

#### 3.1 Install Dependencies
```bash
cd ../frontend
npm install
```

#### 3.2 Konfigurasi Environment Variables
Buat file `.env` di folder `frontend/` dengan isi:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

**Penjelasan:**
- `VITE_API_URL`: URL backend API (sesuaikan dengan PORT backend Anda)

---

## Cara Menjalankan Aplikasi

### Development Mode

#### Terminal 1: Jalankan Backend
```bash
cd backend
npm run dev
```
Backend akan berjalan di `http://localhost:5000`

#### Terminal 2: Jalankan Frontend
```bash
cd frontend
npm run dev
```
Frontend akan berjalan di `http://localhost:5173` (atau port lain yang ditampilkan)

### Akses Aplikasi
1. **User Interface**: Buka browser dan akses `http://localhost:5173`
2. **Admin Panel**: Akses `http://localhost:5173/admin/login`

### Default Credentials (Setelah Seeding)

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**User (Contoh):**
- Store Code: `TKO001`
- Password: `password123`

---

## Fitur Utama

### Untuk User (Pemilik Toko)

#### 1. Authentication
- Login menggunakan Store Code dan Password
- Session management dengan JWT token
- Auto-redirect jika belum login

#### 2. Dashboard
- **Statistics Card**: Menampilkan nama toko, saldo kupon, dan jumlah box yang sudah dibuka
- **Progress Bar**: Visual progress menuju milestone berikutnya
- **Achievements**: Badge yang sudah di-unlock
- **Room Selection**: Pilih room untuk melihat kotak-kotak misteri

#### 3. Mystery Box Game
- Grid kotak dengan status berbeda:
  - **Hijau**: Available (bisa dibuka)
  - **Biru**: Opened by You (sudah Anda buka)
  - **Abu-abu**: Opened by Others (sudah dibuka user lain)
- Klik kotak untuk membuka
- Animasi shaking saat membuka
- Modal reveal hadiah yang dimenangkan
- Update real-time saldo kupon dan statistik

#### 4. My Prizes
- Daftar semua hadiah yang sudah dimenangkan
- Informasi detail hadiah (nama, tier, tanggal menang)
- Status klaim hadiah

### Untuk Admin

#### 1. Campaign Management
- **Create Campaign**: Buat kampanye baru dengan konfigurasi lengkap
- **View Campaigns**: Lihat semua kampanye
- **Edit Campaign**: Update detail kampanye
- **Delete Campaign**: Hapus kampanye
- **Campaign Detail**: Lihat statistik dan detail kampanye

#### 2. Box Management
- **Generate Boxes**: Buat ribuan kotak sekaligus secara otomatis
- **View Boxes**: Lihat semua kotak dalam kampanye
- **Update Box**: Edit detail kotak individual
- **Upload Box Image**: Tambahkan gambar untuk kotak

#### 3. Prize Management
- **Create Prize**: Tambah hadiah baru dengan konfigurasi:
  - Nama dan deskripsi
  - Tier (Common, Rare, Epic, Legendary)
  - Type (Physical, Digital, Voucher)
  - Drop Rate (probability)
  - Stock total
  - Upload gambar
- **Update Prize**: Edit detail hadiah
- **Stock Management**: Tracking stock tersisa
- **Active/Inactive**: Toggle ketersediaan hadiah

#### 4. User Management
- **Create User**: Buat user baru dengan assign campaign dan kupon awal
- **View Users**: Lihat semua user dengan balance kupon
- **Bulk Import**: Import banyak user sekaligus via CSV
- **Export Data**: Download laporan winners dalam format CSV

#### 5. Reports & Analytics
- Export data winners dengan detail lengkap
- View campaign statistics
- Track user activity

---

## Penjelasan Alur Kerja

### Alur User: Membuka Mystery Box

#### Step 1: Login
```
User membuka aplikasi
  ↓
Input Store Code dan Password
  ↓
Frontend kirim request ke: POST /api/v1/auth/login
  ↓
Backend validasi credentials
  ↓
Backend generate JWT token
  ↓
Backend kirim response dengan token dan activeCampaignId
  ↓
Frontend simpan token dan campaignId ke localStorage
  ↓
Redirect ke Dashboard
```

#### Step 2: Pilih Room
```
User melihat list of rooms di Dashboard
  ↓
Klik salah satu room (contoh: Room 1)
  ↓
Frontend fetch boxes: GET /api/v1/campaigns/{campaignId}/boxes?page=1
  ↓
Backend return 100 boxes dengan status masing-masing
  ↓
Frontend render grid of mystery boxes
```

#### Step 3: Buka Box
```
User klik box yang available (hijau)
  ↓
Frontend tampilkan animasi shaking
  ↓
Frontend kirim request: POST /api/v1/campaigns/{campaignId}/boxes/{boxId}/open
  ↓
Backend validasi:
  - Apakah campaign aktif?
  - Apakah user punya kupon?
  - Apakah box belum dibuka?
  ↓
Backend mulai Database Transaction
  ↓
Backend jalankan Prize Randomization Algorithm
  ↓
Backend update database (atomic):
  - Box status → "opened"
  - Prize stock → decrement
  - User coupon → decrement
  - Create UserBoxOpenLog
  - Create UserPrize
  - Check dan unlock achievements
  ↓
Backend commit transaction
  ↓
Backend return prize data
  ↓
Frontend tampilkan modal reveal hadiah
  ↓
Frontend update UI:
  - Box berubah warna jadi biru
  - Balance kupon berkurang
  - Stats terupdate
```

### Algoritma Prize Randomization

Sistem menggunakan **Weighted Random Algorithm** untuk menentukan hadiah:

```javascript
// Contoh konfigurasi prizes:
Prize A (Common):    probability = 0.50 (50%)
Prize B (Rare):      probability = 0.30 (30%)
Prize C (Epic):      probability = 0.15 (15%)
Prize D (Legendary): probability = 0.05 (5%)

Total Weight = 1.00 (100%)

// Proses randomization:
1. Generate random number antara 0.0 - 1.0
2. Tentukan prize berdasarkan range:

Random = 0.65
  → 0.00 - 0.50: Prize A
  → 0.51 - 0.80: Prize B ✓ (terpilih)
  → 0.81 - 0.95: Prize C
  → 0.96 - 1.00: Prize D
```

**Keadilan:**
- Setiap prize punya peluang sesuai probability yang dikonfigurasi
- Stock habis = prize tidak muncul lagi
- Menggunakan `crypto.randomInt` untuk randomness yang lebih baik

### Alur Admin: Membuat Campaign

#### Step 1: Create Campaign
```
Admin login ke Admin Panel
  ↓
Klik "Create Campaign"
  ↓
Isi form:
  - Campaign Name
  - Description
  - Start Date & End Date
  - Min Purchase Per Coupon
  - Room Size (default: 100)
  - Max Coupons Per User
  ↓
Submit form → POST /api/v1/admin/campaigns
  ↓
Backend create campaign record
  ↓
Redirect ke Campaign Detail
```

#### Step 2: Generate Boxes
```
Di Campaign Detail, klik "Generate Boxes"
  ↓
Input jumlah boxes (contoh: 10000)
  ↓
POST /api/v1/admin/campaigns/{id}/boxes/generate
  ↓
Backend batch insert boxes:
  - Loop create boxes dengan nama "Box 1", "Box 2", ...
  - Status default: "available"
  - Optimized dengan Prisma createMany
  ↓
Return success message
  ↓
Box count terupdate di UI
```

#### Step 3: Add Prizes
```
Klik "Add Prize"
  ↓
Isi form:
  - Prize Name
  - Description
  - Tier (dropdown)
  - Type (dropdown)
  - Base Probability (0.0 - 1.0)
  - Stock Total
  - Upload Image
  ↓
POST /api/v1/admin/campaigns/{id}/prizes
  ↓
Backend:
  - Upload image ke /public/uploads/prizes
  - Create prize record
  - Set stockRemaining = stockTotal
  ↓
Prize muncul di list
```

#### Step 4: Create Users
```
Klik "Create User"
  ↓
Isi form:
  - Name
  - Store Code (unique)
  - Password
  - Phone
  - Campaign ID
  - Initial Coupons
  ↓
POST /api/v1/admin/users
  ↓
Backend:
  - Hash password dengan bcrypt
  - Create user record
  - Create UserCouponBalance
  ↓
User bisa login
```

---

## Database Schema

### Model Utama

#### User
Menyimpan data pemilik toko/distributor
```prisma
model User {
  id           BigInt    @id @default(autoincrement())
  name         String    // Nama toko
  phone        String    // Nomor telepon
  email        String?   // Email (opsional)
  storeCode    String?   @unique  // Kode toko untuk login
  passwordHash String?   // Password yang di-hash
  status       String    // active/inactive
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

#### Campaign
Menyimpan data kampanye mystery box
```prisma
model Campaign {
  id                   BigInt   @id @default(autoincrement())
  name                 String   // Nama kampanye
  description          String?  // Deskripsi
  startDate            DateTime // Tanggal mulai
  endDate              DateTime // Tanggal selesai
  minPurchasePerCoupon Decimal  // Minimal pembelian per kupon
  roomSize             Int      @default(100)  // Jumlah box per room
  maxCouponsPerUser    Int?     // Maksimal kupon per user
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

#### Box
Menyimpan data kotak misteri
```prisma
model Box {
  id          BigInt   @id @default(autoincrement())
  campaignId  BigInt   // Relasi ke Campaign
  name        String   // Nama box (contoh: "Box 1")
  imageUrl    String?  // URL gambar box
  description String?  // Deskripsi
  status      String   @default("available")  // available/opened
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Prize
Menyimpan data hadiah
```prisma
model Prize {
  id              BigInt  @id @default(autoincrement())
  campaignId      BigInt  // Relasi ke Campaign
  name            String  // Nama hadiah
  imageUrl        String? // URL gambar hadiah
  description     String? // Deskripsi
  tier            String  // Common/Rare/Epic/Legendary
  type            String  // Physical/Digital/Voucher
  baseProbability Decimal // Probability (0.0 - 1.0)
  stockTotal      Int     // Total stock
  stockRemaining  Int     // Stock tersisa
  isActive        Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### UserCouponBalance
Tracking saldo kupon user per campaign
```prisma
model UserCouponBalance {
  id          BigInt   @id @default(autoincrement())
  userId      BigInt   // Relasi ke User
  campaignId  BigInt   // Relasi ke Campaign
  totalEarned Int      @default(0)  // Total kupon yang didapat
  totalUsed   Int      @default(0)  // Total kupon yang dipakai
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, campaignId])  // Satu user hanya punya satu balance per campaign
}
```

**Balance Calculation:**
```
Available Coupons = totalEarned - totalUsed
```

#### UserBoxOpenLog
Log setiap pembukaan box
```prisma
model UserBoxOpenLog {
  id         BigInt   @id @default(autoincrement())
  campaignId BigInt   // Relasi ke Campaign
  boxId      BigInt   @unique  // Relasi ke Box (one-to-one)
  userId     BigInt   // Relasi ke User
  prizeId    BigInt?  // Relasi ke Prize (nullable jika tidak menang)
  openedAt   DateTime @default(now())
  clientIp   String?  // IP address user
  userAgent  String?  // Browser user agent
  note       String?  // Catatan tambahan
  createdAt  DateTime @default(now())
}
```

#### UserPrize
Hadiah yang dimenangkan user
```prisma
model UserPrize {
  id               BigInt   @id @default(autoincrement())
  userId           BigInt   // Relasi ke User
  campaignId       BigInt   // Relasi ke Campaign
  prizeId          BigInt   // Relasi ke Prize
  userBoxOpenLogId BigInt   @unique  // Relasi ke UserBoxOpenLog
  status           String   // unclaimed/claimed/shipped
  claimReference   String?  // Referensi klaim (contoh: nomor resi)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

#### Achievement
Master data achievement/badge
```prisma
model Achievement {
  id          BigInt   @id @default(autoincrement())
  code        String   @unique  // Kode achievement (contoh: "first_box")
  name        String   // Nama achievement
  description String   // Deskripsi
  icon        String   // Nama icon
  tier        String   // Bronze/Silver/Gold/Platinum
  requirement Int      // Syarat unlock (contoh: 10 boxes)
  createdAt   DateTime @default(now())
}
```

#### UserAchievement
Tracking achievement yang sudah di-unlock user
```prisma
model UserAchievement {
  id            BigInt   @id @default(autoincrement())
  userId        BigInt   // Relasi ke User
  achievementId BigInt   // Relasi ke Achievement
  unlockedAt    DateTime @default(now())
  progress      Int      @default(0)  // Progress saat ini
  
  @@unique([userId, achievementId])  // Satu user hanya unlock satu kali
}
```

### Relasi Antar Model

```
User ─┬─ UserCouponBalance ─── Campaign
      ├─ UserBoxOpenLog ────┬─── Box
      ├─ UserPrize ─────────┼─── Prize
      └─ UserAchievement ───┤
                            └─── Achievement

Campaign ─┬─ Box
          └─ Prize
```

---

## API Endpoints

### Authentication

#### User Login
```
POST /api/v1/auth/login
Content-Type: application/json

Request Body:
{
  "storeCode": "TKO001",
  "password": "password123"
}

Response (Success):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "name": "Toko Maju Jaya",
    "storeCode": "TKO001"
  },
  "activeCampaignId": "1"
}
```

#### Admin Login
```
POST /api/v1/admin/login
Content-Type: application/json

Request Body:
{
  "email": "admin@example.com",
  "password": "admin123"
}

Response (Success):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "1",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "super_admin"
  }
}
```

### Campaign (User)

#### Get Campaign Details
```
GET /api/v1/campaigns/:campaignId
Headers:
  Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Campaign Ramadan 2024",
    "description": "...",
    "startDate": "2024-03-01T00:00:00.000Z",
    "endDate": "2024-04-30T23:59:59.000Z",
    "isActive": true
  }
}
```

#### Get User Statistics
```
GET /api/v1/campaigns/:campaignId/stats
Headers:
  Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "couponBalance": 50,
    "boxesOpened": 25,
    "prizesWon": 20,
    "achievements": [...]
  }
}
```

#### Get Boxes (Paginated by Room)
```
GET /api/v1/campaigns/:campaignId/boxes?page=1
Headers:
  Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "boxes": [
      {
        "id": "1",
        "name": "Box 1",
        "status": "available",
        "imageUrl": null
      },
      {
        "id": "2",
        "name": "Box 2",
        "status": "opened",
        "openedBy": "1",
        "openedByName": "Toko Maju Jaya"
      },
      ...
    ],
    "pagination": {
      "page": 1,
      "totalPages": 100,
      "totalBoxes": 10000
    }
  }
}
```

#### Open Box
```
POST /api/v1/campaigns/:campaignId/boxes/:boxId/open
Headers:
  Authorization: Bearer <token>

Response (Success):
{
  "success": true,
  "message": "Box opened successfully!",
  "data": {
    "prize": {
      "id": "5",
      "name": "Voucher Belanja 100K",
      "tier": "Rare",
      "type": "Voucher",
      "imageUrl": "/uploads/prizes/voucher-100k.png"
    },
    "userPrize": {
      "id": "123",
      "status": "unclaimed"
    },
    "newBalance": 49,
    "unlockedAchievements": [...]
  }
}

Response (Error - No Coupon):
{
  "success": false,
  "message": "Insufficient coupon balance"
}

Response (Error - Box Already Opened):
{
  "success": false,
  "message": "This box has already been opened"
}
```

#### Get My Prizes
```
GET /api/v1/campaigns/:campaignId/my-prizes
Headers:
  Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "123",
      "prize": {
        "name": "Voucher Belanja 100K",
        "tier": "Rare",
        "imageUrl": "/uploads/prizes/voucher-100k.png"
      },
      "wonAt": "2024-03-15T10:30:00.000Z",
      "status": "unclaimed"
    },
    ...
  ]
}
```

### Admin - Campaign Management

#### Get All Campaigns
```
GET /api/v1/admin/campaigns
Headers:
  Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Campaign Ramadan 2024",
      "startDate": "2024-03-01T00:00:00.000Z",
      "endDate": "2024-04-30T23:59:59.000Z",
      "isActive": true,
      "boxCount": 10000,
      "prizeCount": 50
    },
    ...
  ]
}
```

#### Create Campaign
```
POST /api/v1/admin/campaigns
Headers:
  Authorization: Bearer <admin-token>
Content-Type: application/json

Request Body:
{
  "name": "Campaign Lebaran 2024",
  "description": "Kampanye spesial Lebaran",
  "startDate": "2024-04-01T00:00:00.000Z",
  "endDate": "2024-04-30T23:59:59.000Z",
  "minPurchasePerCoupon": 100000,
  "roomSize": 100,
  "maxCouponsPerUser": 1000
}

Response:
{
  "success": true,
  "data": {
    "id": "2",
    "name": "Campaign Lebaran 2024",
    ...
  }
}
```

#### Generate Boxes
```
POST /api/v1/admin/campaigns/:campaignId/boxes/generate
Headers:
  Authorization: Bearer <admin-token>
Content-Type: application/json

Request Body:
{
  "count": 10000
}

Response:
{
  "success": true,
  "message": "Successfully generated 10000 boxes",
  "data": {
    "count": 10000
  }
}
```

#### Add Prize
```
POST /api/v1/admin/campaigns/:campaignId/prizes
Headers:
  Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Form Data:
  name: "Voucher Belanja 100K"
  description: "Voucher belanja senilai 100 ribu rupiah"
  tier: "Rare"
  type: "Voucher"
  baseProbability: 0.30
  stockTotal: 1000
  image: <file>

Response:
{
  "success": true,
  "data": {
    "id": "5",
    "name": "Voucher Belanja 100K",
    "imageUrl": "/uploads/prizes/1234567890-voucher.png",
    "stockRemaining": 1000,
    ...
  }
}
```

### Admin - User Management

#### Create User
```
POST /api/v1/admin/users
Headers:
  Authorization: Bearer <admin-token>
Content-Type: application/json

Request Body:
{
  "name": "Toko Berkah",
  "storeCode": "TKO002",
  "password": "password123",
  "phone": "081234567890",
  "campaignId": "1",
  "initialCoupons": 100
}

Response:
{
  "success": true,
  "data": {
    "id": "2",
    "name": "Toko Berkah",
    "storeCode": "TKO002",
    "couponBalance": 100
  }
}
```

#### Bulk Import Users
```
POST /api/v1/admin/users/import
Headers:
  Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Form Data:
  file: <csv-file>
  campaignId: "1"

CSV Format:
name,storeCode,password,phone,initialCoupons
Toko A,TKO003,pass123,081111111111,50
Toko B,TKO004,pass123,081222222222,50

Response:
{
  "success": true,
  "data": {
    "successCount": 2,
    "failedCount": 0,
    "errors": []
  }
}
```

#### Export Winners Report
```
GET /api/v1/admin/reports/export-winners?campaignId=1
Headers:
  Authorization: Bearer <admin-token>

Response:
Content-Type: text/csv
Content-Disposition: attachment; filename="winners-report.csv"

CSV Content:
User Name,Store Code,Prize Name,Prize Tier,Won At,Status
Toko Maju Jaya,TKO001,Voucher 100K,Rare,2024-03-15 10:30:00,unclaimed
...
```

---

## Troubleshooting

### Backend Tidak Bisa Start

**Error: "Cannot find module '@prisma/client'"**
```bash
# Solusi: Generate Prisma Client
cd backend
npx prisma generate
```

**Error: "Connection refused" atau "Database connection error"**
```bash
# Solusi:
# 1. Pastikan PostgreSQL sudah running
# 2. Cek DATABASE_URL di .env sudah benar
# 3. Test koneksi database:
npx prisma db push
```

**Error: "Port 5000 already in use"**
```bash
# Solusi:
# 1. Ganti PORT di .env
# 2. Atau kill process yang menggunakan port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Tidak Bisa Start

**Error: "Failed to fetch" atau "Network Error"**
```bash
# Solusi:
# 1. Pastikan backend sudah running
# 2. Cek VITE_API_URL di .env sudah benar
# 3. Cek CORS di backend sudah enabled
```

**Error: "Module not found"**
```bash
# Solusi: Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
```

### Login Tidak Berhasil

**User Login:**
- Pastikan storeCode dan password benar
- Cek apakah user sudah dibuat di database
- Cek apakah user status = "active"

**Admin Login:**
- Pastikan email dan password benar
- Cek apakah admin sudah ada di database (via seeding)

### Box Tidak Bisa Dibuka

**Error: "Insufficient coupon balance"**
- User tidak punya kupon
- Solusi: Admin tambahkan kupon via Update User

**Error: "Box already opened"**
- Box sudah dibuka sebelumnya
- Solusi: Pilih box lain yang masih available

**Error: "Campaign not active"**
- Campaign sudah expired atau belum dimulai
- Solusi: Admin update campaign dates

### Database Issues

**Reset Database (Hati-hati: Akan menghapus semua data)**
```bash
cd backend
npx prisma migrate reset
npm run seed
```

**View Database dengan Prisma Studio**
```bash
cd backend
npx prisma studio
```
Buka browser di `http://localhost:5555`

### Performance Issues

**Backend lambat saat generate boxes:**
- Normal untuk generate ribuan boxes
- Tunggu hingga proses selesai
- Jangan refresh page

**Frontend lambat saat render banyak boxes:**
- Normal untuk render 100 boxes sekaligus
- Sudah dioptimasi dengan pagination per room

---

## Tips untuk Pemula

### Memahami Flow Aplikasi
1. **Mulai dari User Flow**: Login → Dashboard → Pilih Room → Buka Box → Lihat Prize
2. **Lalu Admin Flow**: Login → Create Campaign → Generate Boxes → Add Prizes → Create Users
3. **Pahami Database Schema**: Lihat relasi antar tabel di Prisma Studio

### Debugging
1. **Cek Console Browser**: Tekan F12 untuk lihat error di frontend
2. **Cek Terminal Backend**: Lihat log request dan error
3. **Gunakan Prisma Studio**: Visual database explorer untuk cek data

### Modifikasi Kode
1. **Frontend**: Edit file di `frontend/src/pages/` atau `frontend/src/components/`
2. **Backend**: Edit file di `backend/src/controllers/` atau `backend/src/services/`
3. **Database**: Edit `backend/prisma/schema.prisma` lalu jalankan `npx prisma migrate dev`

### Testing
1. **Manual Testing**: Gunakan aplikasi seperti user biasa
2. **API Testing**: Gunakan Postman atau Thunder Client
3. **Verification Scripts**: Jalankan `node verify-*.js` di folder backend

---

## Kontak dan Support

Jika Anda menemukan bug atau butuh bantuan:
1. Cek bagian Troubleshooting di atas
2. Lihat error message di console/terminal
3. Cek dokumentasi Prisma: https://www.prisma.io/docs
4. Cek dokumentasi React: https://react.dev

---

## Lisensi

Proyek ini adalah milik pribadi. All rights reserved.

---

**Selamat menggunakan Mystery Box Campaign Application!**
