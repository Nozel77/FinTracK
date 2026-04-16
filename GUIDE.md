# GUIDE Penggunaan FinTracK Dashboard

Selamat datang di **FinTracK Dashboard** 👋  
Dokumen ini berisi daftar fitur dan petunjuk penggunaan aplikasi secara praktis.

---

## 1. Tentang Aplikasi

**FinTracK Dashboard** adalah aplikasi manajemen keuangan untuk membantu Anda:

- memantau kondisi keuangan harian,
- mencatat pemasukan/pengeluaran,
- mengatur target finansial,
- serta mengekspor data laporan.

Aplikasi terhubung ke Supabase untuk penyimpanan dan pemrosesan data.

---

## 2. Daftar Fitur

### 2.1 Dashboard (`/`)
- Menampilkan ringkasan keuangan utama.
- Menyajikan snapshot data: saldo, tren, dan komponen pengeluaran.
- Cocok untuk melihat kondisi finansial secara cepat.

### 2.2 Wallet (`/wallet`)
- **Add Funds**: menambahkan dana ke akun.
- **Transfer**: memindahkan dana antar akun.
- Digunakan untuk mengelola saldo dompet/rekening internal.

### 2.3 Transactions (`/transactions`)
- Menambah transaksi baru dengan kategori:
  - `income` (pemasukan),
  - `expense` (pengeluaran),
  - `transfer` (perpindahan dana).
- Membantu menjaga catatan transaksi tetap rapi.

### 2.4 Goals (`/goals`)
- **Create Goal**: membuat target keuangan.
- **Adjust Plan**: menyesuaikan strategi (nominal terkumpul, target, deadline, dll).
- Cocok untuk target tabungan atau tujuan finansial tertentu.

### 2.5 Analytics (`/analytics`)
- Ekspor data laporan ke format:
  - `JSON`
  - `CSV`
- Memudahkan analisis lanjutan atau kebutuhan pelaporan.

### 2.6 Settings (`/settings`)
- Simpan preferensi dan pengaturan profil.
- Reset sesi/login jika diperlukan.

---

## 3. Cara Menjalankan Aplikasi (Developer/Local)

> Bagian ini diperlukan jika Anda ingin menjalankan aplikasi di komputer lokal.

### 3.1 Install dependency
```bash
npm install
```

### 3.2 Buat environment file
Buat file `.env.local` di root project, lalu isi:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
DASHBOARD_DEFAULT_USER_ID=11111111-1111-1111-1111-111111111111
```

Opsional (khusus proses server/admin):
```env
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

### 3.3 Setup database Supabase
- Jalankan script SQL:
  - `supabase/schema.sql`
- Script ini membuat tabel, enum, trigger, policy, sekaligus seed data demo.

### 3.4 Jalankan aplikasi
```bash
npm run dev
```

Akses di browser:
- `http://localhost:3000`

---

## 4. Petunjuk Penggunaan Harian

### Langkah cepat untuk pengguna
1. Buka **Dashboard** untuk melihat kondisi finansial terkini.
2. Masuk ke **Wallet** jika ingin menambah dana atau transfer.
3. Catat transaksi baru di **Transactions** (income/expense/transfer).
4. Atur target di **Goals**, lalu update progres secara berkala.
5. Gunakan **Analytics** untuk ekspor data jika perlu laporan.
6. Kelola preferensi di **Settings**.

---

## 5. Panduan Input Agar Tidak Error

- Gunakan format tanggal `YYYY-MM-DD` saat memilih rentang tanggal.
- Pastikan field wajib diisi untuk setiap aksi.
- Untuk transaksi, nilai `direction` harus salah satu:
  - `income`
  - `expense`
  - `transfer`

---

## 6. Cara Sistem Menentukan User ID

Aplikasi menentukan user ID berdasarkan urutan berikut:

1. `requestedUserId` dari payload/query
2. Header `x-dashboard-user-id`
3. Query param `userId`
4. Fallback dari env `DASHBOARD_DEFAULT_USER_ID`

Jika tidak ada user ID valid, proses request akan gagal.

---

## 7. Troubleshooting

### Data tidak muncul
- Pastikan `supabase/schema.sql` sudah dijalankan.
- Cek `DASHBOARD_DEFAULT_USER_ID` sesuai data yang tersedia.

### Muncul error 400 saat submit aksi
- Periksa kembali field wajib.
- Pastikan format tanggal valid.

### Env sudah benar tapi tetap bermasalah
- Restart development server setelah mengubah `.env.local`.

---

## 8. Catatan Keamanan

- Jangan expose `SUPABASE_SERVICE_ROLE_KEY` ke client/browser.
- Simpan key sensitif hanya di sisi server.

---

Jika Anda ingin, dokumen ini bisa dikembangkan lagi menjadi:
- **Guide untuk End User non-teknis** (lebih visual dan step-by-step),
- **Guide API untuk Developer** (detail request/response per endpoint).