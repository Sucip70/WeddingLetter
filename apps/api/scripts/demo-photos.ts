// Mengunggah foto demo bawaan (ilustrasi placeholder di apps/api/assets/demo) ke storage (R2 bila dikonfigurasi)
// tanpa menyentuh database. Kunci tetap (assets/demo-<slot>.svg), jadi aman diulang. Pendaftaran slot ke database
// dilakukan `npx prisma db seed`.
import "dotenv/config";
import { DEMO_SLOTS, defaultKey } from "../src/demo-photos/demo-photos.slots.js";
import { uploadDefaultFile } from "../src/demo-photos/demo-photos.service.js";
import { StorageService } from "../src/storage/storage.service.js";

const storage = new StorageService();
for (const slot of DEMO_SLOTS.filter((s) => s.hasDefault)) {
  await uploadDefaultFile(storage, slot.slot);
  const head = await storage.head(defaultKey(slot.slot));
  console.log(`${defaultKey(slot.slot).padEnd(28)} ${head ? head.sizeBytes + " byte" : "GAGAL"}`);
}
