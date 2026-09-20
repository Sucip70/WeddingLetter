// Seed data sesuai keputusan harga di dokumen rancangan (Bagian 6, 7, 7.1, 10).
// Idempotent: aman dijalankan berkali-kali (tidak menggandakan data, tidak menimpa harga yang sudah
// diubah admin). Untuk membuat akun admin pertama: ADMIN_EMAIL=email@anda.com npm run prisma:seed
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const templates = [
  {
    name: "Basic Rustic",
    category: "rustic",
    tier: "BASIC" as const,
    price: 20_000,
    includedWeeks: 4,
    layoutSchema: {
      theme: { preset: "rustic" },
      sections: ["cover", "mempelai", "tanggal_lokasi", "galeri"],
      galeri: { maxPhotos: 4, maxVideos: 0 },
      musik: { allowed: false },
    },
  },
  {
    name: "Standard Floral",
    category: "floral",
    tier: "STANDARD" as const,
    price: 75_000,
    includedWeeks: 4,
    layoutSchema: {
      theme: { preset: "floral" },
      sections: ["cover", "mempelai", "cerita", "tanggal_lokasi", "countdown", "galeri", "rsvp"],
      galeri: { maxPhotos: 10, maxVideos: 0 },
      musik: { allowed: true },
    },
  },
  {
    name: "Premium Elegant",
    category: "elegant",
    tier: "PREMIUM" as const,
    price: 150_000,
    includedWeeks: 4,
    layoutSchema: {
      theme: { preset: "elegant" },
      sections: ["cover", "mempelai", "cerita", "tanggal_lokasi", "countdown", "galeri", "rsvp", "amplop_digital", "buku_tamu"],
      galeri: { maxPhotos: 20, maxVideos: 1 },
      musik: { allowed: true },
    },
  },
];

const addOns = [
  { code: "PHOTO_PACK_5", name: "Paket 5 foto tambahan", type: "FLAT" as const, price: 8_000, unit: "paket" },
  { code: "CUSTOM_SONG", name: "Musik custom upload", type: "FLAT" as const, price: 5_000, unit: null },
  { code: "RSVP_ONLINE", name: "RSVP online", type: "FLAT" as const, price: 10_000, unit: null },
  { code: "DIGITAL_ENVELOPE", name: "Amplop digital/e-gift", type: "FLAT" as const, price: 15_000, unit: null },
  { code: "CUSTOM_DOMAIN", name: "Link/slug custom", type: "FLAT" as const, price: 10_000, unit: null },
  { code: "TRANSLATION_EN", name: "Terjemahan 2 bahasa (ID/EN)", type: "FLAT" as const, price: 10_000, unit: null },
  // Per-unit: sewa media berdurasi (Bagian 7.1) dan perpanjangan masa aktif
  { code: "MEDIA_RENTAL_WEEK", name: "Sewa media per MB per minggu", type: "PER_UNIT" as const, price: 700, unit: "MB/minggu" },
  { code: "EXTEND_ACTIVE_WEEK", name: "Perpanjangan masa aktif undangan", type: "PER_UNIT" as const, price: 10_000, unit: "minggu" },
];

async function main() {
  for (const t of templates) {
    const existing = await prisma.template.findFirst({ where: { name: t.name }, select: { id: true } });
    if (existing) {
      // Skema lama (dari seed awal) dimutakhirkan ke bentuk baru; harga & status tidak disentuh.
      await prisma.template.update({ where: { id: existing.id }, data: { layoutSchema: t.layoutSchema, includedWeeks: t.includedWeeks } });
    } else {
      await prisma.template.create({ data: { ...t, status: "PUBLISHED" } });
    }
  }

  await prisma.addOn.createMany({ data: addOns, skipDuplicates: true });

  await prisma.coupon.createMany({
    data: [{ code: "TEMANKELUARGA", type: "PERCENT", value: 20, quota: 50, status: "ACTIVE" }],
    skipDuplicates: true,
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: { email: adminEmail, name: "Admin", role: "ADMIN", emailVerifiedAt: new Date() },
    });
    console.log(`Admin: ${adminEmail}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed selesai.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
