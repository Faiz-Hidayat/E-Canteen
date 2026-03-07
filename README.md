# 🍽️ E-Canteen — Kantin 40

Sistem pre-order kantin sekolah berbasis web. Siswa bisa memesan makanan dari HP sebelum istirahat, bayar pakai saldo atau Midtrans, lalu ambil pesanan saat istirahat tanpa antri.

## Fitur Utama

- **Pre-order Menu** — Siswa pilih menu, masukkan keranjang, checkout sebelum bell istirahat.
- **Pembayaran** — Saldo internal (top-up via Midtrans Snap) atau bayar langsung via Midtrans.
- **Antrian Real-time** — Admin stan melihat pesanan masuk dan update status (Pending → Preparing → Ready).
- **Multi-Tenant** — Setiap stan kantin (tenant) punya admin, menu, dan pesanannya sendiri.
- **Super Admin Dashboard** — Kelola semua tenant, user, dan lihat statistik.
- **Notifikasi** — Siswa dapat notifikasi saat pesanan siap diambil.

## Tech Stack

| Layer        | Teknologi                              |
| ------------ | -------------------------------------- |
| Framework    | Next.js 16 (App Router, Turbopack)     |
| UI           | React 19, Tailwind CSS v4, shadcn/ui   |
| Language     | TypeScript (strict mode)               |
| Database     | MySQL + Prisma v6                      |
| Auth         | Auth.js v5 (Credentials, JWT)          |
| Payment      | Midtrans Snap                          |
| Animations   | Framer Motion                          |
| State        | Zustand (cart), Server Actions (data)  |
| Testing      | Vitest + Testing Library + Playwright  |
| Deployment   | Docker (Alpine + standalone output)    |

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **MySQL** 8+ (atau Docker MySQL)

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd E-Canteen
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan:

| Variable                         | Keterangan                       |
| -------------------------------- | -------------------------------- |
| `DATABASE_URL`                   | MySQL connection string          |
| `NEXTAUTH_SECRET`                | Random secret untuk JWT          |
| `NEXTAUTH_URL`                   | URL aplikasi (http://localhost:3000) |
| `AUTH_TRUST_HOST`                | `true` untuk production          |
| `MIDTRANS_SERVER_KEY`            | Server key Midtrans              |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`| Client key Midtrans              |
| `APP_URL`                        | Public URL untuk webhook         |

### 3. Database

```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

### 4. Run

```bash
pnpm dev        # Development (Turbopack)
pnpm build      # Production build
pnpm start      # Production server
```

Buka [http://localhost:3000](http://localhost:3000).

## Akun Seed (Testing)

| Role        | Email                       | Password       | Saldo   |
| ----------- | --------------------------- | -------------- | ------- |
| Super Admin | superadmin@ecanteen.sch.id  | superadmin123  | -       |
| Admin       | buani@ecanteen.sch.id       | admin123       | -       |
| Admin       | pakjoko@ecanteen.sch.id     | admin123       | -       |
| Siswa       | arya@student.sch.id         | student123     | Rp 50k  |
| Siswa       | siti@student.sch.id         | student123     | Rp 75k  |
| Siswa       | budi@student.sch.id         | student123     | Rp 30k  |

> Tenant: **Warung Bu Ani** (admin: Bu Ani), **Kantin Pak Joko** (admin: Pak Joko). Masing-masing 4 menu.

## Routes

| Path                    | Role          | Keterangan                 |
| ----------------------- | ------------- | -------------------------- |
| `/`                     | Public        | Redirect ke `/menu`        |
| `/menu`                 | Authenticated | Katalog menu kantin        |
| `/cart`                 | Authenticated | Keranjang belanja          |
| `/orders`               | Authenticated | Riwayat & status pesanan   |
| `/profile`              | Authenticated | Profil & top-up saldo      |
| `/login`                | Guest         | Halaman login              |
| `/register`             | Guest         | Halaman register           |
| `/admin/queue`          | ADMIN         | Antrian pesanan            |
| `/admin/menus`          | ADMIN         | Kelola menu stan           |
| `/admin/reports`        | ADMIN         | Laporan penjualan          |
| `/super-admin`          | SUPER_ADMIN   | Dashboard statistik        |
| `/super-admin/tenants`  | SUPER_ADMIN   | Kelola tenant              |
| `/super-admin/users`    | SUPER_ADMIN   | Kelola user                |
| `/super-admin/all-orders` | SUPER_ADMIN | Semua pesanan              |

## Deploy (Docker)

```bash
# Build image
docker build -t e-canteen .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/ecanteen" \
  -e NEXTAUTH_SECRET="your-random-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e AUTH_TRUST_HOST=true \
  -e MIDTRANS_SERVER_KEY="Mid-server-xxx" \
  -e NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="Mid-client-xxx" \
  -e APP_URL="https://your-domain.com" \
  e-canteen
```

Pastikan MySQL sudah bisa diakses dari container, lalu jalankan migrasi:

```bash
docker exec <container> npx prisma migrate deploy
```

## Testing

```bash
pnpm test           # Unit & integration (Vitest)
pnpm test:coverage  # Dengan coverage report
pnpm test:e2e       # E2E (Playwright)
pnpm lint           # ESLint
pnpm type-check     # TypeScript strict check
```

## Project Structure

```
├── actions/            # Server Actions (auth, order, menu, balance, dll.)
├── app/
│   ├── (app)/          # Layout siswa (menu, cart, orders, profile)
│   ├── (auth)/         # Layout login & register
│   ├── (backoffice)/   # Admin & Super Admin
│   └── api/            # Webhook Midtrans
├── components/
│   ├── shared/         # Komponen bisnis (MenuCard, CartDrawer, dll.)
│   ├── magic/          # Animated components (NumberTicker, Marquee)
│   └── ui/             # shadcn/ui primitives
├── hooks/              # Client hooks (useCartStore)
├── lib/
│   ├── auth.ts         # Auth.js v5 config
│   ├── prisma.ts       # Prisma singleton
│   ├── midtrans.ts     # Midtrans client (server-only)
│   ├── validations/    # Zod schemas
│   └── utils/          # Helpers (format, secure-upload, rate-limit)
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Seed data
├── proxy.ts            # Auth + CSP + RBAC (replaces middleware.ts)
├── Dockerfile          # Multi-stage production build
└── __tests__/          # Unit, integration, E2E tests
```

## Dibuat oleh

**Muhammad Faiz Hidayat**

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
