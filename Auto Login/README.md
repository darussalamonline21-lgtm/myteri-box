**Magic Link Auto-Login Plan**

### Tujuan
Auto-login via link unik per user tanpa membagikan username/password; menampilkan coupon balance yang tepat.

### Arsitektur Singkat
- Backend Web (yang sekarang): validasi token magic, buat sesi/JWT, tampilkan saldo kupon.
- Backend App (mobile) (placeholder): menyimpan FCM/APNS token per user dan mengirim push/link.
- Kanal distribusi: push FCM/APNS, email, atau WA terverifikasi.

### Flow End-to-End
1) App/user minta link login  
   - Backend app (placeholder) panggil `POST /api/v1/auth/magic-link` di Backend Web dengan `userId`/`storeCode` (plus optional `deviceId`).  
   - Backend Web membuat JWT magic: payload `sub=userId`, `exp` singkat (10–30m), `jti` unik, optional `deviceId`; simpan `jti` ke DB (status pending). Kembalikan URL `https://domain.com/auth/magic?token=...`.
2) Distribusi link  
   - Backend app kirim URL ke FCM/APNS token yang sudah terikat ke user itu (atau email/WA pribadi). **Placeholder**: API dan logika push berada di backend app.
3) User klik link  
   - App buka browser/WebView ke `/auth/magic?token=...`.
4) Validasi & login di Backend Web  
   - Endpoint `GET /api/v1/auth/magic` memverifikasi signature JWT, `exp`, `jti` belum used/revoked, `deviceId` jika dipakai.  
   - Jika valid: tandai `jti` used, buat JWT akses biasa (seperti login password) + tentukan `activeCampaignId` (ambil dari `userCouponBalance` terbaru). Balas JSON atau redirect dengan sesi/cookie.  
   - Jika invalid/expired: balas error + ajakan minta link baru.
5) Sesi berjalan  
   - Frontend menyimpan token seperti alur login sekarang; dashboard menampilkan coupon balance user yang tepat.

### API Backend Web (baru yang dibutuhkan)
- `POST /api/v1/auth/magic-link`  
  - Auth: internal (dipanggil backend app/admin saja).  
  - Body: `userId` atau `storeCode`, optional `deviceId`.  
  - Output: `{ url: "https://domain.com/auth/magic?token=...", expiresAt }`.  
- `GET /api/v1/auth/magic`  
  - Query: `token`.  
  - Aksi: verifikasi token, cek `jti`, login user, tandai used, balas `{ token, activeCampaignId }` atau set cookie lalu redirect.  
- Opsional:  
  - `POST /api/v1/auth/magic/revoke` (blacklist `jti`).  
  - `POST /api/v1/auth/magic/refresh` (jika mau refresh khusus setelah magic login).

### API Backend App (placeholder)
- `POST /devices/register` (simpan FCM/APNS token per user).  
- `POST /devices/unregister` (hapus/disable token).  
- Logic push: pilih token milik user, kirim URL magic link.  
*(Implementasi dan path disesuaikan backend app; ini hanya placeholder.)*

### API Backend Web yang sudah ada (relevan)
- `POST /api/v1/auth/login` — login pakai storeCode+password, kembalikan JWT + `activeCampaignId`.  
- Routes lain terpasang: `/api/v1/campaigns`, `/api/v1/boxes`, `/admin/api` (detail sesuai masing-masing route file). SPA served via `sirv` dengan fallback produksi.

### Komponen Teknis yang Perlu Disiapkan
- Tabel/entri DB `magic_tokens` (userId, jti, expiresAt, usedAt, deviceId optional, status).  
- Secret JWT (pakai `JWT_SECRET` yang sama), helper untuk sign/verify magic token.  
- Middleware rate-limit untuk generate link per user.  
- Frontend route `/auth/magic`: ambil `token` dari query, call `GET /api/v1/auth/magic`, simpan JWT/activeCampaignId, redirect dashboard; tampilkan error jika expired.  
- Logging & keamanan: HTTPS, expiry singkat, single-use `jti`, revoke support, audit log (userId, IP, UA).  
- Opsional binding device: validasi `deviceId` jika dipakai saat generate. 
