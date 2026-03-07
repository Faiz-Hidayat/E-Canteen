import { PrismaClient, Role, PickupTime, PaymentMethod, OrderStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean existing data (order matters for FK constraints) ──
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  // ── 1. Create Users ──────────────────────────────────────────

  const superAdminPassword = await hash("superadmin123", 12);
  const adminPassword = await hash("admin123", 12);
  const studentPassword = await hash("student123", 12);

  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superadmin@ecanteen.sch.id",
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
      balance: 0,
    },
  });
  console.log(`  ✅ Super Admin: ${superAdmin.email}`);

  const adminBuAni = await prisma.user.create({
    data: {
      name: "Bu Ani",
      email: "buani@ecanteen.sch.id",
      password: adminPassword,
      role: Role.ADMIN,
      balance: 0,
    },
  });

  const adminPakJoko = await prisma.user.create({
    data: {
      name: "Pak Joko",
      email: "pakjoko@ecanteen.sch.id",
      password: adminPassword,
      role: Role.ADMIN,
      balance: 0,
    },
  });
  console.log(`  ✅ Admin: ${adminBuAni.email}, ${adminPakJoko.email}`);

  const arya = await prisma.user.create({
    data: {
      name: "Arya Pratama",
      email: "arya@student.sch.id",
      password: studentPassword,
      role: Role.USER,
      balance: 50000,
    },
  });

  const siti = await prisma.user.create({
    data: {
      name: "Siti Nurhaliza",
      email: "siti@student.sch.id",
      password: studentPassword,
      role: Role.USER,
      balance: 75000,
    },
  });

  const budi = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi@student.sch.id",
      password: studentPassword,
      role: Role.USER,
      balance: 30000,
    },
  });
  console.log(`  ✅ Students: ${arya.email}, ${siti.email}, ${budi.email}`);

  // ── 2. Create Tenants ────────────────────────────────────────

  const tenantBuAni = await prisma.tenant.create({
    data: {
      name: "Warung Bu Ani",
      slug: "warung-bu-ani",
      description: "Masakan rumahan yang bikin kangen rumah",
      admin_id: adminBuAni.id,
    },
  });

  const tenantPakJoko = await prisma.tenant.create({
    data: {
      name: "Kedai Pak Joko",
      slug: "kedai-pak-joko",
      description: "Sarapan dan jajanan favorit anak sekolah",
      admin_id: adminPakJoko.id,
    },
  });
  console.log(`  ✅ Tenants: ${tenantBuAni.name}, ${tenantPakJoko.name}`);

  // ── 3. Create Menus ──────────────────────────────────────────

  const nasiGoreng = await prisma.menu.create({
    data: {
      tenant_id: tenantBuAni.id,
      name: "Nasi Goreng",
      description: "Nasi goreng spesial dengan telur dan kerupuk",
      price: 15000,
      category: "Makanan Berat",
      is_available: true,
    },
  });

  const mieAyam = await prisma.menu.create({
    data: {
      tenant_id: tenantBuAni.id,
      name: "Mie Ayam",
      description: "Mie ayam dengan topping ayam cincang dan pangsit",
      price: 13000,
      category: "Makanan Berat",
      is_available: true,
    },
  });

  const esTehManis = await prisma.menu.create({
    data: {
      tenant_id: tenantBuAni.id,
      name: "Es Teh Manis",
      description: "Teh manis dingin segar",
      price: 5000,
      category: "Minuman",
      is_available: true,
    },
  });

  const gorengan = await prisma.menu.create({
    data: {
      tenant_id: tenantBuAni.id,
      name: "Gorengan",
      description: "Aneka gorengan: bakwan, tahu, tempe",
      price: 3000,
      category: "Snack",
      is_available: true,
    },
  });

  await prisma.menu.create({
    data: {
      tenant_id: tenantPakJoko.id,
      name: "Nasi Uduk",
      description: "Nasi uduk komplit dengan lauk pilihan",
      price: 12000,
      category: "Makanan Berat",
      is_available: true,
    },
  });

  const sotoAyam = await prisma.menu.create({
    data: {
      tenant_id: tenantPakJoko.id,
      name: "Soto Ayam",
      description: "Soto ayam kuah bening dengan nasi",
      price: 14000,
      category: "Makanan Berat",
      is_available: true,
    },
  });

  const jusJeruk = await prisma.menu.create({
    data: {
      tenant_id: tenantPakJoko.id,
      name: "Jus Jeruk",
      description: "Jus jeruk segar tanpa pemanis buatan",
      price: 8000,
      category: "Minuman",
      is_available: true,
    },
  });

  await prisma.menu.create({
    data: {
      tenant_id: tenantPakJoko.id,
      name: "Roti Bakar",
      description: "Roti bakar dengan selai coklat dan keju",
      price: 10000,
      category: "Snack",
      is_available: true,
    },
  });

  console.log("  ✅ Menus: 8 items created (4 per tenant)");

  // ── 4. Create Sample Orders ──────────────────────────────────

  // Order 1: Arya pesan Nasi Goreng + Es Teh di Warung Bu Ani (PENDING)
  const order1 = await prisma.order.create({
    data: {
      user_id: arya.id,
      tenant_id: tenantBuAni.id,
      total_amount: nasiGoreng.price + esTehManis.price, // 15000 + 5000 = 20000
      pickup_time: PickupTime.BREAK_1,
      payment_method: PaymentMethod.BALANCE,
      status: OrderStatus.PENDING,
      notes: "Bang sambelnya banyakin ya",
      orderItems: {
        create: [
          {
            menu_id: nasiGoreng.id,
            quantity: 1,
            price: nasiGoreng.price, // snapshot: 15000
          },
          {
            menu_id: esTehManis.id,
            quantity: 1,
            price: esTehManis.price, // snapshot: 5000
          },
        ],
      },
    },
  });

  // Order 2: Siti pesan Soto Ayam + Jus Jeruk di Kedai Pak Joko (PREPARING)
  const order2 = await prisma.order.create({
    data: {
      user_id: siti.id,
      tenant_id: tenantPakJoko.id,
      total_amount: sotoAyam.price + jusJeruk.price, // 14000 + 8000 = 22000
      pickup_time: PickupTime.BREAK_2,
      payment_method: PaymentMethod.BALANCE,
      status: OrderStatus.PREPARING,
      orderItems: {
        create: [
          {
            menu_id: sotoAyam.id,
            quantity: 1,
            price: sotoAyam.price, // snapshot: 14000
          },
          {
            menu_id: jusJeruk.id,
            quantity: 1,
            price: jusJeruk.price, // snapshot: 8000
          },
        ],
      },
    },
  });

  // Order 3: Budi pesan 2x Mie Ayam + Gorengan di Warung Bu Ani (READY)
  const order3 = await prisma.order.create({
    data: {
      user_id: budi.id,
      tenant_id: tenantBuAni.id,
      total_amount: mieAyam.price * 2 + gorengan.price, // 13000*2 + 3000 = 29000
      pickup_time: PickupTime.BREAK_1,
      payment_method: PaymentMethod.BALANCE,
      status: OrderStatus.READY,
      notes: "Mie ayamnya pisah ya",
      orderItems: {
        create: [
          {
            menu_id: mieAyam.id,
            quantity: 2,
            price: mieAyam.price, // snapshot: 13000
          },
          {
            menu_id: gorengan.id,
            quantity: 1,
            price: gorengan.price, // snapshot: 3000
          },
        ],
      },
    },
  });

  console.log(`  ✅ Orders: 3 sample orders created`);
  console.log(`     - Order 1 (${order1.id}): Arya @ Bu Ani — PENDING`);
  console.log(`     - Order 2 (${order2.id}): Siti @ Pak Joko — PREPARING`);
  console.log(`     - Order 3 (${order3.id}): Budi @ Bu Ani — READY`);

  console.log("\n🎉 Seeding selesai!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
