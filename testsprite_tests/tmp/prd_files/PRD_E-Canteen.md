# PRD: E-Canteen (Sistem Pre-Order Kantin Sekolah)

**Versi:** 1.0.0
**Tanggal:** 3 Maret 2026

## Ringkasan Produk

E-Canteen adalah aplikasi web responsif berbasis _mobile-first_ yang dirancang untuk mengatasi masalah antrean panjang di kantin sekolah pada jam istirahat. Sistem ini memungkinkan siswa dan guru untuk melakukan _pre-order_ makanan dan minuman dari kelas menggunakan sistem saldo virtual, serta memilih waktu pengambilan (Istirahat 1 atau Istirahat 2). Bagi pihak kantin (admin/penjual), sistem ini membantu manajemen antrean pesanan yang lebih terprediksi dan terstruktur, serta pencatatan pendapatan harian.

## Tujuan & KPI

- **Tujuan Utama:** Mengurangi penumpukan antrean fisik di kantin saat jam istirahat.
- **Tujuan Sekunder:** Memudahkan pihak kantin memprediksi jumlah makanan yang harus disiapkan.
- **KPI MVD (Minimum Viable Product):**
  - Mengurangi waktu tunggu antrean fisik siswa hingga 50%.
  - 80% dari total pesanan harian beralih menggunakan sistem _pre-order_ E-Canteen.
  - Waktu respons aplikasi (_load time_) di bawah 2 detik untuk pengalaman pemesanan yang mulus.

## Persona & Use Case

1. **Siswa (Pengguna Utama) - Arya (16 Tahun):**
   - _Use Case:_ Duduk di kelas 10 menit sebelum bel istirahat, membuka E-Canteen di ponsel, melihat menu yang masih tersedia, memesan paket nasi ayam, membayarnya dengan saldo virtual, dan mengambilnya langsung di kantin tanpa mengantre panjang.
2. **Guru - Bu Siti (40 Tahun):**
   - _Use Case:_ Memesan kopi dan roti dari ruang guru untuk diambil pada Istirahat 2, agar waktu istirahat yang singkat tidak habis untuk mengantre.
3. **Penjual/Admin Kantin (Tenant) - Pak Budi (45 Tahun):**
   - _Use Case:_ Mengelola stok menu stan miliknya (menandai "Habis" jika sudah kosong), melihat daftar pesanan (_order queue_) yang harus segera disiapkan sebelum bel istirahat berbunyi, dan mengecek total pendapatan stan hari ini.
4. **Super Admin (Pengelola Kantin Utama):**
   - _Use Case:_ Memantau seluruh sistem, melihat semua transaksi dari semua kantin, menambah akun Admin/Tenant baru, dan melihat laporan akumulatif seluruh kantin tanpa batasan akses.

## User Journey

1. **Top-up Saldo:** User melakukan top-up fisik di kasir kantin/tata usaha, atau bisa langsung top-up secara online melalui web menggunakan _payment gateway_ (Midtrans).
2. **Pemesanan:** User login > Lihat Menu (Home) > Pilih makanan (Add to Cart) > Buka Keranjang > Konfirmasi pesanan, input **Catatan** (misal: "bang sambelnya banyakin"), & Pilih waktu pengambilan (Checkout) > Pilih metode pembayaran (Saldo atau Midtrans langsung) > Bayar.
3. **Persiapan:** Admin masing-masing stan/tenant melihat _dashboard_ antrean pesanannya > Mempersiapkan menu > Mengubah status pesanan menjadi "Siap Diambil".
4. **Pengambilan:** User datang ke kantin pada jam istirahat > Menunjukkan status "Siap Diambil" di HP > Mengambil makanan > Selesai.

## Ruang Lingkup Fitur

### Fitur User (Siswa/Guru)

- **Katalog Menu:** Daftar menu makanan/minuman dengan foto, harga, ketersediaan, dan dikelompokkan per stan/tenant.
- **Keranjang (Cart) & Checkout:** Menambahkan _item_, memberi **catatan pesanan** (contoh: "ekstra sambal"), dan memilih waktu pengambilan (Istirahat 1/2).
- **Pembayaran Saldo & Midtrans:** Sistem top-up via web/fisik, atau bisa bayar langsung pada saat _checkout_ pesanan melalui integrasi Midtrans.
- **Live Status Pesanan:** Linimasa status (Sedang Disiapkan → Siap Diambil → Selesai).
- **Riwayat Pesanan:** Daftar transaksi sebelumnya beserta struk digital ringkas.

### Fitur Admin (Penjual/Stan)

- **Manajemen Menu:** Tambah/Edit/Hapus menu miliknya sendiri (Nama, Harga, Foto, Status _Tersedia/Habis_).
- **Antrean Live (Order Queue):** Daftar pesanan spesifik untuk stan mereka, difilter berdasar sesi istirahat.
- **Update Status:** Tombol sekali klik untuk mengubah status pesanan.
- **Laporan Harian:** Rekapitulasi pendapatan dan produk terjual (hari ini) tiap stan.
- **Prediksi Stok:** Memberi notifikasi atau data mengenai barang yang perlu di-_restock_ berbasis jumlah pesanan harian.

### Fitur Super Admin (God Mode)

- **Manajemen Semua Data:** Memiliki akses tanpa batas untuk melihat, mengedit, atau menghapus data apa pun (User, Tenant, Menu, Order).
- **Manajemen Multi-Tenant:** Menambah atau menghapus stan/tenant baru beserta akun Admin-nya.
- **Laporan Global:** Melihat total keseluruhan pendapatan, volume transaksi, dan kinerja seluruh stan dalam satu _dashboard_.

### Out of Scope (Tidak Masuk Scope Saat Ini)

- Fitur _Delivery_ (Hanya pengambilan mandiri/_pick-up_).
- Chatting antara siswa dan penjual.

## Kebutuhan Fungsional

1. **User Story 1: Pre-Order Menu & Catatan**
   - _Sebagai_ User, _saya ingin_ memesan makanan dari _stan_ yang berbeda sebelum bel istirahat _agar_ saya tidak mengantre, dan menaruh pesan "tolong tambahin sambal".
   - _Acceptance Criteria (AC):_ Keranjang (_cart_) dapat menyimpan _notes_, User bisa memilih pembayaran dari metode "Pilih Midtrans" atau "Potong Saldo".
2. **User Story 2: Pemantauan Antrean Tenant**
   - _Sebagai_ Admin/Pemilik Stan, _saya ingin_ melihat urutan pesanan spesifik milik stan saya _agar_ saya tidak tercampur aduk dengan pesanan stan lain.
   - _AC:_ Filter pesanan real-time berbasis `tenantId`, list dibagi tab Istirahat 1 & 2.
3. **User Story 3: Manajemen Ketersediaan**
   - _Sebagai_ Admin, _saya ingin_ mematikan status menu _agar_ tidak ada user yang memesan menu yang sudah habis.
   - _AC:_ Terdapat _switch toggle_ "Tersedia/Habis" pada kartu menu di admin panel.

## Kebutuhan Non-Fungsional

- **Performance:** Rendering sisi server menggunakan SSR via Next.js 16 (_App Router_) agar ringan di perangkat spesifikasi rendah.
- **Payment & Security:** Integrasi `Midtrans API` untuk handling snap transaction _callback/webhook_ (bayar langsung/top-up). Enkripsi token & verifikasi di backend menggunakan Next.js `Server Actions`.
- **Data Integrity:** Penggunaan `Prisma Transactions` saat pendaftaran _Order_ dan pengurangan _Balance_ agar terhindar dari _race condition_ atau _double spending_.

## Informasi Data (Prisma Entities)

1. **User:** `id`, `name`, `email`, `password`, `role` (SUPER_ADMIN/ADMIN/USER), `balance`.
2. **Tenant (Stan):** `id`, `name`, `adminId` (Relasi ke User ber-role ADMIN).
3. **Menu:** `id`, `tenantId`, `name`, `price`, `photoUrl`, `isAvailable`.
4. **Order:** `id`, `userId`, `tenantId`, `totalAmount`, `pickupTime` (BREAK_1/BREAK_2), `paymentMethod` (MIDTRANS/BALANCE), `status` (PENDING/PREPARING/READY/COMPLETED/CANCELLED), `notes`, `createdAt`.
5. **OrderItem:** `id`, `orderId`, `menuId`, `quantity`, `price` (harga _snapshot_).

## Peran & Hak Akses (RBAC)

- **Role USER:** Hanya bisa mengakses `/menu`, `/cart`, `/orders`, `/profile`.
- **Role ADMIN (Tenant):** Mengakses data pesanan, laporan, dan menu yang hanya terkait dengan `tenantId` miliknya.
- **Role SUPER_ADMIN:** Akses ke seluruh sistem (God Mode), bisa memodifikasi atau melihat log semua Tenant dan seluruh _User_.

## Halaman & Navigasi

- **Global:**
  - `Footer Web`: Harus memuat atribusi _Watermark_ di seluruh _layout_: "Dibuat oleh [Muhammad Faiz Hidayat](https://github.com/faiz-hidayat)" di mana tautannya mengarah ke profil GitHub tersebut.

- **User:**
  - `/ (Home / Katalog)`: Tampilan _bento grid_ menu yang dikelompokkan per tenant, _search bar_, tab kategori.
  - `/cart`: _Drawer_ (tarik dari kanan/bawah) berisi _item_ pesanan dan _textarea_ untuk menyertakan **catatan**.
  - `/orders`: Linimasa status pesanan (_timeline_) & Riwayat transaksi.
  - `/profile`: Menampilkan saldo virtual (top-up _button_ Midtrans), beserta histori top-up/saldo.
- **Admin (Tenant):**
  - `/admin/queue`: Papan Kanban / _List view_ untuk order masuk khusus pada _stan_ mereka "Sedang Disiapkan" & "Siap Diambil".
  - `/admin/menus`: Tabel data / _Grid card_ CRUD menu khusus tenant tersebut.
  - `/admin/reports`: _Dashboard_ metrik, termasuk prediksi / warning menu dengan stok/_demand_ tinggi.
- **Super Admin:**
  - `/super-admin`: _Overview dashboard_ yang merangkum keseluruhan sistem.
  - `/super-admin/tenants`: Manajemen tenant (tambah/hapus stan & akun admin penjual).
  - `/super-admin/users`: Melihat dan mengelola seluruh akun *(user management)* termasuk cek saldo.
  - `/super-admin/all-orders`: Akses membaca semua pesanan lintas-tenant.

## Empty State / Error State / Loading State

- **Empty State:**
  - Keranjang kosong: Tampilan ilustrasi piring kosong, teks "Belum ada makanan yang dipilih".
  - Riwayat pesanan: Teks "Kamu belum pernah ngantin bareng kami, yuk pesan!".
- **Error State:**
  - Saldo kurang: Pesan _dialog box_ merah, "Oops, saldo kamu nggak cukup nih!".
  - Gagal fetch data: _Toast/Alert_ "Duh, koneksi ke kantin putus. Coba _refresh_ ya."
- **Loading State:** Penggunaan _Skeleton UI_ untuk gambar makanan dan nominal daftar harga/saldo.

## Rencana Iterasi

- **MVP (Bulan 1):** Sistem per-stan (multi-tenant) dasar, katalog, _add to cart_ + notes, Midtrans (direct payment + topup saldo), ganti status.
- **v1.1 (Bulan 2):** Sistem prediksi stok (_demand forecast_), laporan analitik canggih (hari apa, menu apa yang laris), notifikasi riwayat transaksi lengkap.
- **v2 (Masa depan):** Notifikasi _push/web push alert_, fitur scan QR serah terima pesanan.

## Risiko & Mitigasi

- **Risiko:** Siswa menekan _checkout_ berkali-kali secara drastis saat jaringan lambat (_double spending_).
  - _Mitigasi:_ Menggunakan fitur _button loading state_ (nonaktifkan klik kedua) dan _Prisma Transaction_ yang ketat + _optimistic locking_ pada saldo.
- **Risiko:** Siswa salah jadwal pengambilan makanan (pesan untuk Istirahat 1 tapi diambil di Istirahat 2).
  - _Mitigasi:_ Tampilan status dengan warna _badge_ yang mencolok dan instruksi jam _pickup_ di struk.

---

# Arahan Antarmuka & UX (Soft Bento Theme)

## Tech Stack UI/Frontend

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Komponen Core (80%):** shadcn/ui (`Button`, `Dialog`, `Drawer`, `Tabs`, `Table`, `Toast`, `Form`)
- **Komponen Elemen Wow (20%):** Magic UI (_Number Ticker_ untuk saldo, _Marquee_ untuk pengumuman kantin, _Bento Grid_ untuk _showcase_ promo, _Shine effects_ pada tombol checkout utama).

## Visual & Design Tokens

_Vibe: Minimalist, Playful, Pastel Food Aesthetics. Clean whitespace, large rounded cards._

- **Color Palette:**
  - `Primary:` #FFB26B (Pastel Orange/Carrot - mengundang selera)
  - `Secondary:` #FFF8DC (Cornsilk - latar hangat)
  - `Accent:` #93C572 (Pistachio Green - untuk status "Tersedia/Siap")
  - `Background:` #FAFAFA (Off-white bersih)
  - `Surface:` #FFFFFF (Putih solid untuk kartu)
  - `Text:` #333333 (Dark Gray untuk pembacaan nyaman)
  - `Muted:` #A3A3A3 (Abu-abu untuk _placeholder_ atau status nonaktif)
  - `Destructive:` #FF6961 (Pastel Red - untuk error/saldo kurang)
- **Radius Scale:** `sm: 12px`, `md: 16px`, `lg: 24px`, `xl: 32px` (Soft Bento).
- **Shadow Scale:**
  - `Soft:` `0 4px 20px rgba(0,0,0,0.04)` (Digunakan untuk _card_ reguler).
  - `Medium:` `0 8px 30px rgba(255,178,107,0.15)` (Digunakan untuk _primary button_).
- **Typography:** Rounded/Friendly sans-serif (misal: _Nunito_, _Quicksand_, atau _Geist_ default dengan rounded styling).
  - `Heading:` Bold, ukuran besar.
  - `Body:` Medium, legibility tinggi di mobile.
- **Motion Tokens:**
  - `Duration:` Fast `150ms`, Normal `250ms`, Slow `400ms`.
  - `Easing:` _Bouncy spring_ atau _Ease-out_ halus `[0.32, 0.72, 0, 1]`.

## Panduan Implementasi Komponen & Interaksi

1. **Menu Cards (Soft Bento):**
   - _Layout:_ Gambar foto makanan di atas mengisi 60% card, di bawah informasi teks + tombol _Add_.
   - _Micro-interaction:_ Saat di-_hover_ (atau tap layar), kartu sedikit membesar (`scale-102`) dan _shadow_ naik ke posisi `Medium`.
2. **Wallet / Saldo Card:**
   - Gunakan komponen **Magic UI Number Ticker** ketika saldo berubah atau saat halaman pertama kali di-_load_ agar memberikan kesan interaktif ("Saldo kamu: _counting up..._ Rp 50.000").
3. **Cart Drawer:**
   - Jangan gunakan navigasi halaman baru. Gunakan `Drawer` (shadcn/ui) yang ditarik dari bawah atau samping agar siswa tidak kehilangan konteks katalog menu.
4. **Checkout & Notifikasi:**
   - Setelah menekan tombol "Bayar Sekarang", muncul _toast_ dari shadcn dengan _check icon_ dan dialihkan menggunakan transisi _Framer Motion_ yang meluncur ke halaman Status Pesanan `/orders`.
5. **Dashboard Admin:**
   - Gunakan _Layout Bento Grid_ ringan. Tabel antrean memiliki _badge_ berwarna pastel sesuai status: Kuning untuk _Preparing_, Hijau cerah untuk _Ready_.
   - _Micro-interaction:_ Saat admin mengklik "Siap Diambil", baris pesanan tersebut perlahan memudar kearah bawah layar atau digaris coret (strikethrough delay) dengan animasi _exit_ Framer Motion.
6. **Copywriting Utama:**
   - "Saldo kamu" (bukan "Total Balance").
   - "Masukkan Keranjang" atau icon `+` (bukan "Add to Cart").
   - "Siap Diambil" (bukan "Ready").
   - "Lagi Disiapin" (bukan "Preparing").
   - "Aduh, Menu Habis" (bukan "Out of Stock").
