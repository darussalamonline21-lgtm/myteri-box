# Setting Hadiah & Mekanisme Menang

## Gambaran cepat
- Hadiah dibuat per kampanye dengan **tier** (S = hadiah utama, A/B/C = hadiah hiburan) dan **baseProbability** (bobot pemilihan di dalam tier/gugus).
- Saat box dibuka, backend hanya memilih hadiah yang **aktif** dan **stockRemaining > 0**; kalau kosong langsung error. Ini memastikan tidak ada box berisi “zonk”.
- Algoritma inti (file `backend/src/services/boxService.js`):
  - Pisahkan hadiah utama (tier S) vs hiburan.
  - Hitung peluang dinamis untuk hadiah utama: `p = min(1, remainingMain / remainingOpens)`.
  - Lakukan roll; jika `roll <= p` pilih dari hadiah utama, kalau tidak pilih dari hiburan.
  - Pemilihan di dalam kelompok pakai **weighted random** berdasarkan `baseProbability`.
  - Semua update (stok hadiah, status box, kupon) dibungkus transaksi; kalau stok habis di tengah jalan, operasi gagal dan user diminta coba lagi.

## Analogi mudah
Bayangkan satu toples berisi kelereng warna emas (hadiah utama) dan warna lain (hiburan):
- **remainingMain / remainingOpens** = rasio kelereng emas terhadap jumlah tangan yang masih akan masuk ke toples. Makin banyak kelereng emas tersisa dibanding sisa giliran, makin besar peluang setiap tangan dapat emas.
- **baseProbability** = ukuran kelereng di dalam kelompok warna yang sama; kelereng lebih besar lebih mudah tergenggam dibanding yang kecil, sehingga mengatur komposisi hiburan.

## Aturan praktis saat membuat hadiah
- Tier:
  - Gunakan **S** untuk hadiah utama yang stoknya sangat terbatas dan ingin disebar rata sepanjang kampanye.
  - Gunakan A/B/C untuk hadiah hiburan. Semua hiburan tetap wajib punya stok dan `baseProbability > 0`.
- Probabilitas:
  - Isi `baseProbability` sebagai **bobot relatif**, bukan persen. Contoh: A=40, B=25, C=10 berarti A kira-kira 40/(40+25+10) peluang di kelompok hiburan.
  - Jangan biarkan bobot 0 atau negatif; akan memicu error `PrizeSelectionError`.
- Stok:
  - Semua hadiah harus punya `stockRemaining > 0` saat kampanye jalan; jika seluruh stok habis, pembukaan box akan gagal.
  - Tidak ada hadiah kosong; sistem selalu memilih salah satu hadiah yang stoknya masih ada.
- Perilaku sebar hadiah utama:
  - Probabilitas hadiah utama disesuaikan otomatis dengan stok tersisa dibanding sisa kupon yang bisa dipakai (`remainingOpens`), sehingga hadiah utama tidak langsung ludes di awal.
  - Jika hadiah utama habis, sistem otomatis hanya memakai hiburan.

## Rekomendasi konfigurasi (5 hadiah utama + hiburan, tanpa box kosong)
Asumsi: total kupon/opens yang diperkirakan = **1.000**.

- **Hadiah utama (tier S)**: total 5 unit (mis. 5 item berbeda stok=1 atau 1 item stok=5).
  - `tier`: S
  - `stockTotal/stockRemaining`: 5 (dibagi sesuai variasi barang)
  - `baseProbability`: bagi rata untuk keadilan, contoh tiap hadiah S = 1.
  - Efek: peluang rata-rata awal ~0,5% per buka (5 / 1000), lalu naik saat stok utama tersisa mendekati jumlah buka tersisa.
- **Hadiah hiburan (tier A/B/C)**: pakai bobot untuk membentuk komposisi, contoh:
  - Hiburan A (hadiah medium, stok 100, `baseProbability` 40)
  - Hiburan B (hadiah kecil, stok 300, `baseProbability` 25)
  - Hiburan C1 (voucher/poin kecil, stok 800, `baseProbability` 20)
  - Hiburan C2 (voucher/poin mikro, stok 1500, `baseProbability` 15)
  - Rasio bobot hiburan = 40:25:20:15 → kira-kira 40% : 25% : 20% : 15% distribusi di kelompok hiburan.
- **Tidak ada box kosong**: selama semua entri hadiah aktif dan stoknya > 0, setiap buka akan selalu mengambil salah satu hadiah di atas.
- **Penyesuaian stok**:
  - Pastikan total stok hiburan jauh di atas perkiraan buka (mis. 2–3x dari 1.000) supaya tidak kehabisan sebelum kampanye selesai.
  - Jika stok hiburan menipis, tambahkan stok atau aktifkan hadiah hiburan tambahan dengan bobot positif.

## Catatan operasional
- Pantau metrik `remainingOpens` vs `remainingMain` (tersirat di laporan box/prize) untuk memastikan hadiah utama tersebar; jika terlalu sering keluar, kurangi bobot hadiah S atau tambahkan kupon (menurunkan p).
- Saat menambah hadiah baru di tengah kampanye, set `baseProbability` > 0 dan stok > 0, lalu aktifkan; algoritma langsung memasukkannya ke perhitungan.
- Uji di staging dengan data dummy untuk memastikan tidak ada `PrizeSelectionError` akibat bobot 0 atau stok habis.
- Dokumentasikan asumsi jumlah kupon/opens agar perhitungan `p = remainingMain / remainingOpens` tetap relevan dengan realisasi lapangan.
