// Seed data matching the pricing decisions in the project plan doc (Bagian 6, 7, 7.1, 10).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.template.createMany({
    data: [
      {
        name: "Basic Rustic",
        category: "rustic",
        tier: "BASIC",
        price: 20_000,
        status: "PUBLISHED",
        layoutSchema: {
          sections: ["cover", "mempelai", "tanggal_lokasi", "galeri"],
          galeri: { maxPhotos: 4 },
          musik: { allowed: false },
          rsvp: { allowed: false },
        },
      },
      {
        name: "Standard Floral",
        category: "floral",
        tier: "STANDARD",
        price: 75_000,
        status: "PUBLISHED",
        layoutSchema: {
          sections: ["cover", "mempelai", "tanggal_lokasi", "galeri", "rsvp", "countdown"],
          galeri: { maxPhotos: 10 },
          musik: { allowed: true },
          rsvp: { allowed: true },
        },
      },
      {
        name: "Premium Elegant",
        category: "elegant",
        tier: "PREMIUM",
        price: 150_000,
        status: "PUBLISHED",
        layoutSchema: {
          sections: [
            "cover",
            "mempelai",
            "tanggal_lokasi",
            "galeri",
            "rsvp",
            "countdown",
            "amplop_digital",
            "buku_tamu",
          ],
          galeri: { maxPhotos: 20, maxVideos: 1 },
          musik: { allowed: true },
          rsvp: { allowed: true },
        },
      },
    ],
    skipDuplicates: true,
  });

  // Add-on: flat-priced items (Bagian 7)
  await prisma.addOn.createMany({
    data: [
      { code: "PHOTO_PACK_5", name: "Paket 5 foto tambahan", type: "FLAT", price: 8_000, unit: "paket" },
      { code: "CUSTOM_SONG", name: "Musik custom upload", type: "FLAT", price: 5_000, unit: null },
      { code: "RSVP_ONLINE", name: "RSVP online", type: "FLAT", price: 10_000, unit: null },
      { code: "DIGITAL_ENVELOPE", name: "Amplop digital/e-gift", type: "FLAT", price: 15_000, unit: null },
      { code: "CUSTOM_DOMAIN", name: "Custom domain/slug pendek", type: "FLAT", price: 10_000, unit: null },
      { code: "TRANSLATION_EN", name: "Terjemahan 2 bahasa (ID/EN)", type: "FLAT", price: 10_000, unit: null },
      // Per-unit: durational rentals (Bagian 7.1) and the base extension add-on
      { code: "MEDIA_RENTAL_WEEK", name: "Sewa media per MB per minggu", type: "PER_UNIT", price: 700, unit: "MB/minggu" },
      { code: "EXTEND_ACTIVE_WEEK", name: "Perpanjangan masa aktif undangan", type: "PER_UNIT", price: 10_000, unit: "minggu" },
    ],
    skipDuplicates: true,
  });

  // A sample launch coupon (Bagian 7 & 11 — for friends/family)
  await prisma.coupon.createMany({
    data: [
      {
        code: "TEMANKELUARGA",
        type: "PERCENT",
        value: 20,
        quota: 50,
        status: "ACTIVE",
      },
    ],
    skipDuplicates: true,
  });
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
