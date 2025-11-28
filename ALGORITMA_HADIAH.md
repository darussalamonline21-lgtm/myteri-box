# Algoritma Hadiah (Versi Mudah Dimengerti)

## Penjelasan Sederhana (Bahasa Santai)
- Ada banyak box. Beberapa box sudah ditempeli hadiah sejak awal (pre-assign), sisanya belum.
- Kalau box sudah ditempeli hadiah, begitu dibuka langsung dapat hadiah itu (asal stoknya belum 0 dan hadiah masih aktif).
- Kalau box belum ditempeli hadiah, barulah sistem melakukan undian:
  1. Cek apakah akan keluar hadiah Tier S atau tidak, berdasarkan stok S dan kupon yang tersisa (peluang = stok S / kupon tersisa, dibatasi max 1).
  2. Kalau iya, pilih hadiah S mana yang keluar pakai bobot `baseProbability`.
  3. Kalau tidak, pilih hadiah non-S (A/B/C/poin) pakai bobot `baseProbability`.
- Bobot `baseProbability` bukan persen, hanya pembanding. Bisa diisi angka apa saja (mis. 1, 2, 10, 74).
- Admin sekarang isi `Base Probability` dalam persen di UI; backend otomatis menyimpannya sebagai bobot 0–1.
- Room terbuka bertahap, tapi tidak mengubah undian hadiah; hanya menentukan box mana yang bisa diklik.
- Ada endpoint admin untuk acak ulang hadiah ke box yang masih available (reassign) kalau mau mengubah isi box di tengah jalan.

## Ringkas Flow User
1. User punya kupon (1 kupon = 1 klik box).
2. Klik box yang masih available di room terbuka.
3. Kalau box punya `prizeId` → langsung dapat hadiah itu.
4. Kalau box belum punya `prizeId` → undian probabilitas seperti di atas.
5. Stok hadiah berkurang, kupon user berkurang 1, riwayat tercatat.

---

## Penjelasan Teknis (Untuk Developer)

### Model & Migrasi
- `Box` kini punya kolom opsional `prizeId` (FK ke `Prize`).
- Relasi di Prisma: `Box.prize`, `Prize.boxes`.
- Pastikan DB sudah dimigrasi (`prisma migrate deploy`).

### Pre-assign Hadiah ke Box
- Fungsi helper `assignPrizesToEmptyBoxes` (adminController):
  - Ambil hadiah aktif dengan `stockRemaining > 0`.
  - Buat `prizePool` (ulang-id hadiah sesuai stok).
  - Shuffle dengan `crypto.randomInt` (Fisher–Yates).
  - Isi `prizeId` ke box yang `prizeId = null` (status available).
- Dipanggil otomatis setelah generate box (`POST /admin/campaigns/:id/boxes/generate`).
- Endpoint khusus reassign: `POST /admin/campaigns/:id/boxes/reassign` → kosongkan `prizeId` pada box available, lalu assign ulang.

### Algoritma Open Box (boxService)
1. Ambil box + relasi prize.
2. Jika `box.prizeId` ada:
   - Pastikan hadiah aktif & stokRemaining > 0, decrement stok, tandai box opened, kurangi kupon user, log & simpan userPrize.
3. Jika `box.prizeId` kosong:
   - Ambil semua hadiah aktif `stockRemaining > 0`.
   - Pisahkan Tier S vs non-S.
   - Hitung `remainingOpens = totalEarnedAll - totalUsedAll`.
   - `p = min(1, remainingMain / remainingOpens)` untuk memutuskan cabang S.
   - Cabang S: `pickByWeight(mainPrizes)` pakai `baseProbability` sebagai bobot.
   - Cabang non-S: `pickByWeight(otherPrizes)` (atau all jika hanya itu).
   - Decrement stok hadiah terpilih, tandai box opened, kurangi kupon user, log & simpan userPrize.

### Base Probability
- Disimpan di DB sebagai Decimal bobot (bukan persen).
- Admin mengisi lewat UI dalam persen; dikonversi ke bobot dengan `value / 100` saat kirim ke backend.
- Tampil di tabel admin sebagai persen `(baseProbability * 100).toFixed(2)%`.
- Perhitungan `pickByWeight` hanya memakai rasio bobot; skala bebas.

### Room Unlock
- Room muncul bertahap (mis. room berikutnya setelah 50 box dibuka di room sebelumnya).
- Tidak mempengaruhi undian hadiah; hanya gating box mana yang bisa diklik.

### Endpoint Penting
- Generate box: `POST /admin/campaigns/:id/boxes/generate` (otomatis pre-assign).
- Reassign hadiah ke box available: `POST /admin/campaigns/:id/boxes/reassign`.
- Open box user: `POST /boxes/:id/open` (cek `prizeId` dulu, lalu fallback undian).

### Catatan Risiko/Perilaku
- Pre-assign: hadiah besar bisa habis di awal atau sisa di akhir; itu desain “siapa beruntung, dapat”. Box available bisa diacak ulang via reassign jika diperlukan.
- Undian fallback (tanpa `prizeId`): peluang Tier S sensitif terhadap rasio stok S vs kupon tersisa. Kupon masuk bertahap → peluang bisa berubah seiring waktu.
- Pastikan tidak bocorkan mapping `boxId → prizeId` ke client (hanya status box open/available dikirim).
