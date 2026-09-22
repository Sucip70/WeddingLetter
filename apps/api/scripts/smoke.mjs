// Smoke test alur penuh terhadap API yang sedang berjalan + database sungguhan (bukan mock):
//   quote -> order -> upload -> bayar (simulasi) -> publish -> halaman publik -> RSVP -> edit -> perpanjangan -> admin
//
// Pakai database KHUSUS TES (script ini membuat user & order). Contoh:
//   API_URL=http://localhost:4100 DATABASE_URL=postgresql://.../weddingletter_verify JWT_SECRET=smoke-secret node scripts/smoke.mjs
import assert from 'node:assert/strict';
import pg from 'pg';
import { SignJWT } from 'jose';

const API = process.env.API_URL ?? 'http://localhost:4000';
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'change-me');
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const MB = 1024 * 1024;
let passed = 0;
const step = (name) => console.log(`\n# ${name}`);
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  passed++;
  console.log(`  ok - ${msg}`);
};
const eq = (a, b, msg) => {
  assert.deepEqual(a, b, msg);
  passed++;
  console.log(`  ok - ${msg}`);
};

async function userToken(email, role = 'USER') {
  const id = `smoke${Buffer.from(email).toString('hex').slice(0, 16)}`;
  await db.query(
    `insert into users (id, name, email, role, "updatedAt") values ($1,$2,$3,$4::"Role", now())
     on conflict (email) do update set role = excluded.role`,
    [id, email.split('@')[0], email, role],
  );
  const { rows } = await db.query('select id from users where email=$1', [email]);
  return new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(rows[0].id).setIssuedAt().setExpirationTime('1h').sign(secret);
}

async function call(method, path, { token, body, expect } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (expect !== undefined) assert.equal(res.status, expect, `${method} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return { status: res.status, json };
}

async function upload(u, size) {
  const res = await fetch(u.uploadUrl, { method: u.method, headers: u.headers, body: Buffer.alloc(size, 1) });
  return res.status;
}

const user = await userToken('smoke-user@test.dev');
const other = await userToken('smoke-other@test.dev');
const admin = await userToken('smoke-admin@test.dev', 'ADMIN');

step('Katalog & harga add-on');
const { json: templates } = await call('GET', '/templates', { expect: 200 });
const basic = templates.find((t) => t.tier === 'BASIC');
ok(templates.length >= 3 && basic.layout.sections.length > 0, 'katalog memuat template dengan skema ter-normalisasi');
eq(templates.length, 69, 'katalog 69 template (1 Basic + 34 Standard + 34 Premium)');
eq(basic.layout.palettes.length, 8, 'Basic punya 8 pilihan warna');
const premium = templates.find((t) => t.name === 'Premium Batik Jawa');
ok(premium.design.group === 'suku' && premium.layout.theme.fx === 'premium' && premium.layout.musik.presets.length === 0 && premium.layout.musik.count === 0, 'daftar katalog ringan: info desain + jumlah lagu, tanpa daftar lagu');
const premiumFull = (await call('GET', `/templates/${premium.id}`, { expect: 200 })).json;
ok(premiumFull.layout.musik.allowed && basic.layout.musik.allowed && premiumFull.layout.musik.presets.length === 0, 'semua paket boleh musik; pustaka lagu awalnya kosong (diisi admin)');
eq(premiumFull.layout.palettes.map((p) => p.id), ['bawaan', 'hangat', 'sejuk'], 'desain non-Basic punya palet bawaan + 2 varian otomatis');
const standardJawa = templates.find((t) => t.name === 'Standard Batik Jawa');
eq([premium.layout.theme.gate, standardJawa.layout.theme.gate, basic.layout.theme.gate], ['door', 'none', 'none'], 'gerbang pembuka hanya di Premium (Batik Jawa = pintu)');
eq(templates.filter((t) => t.tier === 'PREMIUM' && t.layout.theme.gate === 'none').length, 0, 'semua template Premium punya gerbang');
eq(standardJawa.layout.theme.fx, 'standard', 'Standard = animasi standar');
const rusticTiers = templates.filter((t) => t.design?.id === 'rustic').map((t) => t.tier).sort();
eq(rusticTiers, ['BASIC', 'PREMIUM', 'STANDARD'], 'desain Basic (rustic) juga tersedia di Standard & Premium');
const { json: addOns } = await call('GET', '/pricing/add-ons', { expect: 200 });
ok(addOns.some((a) => a.code === 'MEDIA_RENTAL_WEEK' && a.price === 700), 'tarif sewa media Rp700/MB/minggu');

const media = [
  { clientId: 'cover', type: 'PHOTO', fileName: 'cover.jpg', contentType: 'image/jpeg', sizeBytes: 1 * MB },
  ...['g1', 'g2', 'g3', 'g4', 'g5'].map((id) => ({ clientId: id, type: 'PHOTO', fileName: `${id}.jpg`, contentType: 'image/jpeg', sizeBytes: 1 * MB })),
  { clientId: 'vid1', type: 'VIDEO', fileName: 'vid.mp4', contentType: 'video/mp4', sizeBytes: 2 * MB },
];
const orderBody = {
  templateId: basic.id,
  palette: 'lavender',
  weeks: 6,
  addOns: ['RSVP_ONLINE'],
  couponCode: 'temankeluarga',
  data: {
    cover: { foto: 'cover', pembuka: 'Bismillah' },
    mempelai: { pria_nama: 'Andi', wanita_nama: 'Sinta' },
    tanggal_lokasi: { akad_tanggal: '2026-12-12T10:00', akad_lokasi: 'Gedung Serbaguna' },
    galeri: { foto: ['g1', 'g2', 'g3', 'g4', 'g5'], video: ['vid1'] },
    rsvp: { pengantar: 'Mohon konfirmasi kehadiran' },
  },
  media,
};

step('Kalkulator: 20.000 + 2 minggu x 10.000 + 1 paket foto 8.000 + video 2MB x 6 x 700 + RSVP 10.000 - kupon 20%');
const { json: quote } = await call('POST', '/pricing/quote', { body: orderBody, expect: 200 });
eq(quote.subtotal, 20000 + 20000 + 8000 + 8400 + 10000, 'subtotal 66.400');
eq(quote.discount, 13280, 'diskon 20% = 13.280');
eq(quote.total, 53120, 'total 53.120');

await call('POST', '/pricing/quote', { body: { ...orderBody, palette: 'tidak-ada' }, expect: 400 });
ok(true, 'palet yang tidak tersedia ditolak (400)');

step('Kalkulator mode lenient: form belum lengkap tetap bisa dihitung');
const { json: lenient } = await call('POST', '/pricing/quote', { body: { templateId: basic.id, weeks: 4, data: {}, media: [] }, expect: 200 });
eq(lenient.total, 20000, 'template saja = Rp20.000');
await call('POST', '/orders', { token: user, body: { ...orderBody, data: { ...orderBody.data, mempelai: {} } }, expect: 400 });
ok(true, 'order menolak field wajib yang kosong (400)');

step('Tata letak sampul: Basic tanpa pilihan; Standard = 9 umum; Premium = 9 umum + 1 khusus tema');
eq([basic.layout.coverLayouts.length, standardJawa.layout.coverLayouts.length, premium.layout.coverLayouts.length], [0, 9, 10], 'katalog memuat daftar tata letak sesuai paket');
ok(premium.layout.coverLayouts.includes('gapura') && !standardJawa.layout.coverLayouts.includes('gapura'), 'layout khusus tema (gapura) hanya di Premium Batik Jawa');
// Kalkulator bersifat lenient (tidak menolak isi keliru), jadi validasi dicek lewat order sungguhan.
const coverOrder = (templateId, tata_letak) =>
  call('POST', '/orders', {
    token: other,
    body: { templateId, weeks: 4, data: { cover: { tata_letak }, mempelai: { pria_nama: 'Eko', wanita_nama: 'Wati' }, tanggal_lokasi: { akad_tanggal: '2027-01-01T09:00', akad_lokasi: 'Masjid' } } },
  });
const cancelled = async (res) => {
  if (res.status === 201) await call('POST', `/orders/${res.json.order.id}/cancel`, { token: other, expect: 200 });
  return res.status;
};
eq(await cancelled(await coverOrder(premium.id, 'gapura')), 201, 'Premium menerima layout khusus tema');
eq(await cancelled(await coverOrder(premium.id, 'portal')), 400, 'Premium menolak layout khusus tema milik desain lain');
eq(await cancelled(await coverOrder(standardJawa.id, 'bingkai')), 201, 'Standard menerima layout umum');
eq(await cancelled(await coverOrder(standardJawa.id, 'gapura')), 400, 'Standard menolak layout khusus tema');
eq(await cancelled(await coverOrder(basic.id, 'penuh')), 400, 'Basic menolak pilihan tata letak');

step('Order (wajib login)');
await call('POST', '/orders', { body: orderBody, expect: 401 });
const created = await call('POST', '/orders', { token: user, body: orderBody, expect: 201 });
const order = created.json.order;
eq(order.totalAmount, 53120, 'order tersimpan dengan total sama dengan kalkulator');
eq(order.status, 'PENDING', 'status PENDING');
eq(created.json.uploads.length, 7, '7 slot upload (presigned)');
const invitationId = order.invitation.id;

step('Tidak bisa bayar sebelum semua file terunggah');
await call('POST', `/payments/${order.id}/start`, { token: user, expect: 409 });
ok(true, 'pembayaran ditolak (409)');

step('Upload ke storage + konfirmasi (ukuran diverifikasi server)');
const bySize = Object.fromEntries(media.map((m) => [m.clientId, m.sizeBytes]));
const first = created.json.uploads[0];
eq(await upload(first, bySize[first.clientId] + 10), 400, 'upload lebih besar dari yang dibayar ditolak');
for (const u of created.json.uploads) eq(await upload(u, bySize[u.clientId]), 200, `upload ${u.clientId}`);
await call('POST', `/media/${created.json.uploads[0].mediaId}/confirm`, { token: other, expect: 404 });
ok(true, 'user lain tidak bisa konfirmasi file orang lain');
for (const u of created.json.uploads) await call('POST', `/media/${u.mediaId}/confirm`, { token: user, expect: 200 });

step('Pembayaran (simulasi dev) & idempotensi');
const started = await call('POST', `/payments/${order.id}/start`, { token: user, expect: 200 });
eq(started.json.provider, 'DEV', 'provider simulasi (tanpa kunci Midtrans)');
const again = await call('POST', `/payments/${order.id}/start`, { token: user, expect: 200 });
eq(again.json.redirectUrl, started.json.redirectUrl, 'start dua kali mengembalikan link yang sama');
await call('POST', `/payments/dev/${order.id}/confirm`, { token: other, expect: 404 });
await call('POST', `/payments/dev/${order.id}/confirm`, { token: user, expect: 200 });
await call('POST', `/payments/dev/${order.id}/confirm`, { token: user, expect: 200 });
const paid = await call('GET', `/orders/${order.id}`, { token: user, expect: 200 });
eq(paid.json.status, 'PAID', 'pesanan PAID (konfirmasi ganda aman)');
const coupon = await db.query("select \"usedCount\" from coupons where code='TEMANKELUARGA'");
eq(coupon.rows[0].usedCount, 1, 'kuota kupon terpakai tepat 1 kali');

step('Undangan: draft -> edit -> publish');
const detail = (await call('GET', `/invitations/${invitationId}`, { token: user, expect: 200 })).json;
eq(detail.status, 'DRAFT', 'setelah bayar masih DRAFT (belum publik)');
ok(detail.refundEligible, 'masih memenuhi syarat refund (belum publish, dalam 48 jam)');
eq(detail.features.palette, 'lavender', 'palet pilihan tersimpan di fitur undangan');
eq(detail.layout.theme.primary, '#7b6aa8', 'snapshot tema memakai warna palet Lavender');
eq(detail.layout.palettes.length, 8, 'undangan menyimpan daftar palet untuk ganti warna nanti');
await call('GET', `/public/invitations/${detail.slug}`, { expect: 404 });
ok(true, 'halaman publik belum bisa dibuka sebelum publish');
const mediaIds = detail.media.map((m) => m.id);
const coverId = detail.data.cover.foto;
ok(mediaIds.includes(coverId), 'referensi clientId sudah diganti id media final');
const edited = await call('PATCH', `/invitations/${invitationId}`, {
  token: user,
  body: { data: { ...detail.data, cover: { ...detail.data.cover, pembuka: 'Dengan hormat' } } },
  expect: 200,
});
eq(edited.json.data.cover.pembuka, 'Dengan hormat', 'edit teks berhasil');
await call('PATCH', `/invitations/${invitationId}`, { token: user, body: { data: { ...detail.data, cover: { foto: 'ngawur' } } }, expect: 400 });
const recolored = await call('PATCH', `/invitations/${invitationId}`, { token: user, body: { data: edited.json.data, palette: 'merah-marun' }, expect: 200 });
eq(recolored.json.layout.theme.primary, '#7a2233', 'ganti warna setelah beli: tema snapshot ikut berubah');
eq(recolored.json.features.palette, 'merah-marun', 'palet baru tersimpan');
await call('PATCH', `/invitations/${invitationId}`, { token: user, body: { data: edited.json.data, palette: 'tidak-ada' }, expect: 400 });
ok(true, 'ganti ke palet yang tidak ada ditolak');
ok(true, 'edit dengan referensi file asing ditolak');
await call('POST', `/invitations/${invitationId}/publish`, { token: other, expect: 404 });
const pub = await call('POST', `/invitations/${invitationId}/publish`, { token: user, expect: 200 });
eq(pub.json.status, 'ACTIVE', 'undangan ACTIVE');
const weeksMs = new Date(pub.json.expiresAt).getTime() - Date.now();
ok(Math.abs(weeksMs - 6 * 7 * 86400000) < 60_000, 'masa aktif 6 minggu sejak publish');
await call('POST', `/invitations/${invitationId}/publish`, { token: user, expect: 409 });

step('Halaman publik + RSVP');
const view = (await call('GET', `/public/invitations/${detail.slug}`, { expect: 200 })).json;
ok(view.rsvpEnabled && view.layout.sections.some((s) => s.id === 'rsvp'), 'section RSVP terbuka berkat add-on');
ok(view.media[coverId]?.url.includes('/media/local/'), 'file media tersaji lewat URL storage');
const fileRes = await fetch(view.media[coverId].url);
eq(fileRes.status, 200, 'file dapat diunduh');
eq((await fileRes.arrayBuffer()).byteLength, 1 * MB, 'ukuran file sama persis');
await call('POST', `/public/invitations/${detail.slug}/rsvp`, { body: { name: 'Budi', attending: true, guestCount: 3, message: 'Selamat!' }, expect: 200 });
await call('POST', `/public/invitations/${detail.slug}/rsvp`, { body: { name: '', attending: true }, expect: 400 });
const guests = (await call('GET', `/invitations/${invitationId}/rsvp`, { token: user, expect: 200 })).json;
eq([guests.total, guests.attendingPeople], [1, 3], 'RSVP tercatat (1 tamu, 3 orang)');
await call('GET', `/invitations/${invitationId}/rsvp`, { token: other, expect: 404 });

step('Perpanjangan (order EXTENSION)');
const extQuote = (await call('POST', `/invitations/${invitationId}/extension-quote`, { token: user, body: { weeks: 2 }, expect: 200 })).json;
eq(extQuote.total, 2 * 10000 + 2 * 2 * 700, '2 minggu x 10.000 + sewa video 2MB x 2 x 700');
const ext = (await call('POST', `/invitations/${invitationId}/extension-order`, { token: user, body: { weeks: 2 }, expect: 201 })).json;
eq(ext.kind, 'EXTENSION', 'order perpanjangan dibuat');
const before = (await call('GET', `/invitations/${invitationId}`, { token: user })).json.expiresAt;
await call('POST', `/payments/dev/${ext.id}/confirm`, { token: user, expect: 200 });
const after = (await call('GET', `/invitations/${invitationId}`, { token: user })).json;
eq(Math.round((new Date(after.expiresAt) - new Date(before)) / 86400000), 14, 'masa aktif bertambah 14 hari setelah dibayar');

step('Pembatalan pesanan belum dibayar melepas kupon & menghapus draft');
const second = (await call('POST', '/orders', { token: other, body: { ...orderBody, media: [], data: { ...orderBody.data, cover: { pembuka: 'x' }, galeri: {} }, addOns: [] }, expect: 201 })).json;
eq((await db.query("select \"usedCount\" from coupons where code='TEMANKELUARGA'")).rows[0].usedCount, 2, 'kupon dipakai 2x (satu di-reserve)');
await call('POST', `/orders/${second.order.id}/cancel`, { token: other, expect: 200 });
eq((await db.query("select \"usedCount\" from coupons where code='TEMANKELUARGA'")).rows[0].usedCount, 1, 'kuota kupon dikembalikan');
await call('POST', `/payments/${second.order.id}/start`, { token: other, expect: 409 });

// ================= ADMIN =================
step('Admin: hak akses');
await call('GET', '/admin/stats', { expect: 401 });
await call('GET', '/admin/stats', { token: user, expect: 403 });
const stats = (await call('GET', '/admin/stats', { token: admin, expect: 200 })).json;
ok(stats.revenue.total >= 53120 + 22800 && stats.invitations.ACTIVE >= 1, 'statistik pendapatan & undangan aktif');

step('Admin: template builder');
const meta = (await call('GET', '/admin/builder-meta', { token: admin, expect: 200 })).json;
ok(meta.designs.length === 34 && meta.groups.length === 8 && meta.sections.length === 10, 'builder-meta memuat 34 desain, 8 grup & 10 section');
ok(meta.designs.every((d) => d.palettes.length >= 0) && meta.designs.find((d) => d.id === 'rustic').palettes.length === 8, 'usulan palet per desain tersedia');
const authoring = (await call('GET', `/admin/templates/${basic.id}`, { token: admin, expect: 200 })).json;
eq(authoring.layout.sections.length, 9, 'builder memuat semua 9 section (aktif & nonaktif)');
eq(authoring.layout.palettes.length, 8, 'builder memuat palet template');
eq(authoring.layout.sections[0].id, 'cover', 'section aktif tampil lebih dulu sesuai urutan');
ok(authoring.layout.sections.find((s) => s.id === 'rsvp').enabled === false, 'RSVP nonaktif di Basic');
const newTpl = (
  await call('POST', '/admin/templates', {
    token: admin,
    body: { name: 'Minimalis Baru', category: 'minimalis', tier: 'BASIC', price: 25000, includedWeeks: 2, status: 'DRAFT', layoutSchema: { sections: ['cover', 'mempelai'] } },
    expect: 201,
  })
).json;
await call('PATCH', `/admin/templates/${newTpl.id}`, { token: admin, body: { status: 'PUBLISHED' }, expect: 400 });
ok(true, 'publish ditolak jika belum ada section Mempelai + Tanggal & lokasi');
await call('GET', `/templates/${newTpl.id}`, { expect: 404 });
ok(true, 'template draft tidak muncul di katalog publik');
await call('PATCH', `/admin/templates/${newTpl.id}`, {
  token: admin,
  body: {
    status: 'PUBLISHED',
    layoutSchema: {
      theme: { preset: 'jawa', motif: 'bali', fx: 'premium', primary: '#112233' },
      palettes: [{ id: 'malam', name: 'Malam', primary: '#0a1a33', secondary: '#88aacc', background: '#f4f8ff', text: '#0a1a33' }],
      musik: { allowed: true, presets: [{ name: 'Uji', url: '/audio/kalimba-taman.mp3' }] },
      sections: [{ id: 'cover' }, { id: 'mempelai' }, { id: 'tanggal_lokasi', fields: [{ key: 'akad_lokasi', required: false }, { key: 'akad_maps', enabled: false }] }],
    },
  },
  expect: 200,
});
const pubDetail = (await call('GET', `/templates/${newTpl.id}`, { expect: 200 })).json;
eq(pubDetail.layout.theme.primary, '#112233', 'tema kustom tersimpan');
ok(pubDetail.layout.theme.motif === 'bali' && pubDetail.layout.theme.fx === 'premium', 'motif & level animasi tersimpan');
eq(pubDetail.layout.palettes.map((p) => p.id), ['bawaan', 'malam'], 'palet kustom tersimpan + Bawaan otomatis');
await call('PATCH', `/admin/templates/${newTpl.id}`, { token: admin, body: { layoutSchema: { musik: { allowed: true, presets: [{ name: 'x', url: 'javascript:alert(1)' }] } } }, expect: 400 });
ok(true, 'URL lagu bawaan yang berbahaya ditolak');
ok(!pubDetail.layout.sections.find((s) => s.id === 'tanggal_lokasi').fields.some((f) => f.key === 'akad_maps'), 'field yang dinonaktifkan tidak muncul');
eq((await call('POST', '/pricing/quote', { body: { templateId: newTpl.id, weeks: 2, data: {} }, expect: 200 })).json.total, 25000, 'template baru bisa dihitung harganya (masa aktif bawaan 2 minggu)');
await call('PATCH', `/admin/templates/${newTpl.id}`, { token: admin, body: { layoutSchema: { theme: { primary: 'merah' } } }, expect: 400 });
ok(true, 'warna tidak valid ditolak');
await call('DELETE', `/admin/templates/${basic.id}`, { token: admin, expect: 409 });
ok(true, 'template yang sudah pernah dipesan tidak bisa dihapus');
await call('DELETE', `/admin/templates/${newTpl.id}`, { token: admin, expect: 200 });

step('Admin: pustaka lagu (unggah, batas paket, arsip, hapus)');
await call('GET', '/admin/music', { token: user, expect: 403 });
ok(true, 'pustaka lagu hanya untuk admin');
await call('POST', '/admin/assets/presign', { token: admin, body: { kind: 'audio', contentType: 'audio/mpeg', sizeBytes: 26 * MB }, expect: 400 });
ok(true, 'unggahan lagu di atas 25 MB ditolak');
async function addTrack(meta) {
  const p = (await call('POST', '/admin/assets/presign', { token: admin, body: { kind: 'audio', contentType: 'audio/mpeg', sizeBytes: 3 * MB }, expect: 200 })).json;
  eq(await upload(p, 3 * MB), 200, 'file lagu terunggah');
  return (await call('POST', '/admin/music', { token: admin, body: { key: p.key, ...meta }, expect: 201 })).json;
}
await call('POST', '/admin/music', { token: admin, body: { key: 'assets/belum-ada.mp3', title: 'X', artist: 'Y', licenseType: 'CC0', minTier: 'BASIC' }, expect: 400 });
ok(true, 'simpan lagu ditolak bila file belum terunggah');
const canon = await addTrack({ title: 'Canon in D', artist: 'Pachelbel', licenseType: 'PUBLIC_DOMAIN', minTier: 'BASIC', durationSec: 240, sortOrder: 1 });
const rf = await addTrack({ title: 'Bebas Royalti', artist: 'Studio X', licenseType: 'ROYALTY_FREE', minTier: 'STANDARD', sortOrder: 2 });
const excl = await addTrack({ title: 'Eksklusif', artist: 'Y', licenseType: 'CC_BY', minTier: 'PREMIUM', attribution: 'Musik: Eksklusif oleh Y (CC BY 4.0)', sortOrder: 3 });
const basicTpl = (await call('GET', `/templates/${basic.id}`, { expect: 200 })).json;
const stdTpl = (await call('GET', `/templates/${standardJawa.id}`, { expect: 200 })).json;
const premTpl = (await call('GET', `/templates/${premium.id}`, { expect: 200 })).json;
eq(basicTpl.layout.musik.presets.map((p) => p.id), [canon.id], 'Basic hanya mendapat lagu klasik domain publik');
eq(stdTpl.layout.musik.presets.map((p) => p.id), [canon.id, rf.id], 'Standard mendapat lagu klasik + royalty-free');
eq(premTpl.layout.musik.presets.map((p) => p.id), [canon.id, rf.id, excl.id], 'Premium mendapat seluruh pustaka');
ok(premTpl.layout.musik.presets[2].credit === 'Musik: Eksklusif oleh Y (CC BY 4.0)' && !('credit' in premTpl.layout.musik.presets[0]), 'kredit hanya ada untuk lagu yang mewajibkannya');
const listAfter = (await call('GET', '/templates', { expect: 200 })).json;
eq(listAfter.find((t) => t.id === basic.id).layout.musik.count, 1, 'daftar katalog memuat jumlah lagu per paket');
const musicOrder = {
  templateId: basic.id,
  weeks: 4,
  media: [],
  data: { mempelai: { pria_nama: 'A', wanita_nama: 'B' }, tanggal_lokasi: { akad_tanggal: '2027-02-06T10:00', akad_lokasi: 'Gedung' }, musik: { lagu: `preset:${canon.id}` } },
};
const musicCreated = await call('POST', '/orders', { token: user, body: musicOrder, expect: 201 });
const musicInv = (await call('GET', `/invitations/${musicCreated.json.order.invitation.id}`, { token: user, expect: 200 })).json;
eq(musicInv.data.musik.lagu, `preset:${canon.id}`, 'pesanan dengan lagu klasik tersimpan');
eq(musicInv.layout.musik.presets.map((p) => p.id), [canon.id], 'snapshot undangan menyimpan lagu pustaka yang berhak dipakai paketnya');
await call('POST', '/orders', { token: user, body: { ...musicOrder, data: { ...musicOrder.data, musik: { lagu: `preset:${excl.id}` } } }, expect: 400 });
ok(true, 'Basic tidak bisa memilih lagu khusus Premium (400)');
await call('POST', `/orders/${musicCreated.json.order.id}/cancel`, { token: user });
await call('PATCH', `/admin/music/${rf.id}`, { token: admin, body: { status: 'ARCHIVED' }, expect: 200 });
eq((await call('GET', `/templates/${standardJawa.id}`, { expect: 200 })).json.layout.musik.presets.map((p) => p.id), [canon.id], 'lagu yang diarsipkan hilang dari pilihan pembeli baru');
await call('DELETE', `/admin/music/${canon.id}`, { token: admin, expect: 409 });
ok(true, 'lagu yang masih dipakai undangan tidak bisa dihapus permanen (409)');
await call('DELETE', `/admin/music/${rf.id}`, { token: admin, expect: 200 });
await call('DELETE', `/admin/music/${excl.id}`, { token: admin, expect: 200 });
ok(true, 'lagu yang tidak dipakai bisa dihapus permanen');

step('Foto demo template (galeri foto contoh di folder assets)');
const demoMap = (await call('GET', '/demo-photos', { expect: 200 })).json;
eq(Object.keys(demoMap).sort(), ['bride', 'cover', 'gallery1', 'gallery2', 'gallery3', 'gallery4', 'gallery5', 'gallery6', 'gallery7', 'gallery8', 'groom'], 'seed memasang 11 foto bawaan (publik, tanpa login)');
ok(demoMap.groom.includes('/assets/demo-groom.svg') && demoMap.groom.includes('?v='), 'URL foto bawaan di folder assets + penanda versi');
const demoFile = await fetch(demoMap.groom);
ok(demoFile.status === 200 && (await demoFile.text()).startsWith('<svg'), 'berkas foto bawaan bisa diunduh');
await call('GET', '/admin/demo-photos', { token: user, expect: 403 });
ok(true, 'kelola foto demo hanya untuk admin');
const demoList = (await call('GET', '/admin/demo-photos', { token: admin, expect: 200 })).json;
ok(demoList.length === 11 && demoList.find((x) => x.slot === 'groom').isDefault && demoList.every((x) => x.isDefault), 'admin melihat 11 slot, semuanya bawaan');
await call('PUT', '/admin/demo-photos/xyz', { token: admin, body: { key: 'assets/abc.jpg' }, expect: 404 });
await call('PUT', '/admin/demo-photos/groom', { token: admin, body: { key: 'assets/belum-ada.jpg' }, expect: 400 });
ok(true, 'slot asing (404) dan file yang belum terunggah (400) ditolak');
const demoPresign = (await call('POST', '/admin/assets/presign', { token: admin, body: { kind: 'image', contentType: 'image/jpeg', sizeBytes: 2048 }, expect: 200 })).json;
eq(await upload(demoPresign, 2048), 200, 'foto pengganti terunggah');
const replaced = (await call('PUT', '/admin/demo-photos/groom', { token: admin, body: { key: demoPresign.key }, expect: 200 })).json;
ok(!replaced.find((x) => x.slot === 'groom').isDefault && replaced.find((x) => x.slot === 'groom').url.includes(demoPresign.key), 'foto diganti dengan unggahan admin');
eq((await call('POST', '/admin/demo-photos/groom/reset', { token: admin, expect: 200 })).json.find((x) => x.slot === 'groom').isDefault, true, 'kembalikan ke bawaan');
eq((await fetch(demoPresign.uploadUrl.split('?')[0])).status, 404, 'unggahan admin yang digantikan ikut dihapus dari storage');
const cleared = (await call('DELETE', '/admin/demo-photos/gallery8', { token: admin, expect: 200 })).json;
eq(cleared.find((x) => x.slot === 'gallery8').url, null, 'slot bisa dikosongkan');
ok(!('gallery8' in (await call('GET', '/demo-photos', { expect: 200 })).json), 'slot kosong hilang dari peta publik');
await call('POST', '/admin/demo-photos/gallery8/reset', { token: admin, expect: 200 });

step('Admin: harga per komponen langsung berlaku');
const rental = (await call('GET', '/admin/add-ons', { token: admin, expect: 200 })).json.find((a) => a.code === 'MEDIA_RENTAL_WEEK');
const q10 = { templateId: basic.id, weeks: 4, data: { galeri: { video: ['v'] } }, media: [{ clientId: 'v', type: 'VIDEO', fileName: 'v.mp4', contentType: 'video/mp4', sizeBytes: 10 * MB }] };
eq((await call('POST', '/pricing/quote', { body: q10, expect: 200 })).json.total, 20000 + 10 * 4 * 700, 'sebelum: 10MB x 4 minggu x Rp700');
await call('PATCH', `/admin/add-ons/${rental.id}`, { token: admin, body: { price: 900 }, expect: 200 });
eq((await call('POST', '/pricing/quote', { body: q10, expect: 200 })).json.total, 20000 + 10 * 4 * 900, 'sesudah admin ubah tarif jadi Rp900: harga ikut berubah');
await call('PATCH', `/admin/add-ons/${rental.id}`, { token: admin, body: { price: 700 }, expect: 200 });

step('Admin: kupon');
const cp = (await call('POST', '/admin/coupons', { token: admin, body: { code: 'hemat10k', type: 'NOMINAL', value: 10000, quota: 1 }, expect: 201 })).json;
eq(cp.code, 'HEMAT10K', 'kode kupon di-uppercase');
await call('POST', '/admin/coupons', { token: admin, body: { code: 'HEMAT10K', type: 'NOMINAL', value: 5 }, expect: 409 });
await call('POST', '/admin/coupons', { token: admin, body: { code: 'PERSEN', type: 'PERCENT', value: 150 }, expect: 400 });
const withCoupon = (await call('POST', '/pricing/quote', { body: { templateId: basic.id, weeks: 4, data: {}, couponCode: 'hemat10k' }, expect: 200 })).json;
eq(withCoupon.total, 10000, 'kupon nominal Rp10.000 dari Rp20.000');
const bad = (await call('POST', '/pricing/quote', { body: { templateId: basic.id, weeks: 4, data: {}, couponCode: 'TIDAKADA' }, expect: 200 })).json;
eq([bad.coupon.valid, bad.total], [false, 20000], 'kupon tidak valid: kalkulator tetap jalan tanpa diskon');
await call('PATCH', `/admin/coupons/${cp.id}`, { token: admin, body: { status: 'INACTIVE' }, expect: 200 });
eq((await call('POST', '/pricing/quote', { body: { templateId: basic.id, weeks: 4, data: {}, couponCode: 'HEMAT10K' }, expect: 200 })).json.coupon.valid, false, 'kupon nonaktif tidak bisa dipakai');
await call('DELETE', `/admin/coupons/${cp.id}`, { token: admin, expect: 200 });

step('Admin: pesanan (cari, tandai lunas manual, refund)');
const found = (await call('GET', '/admin/orders?q=smoke-user&status=PAID', { token: admin, expect: 200 })).json;
ok(found.total >= 2 && found.items.every((o) => o.status === 'PAID'), 'pencarian by email + filter status');
const detailOrder = (await call('GET', `/admin/orders/${order.id}`, { token: admin, expect: 200 })).json;
ok(detailOrder.lines.length >= 3 && detailOrder.coupon === 'TEMANKELUARGA', 'detail pesanan memuat rincian baris & kupon');
const manual = (await call('POST', '/orders', { token: other, body: { templateId: basic.id, weeks: 4, data: { mempelai: { pria_nama: 'Eko', wanita_nama: 'Wati' }, tanggal_lokasi: { akad_tanggal: '2027-01-01T09:00', akad_lokasi: 'Masjid' } } }, expect: 201 })).json.order;
const paidManual = (await call('POST', `/admin/orders/${manual.id}/mark-paid`, { token: admin, body: { note: 'transfer BCA' }, expect: 200 })).json;
eq([paidManual.status, paidManual.paymentProvider], ['PAID', 'MANUAL'], 'tandai lunas manual (transfer)');
await call('POST', `/admin/orders/${manual.id}/mark-paid`, { token: admin, expect: 409 });
const refunded = (await call('POST', `/admin/orders/${manual.id}/refund`, { token: admin, body: {}, expect: 200 })).json;
eq(refunded.status, 'REFUNDED', 'refund sebelum publish diizinkan');
eq((await db.query('select status from invitations where id=$1', [refunded.invitation.id])).rows[0].status, 'DELETED', 'undangan ikut dihapus');
await call('POST', `/admin/orders/${order.id}/refund`, { token: admin, body: {}, expect: 409 });
ok(true, 'refund setelah publish ditolak tanpa pengecualian');

step('Admin: siklus hidup undangan (jeda / lanjutkan / perpanjang / atur tanggal)');
const invAdmin = (id) => call('GET', `/admin/invitations/${id}`, { token: admin, expect: 200 }).then((r) => r.json);
const list = (await call('GET', `/admin/invitations?q=${detail.slug}`, { token: admin, expect: 200 })).json;
eq(list.items[0].id, invitationId, 'daftar undangan bisa dicari by slug');
const days = (d) => Math.round((new Date(d) - Date.now()) / 86400000);
const beforePause = await invAdmin(invitationId);
const paused = (await call('POST', `/admin/invitations/${invitationId}/pause`, { token: admin, expect: 200 })).json;
eq(paused.status, 'PAUSED', 'undangan dijeda');
eq(paused.remainingDays, days(beforePause.expiresAt), 'sisa durasi tersimpan (hari)');
ok(paused.expiresAt === null && paused.media.filter((m) => m.status === 'PAUSED').length === 7, 'hitung mundur berhenti, semua media ikut dijeda');
const gone = await call('GET', `/public/invitations/${detail.slug}`, { expect: 410 });
eq(gone.json.status, 'PAUSED', 'halaman publik 410 saat dijeda');
await call('PATCH', `/invitations/${invitationId}`, { token: user, body: { data: detail.data }, expect: 200 });
ok(true, 'pemilik tetap bisa mengedit saat dijeda');
const resumed = (await call('POST', `/admin/invitations/${invitationId}/resume`, { token: admin, body: { extraDays: 3 }, expect: 200 })).json;
eq([resumed.status, days(resumed.expiresAt)], ['ACTIVE', paused.remainingDays + 3], 'dilanjutkan dengan sisa durasi + 3 hari bonus');
const extended = (await call('POST', `/admin/invitations/${invitationId}/extend`, { token: admin, body: { weeks: 1 }, expect: 200 })).json;
eq(days(extended.expiresAt) - days(resumed.expiresAt), 7, 'perpanjang gratis 1 minggu');
const target = new Date(Date.now() + 10 * 86400000);
const setExp = (await call('POST', `/admin/invitations/${invitationId}/expiry`, { token: admin, body: { expiresAt: target.toISOString() }, expect: 200 })).json;
eq(days(setExp.expiresAt), 10, 'tanggal berakhir diatur eksplisit');

step('Ganti file yang sudah dibeli (tanpa biaya, tanpa menambah tagihan)');
const inv0 = await invAdmin(invitationId);
const photoM = inv0.media.find((m) => m.type === 'PHOTO' && m.included && m.status === 'ACTIVE');
const videoM = inv0.media.find((m) => m.type === 'VIDEO');
await call('POST', `/media/${photoM.id}/replace`, { token: other, body: { contentType: 'image/jpeg', sizeBytes: 1000 }, expect: 404 });
ok(true, 'user lain tidak bisa mengganti file orang lain');
await call('POST', `/media/${photoM.id}/replace`, { token: user, body: { contentType: 'image/jpeg', sizeBytes: 6 * MB }, expect: 400 });
ok(true, 'foto pengganti > 5 MB ditolak (di luar paket)');
await call('POST', `/media/${photoM.id}/replace`, { token: user, body: { contentType: 'video/mp4', sizeBytes: 1000 }, expect: 400 });
ok(true, 'jenis file harus sama (foto tidak bisa diganti video)');
await call('POST', `/media/${videoM.id}/replace`, { token: user, body: { contentType: 'video/mp4', sizeBytes: 3 * MB }, expect: 400 });
ok(true, 'video sewa tidak boleh lebih besar dari yang sudah dibayar (2 MB)');

const slot = (await call('POST', `/media/${photoM.id}/replace`, { token: user, body: { contentType: 'image/jpeg', sizeBytes: 2 * MB }, expect: 200 })).json;
eq(await upload(slot, 2 * MB + 5), 400, 'unggahan lebih besar dari deklarasi ditolak');
await call('POST', `/media/${slot.mediaId}/confirm`, { token: user, body: {}, expect: 400 });
ok(true, 'konfirmasi sebelum file terunggah ditolak');
eq(await upload(slot, 2 * MB), 200, 'unggah file pengganti');
const confirmed = (await call('POST', `/media/${slot.mediaId}/confirm`, { token: user, body: {}, expect: 200 })).json;
eq(confirmed.replaced, photoM.id, 'penggantian selesai');
const afterReplace = await invAdmin(invitationId);
const newM = afterReplace.media.find((m) => m.id === slot.mediaId);
eq(newM.status, 'ACTIVE', 'file baru langsung aktif (mewarisi status file lama)');
eq(afterReplace.media.find((m) => m.id === photoM.id).status, 'DELETED', 'file lama ditandai dihapus');
eq(new Date(newM.expiresAt).getTime(), new Date(photoM.expiresAt).getTime(), 'masa tayang file pengganti sama dengan aslinya');
const ownerView = (await call('GET', `/invitations/${invitationId}`, { token: user, expect: 200 })).json;
ok(JSON.stringify(ownerView.data).includes(slot.mediaId) && !JSON.stringify(ownerView.data).includes(photoM.id), 'rujukan di isi undangan ikut berganti');
eq((await fetch(photoM.url)).status, 404, 'file lama dihapus dari storage');
eq((await fetch(newM.url)).status, 200, 'file baru dapat diunduh');

const vslot = (await call('POST', `/media/${videoM.id}/replace`, { token: user, body: { contentType: 'video/mp4', sizeBytes: 1 * MB }, expect: 200 })).json;
eq(await upload(vslot, 1 * MB), 200, 'unggah video pengganti yang lebih kecil');
await call('POST', `/media/${vslot.mediaId}/confirm`, { token: user, body: {}, expect: 200 });
const vAfter = (await invAdmin(invitationId)).media.find((m) => m.id === vslot.mediaId);
eq([vAfter.included, vAfter.rentedWeeks, vAfter.rentalPrice], [false, videoM.rentedWeeks, videoM.rentalPrice], 'video pengganti tetap tercatat sewa dengan durasi & harga yang sudah dibayar');

step('Pemeliharaan otomatis: pengingat H-3, masa tenggang, pemulihan, hapus permanen');
await db.query(`update invitations set "expiresAt" = (now() at time zone 'utc') + interval '2 days' where id=$1`, [invitationId]);
let run = (await call('POST', '/admin/maintenance/run', { token: admin, expect: 200 })).json;
eq(run.reminders, 1, 'pengingat H-3 terkirim 1x');
run = (await call('POST', '/admin/maintenance/run', { token: admin, expect: 200 })).json;
eq(run.reminders, 0, 'tidak dikirim ganda');

await db.query(`update invitations set "expiresAt" = (now() at time zone 'utc') - interval '1 hour' where id=$1`, [invitationId]);
await db.query(`update media_files set "expiresAt" = (now() at time zone 'utc') - interval '1 hour' where "invitationId"=$1 and status='ACTIVE'`, [invitationId]);
run = (await call('POST', '/admin/maintenance/run', { token: admin, expect: 200 })).json;
eq([run.expired.invitations, run.expired.media], [1, 7], 'kedaluwarsa -> masa tenggang (undangan + 7 media)');
eq((await invAdmin(invitationId)).status, 'EXPIRED_GRACE', 'status EXPIRED_GRACE');
eq((await call('GET', `/public/invitations/${detail.slug}`, { expect: 410 })).json.status, 'EXPIRED_GRACE', 'halaman publik 410');
await call('PATCH', `/invitations/${invitationId}`, { token: user, body: { data: detail.data }, expect: 409 });
ok(true, 'edit ditolak saat berakhir (harus diperpanjang dulu)');

const ext2 = (await call('POST', `/invitations/${invitationId}/extension-order`, { token: user, body: { weeks: 1 }, expect: 201 })).json;
await call('POST', `/payments/dev/${ext2.id}/confirm`, { token: user, expect: 200 });
const revived = await invAdmin(invitationId);
eq([revived.status, days(revived.expiresAt)], ['ACTIVE', 7], 'perpanjangan dibayar memulihkan undangan dari masa tenggang');
eq(revived.media.filter((m) => m.status === 'ACTIVE').length, 7, 'semua media aktif kembali');
await call('GET', `/public/invitations/${detail.slug}`, { expect: 200 });

await db.query(`update invitations set status='EXPIRED_GRACE', "expiresAt" = (now() at time zone 'utc') - interval '31 days' where id=$1`, [invitationId]);
await db.query(`update media_files set status='EXPIRED_GRACE', "expiresAt" = (now() at time zone 'utc') - interval '31 days' where "invitationId"=$1 and status <> 'DELETED'`, [invitationId]);
const oneUrl = (await invAdmin(invitationId)).media.find((m) => m.status !== 'DELETED').url;
eq((await fetch(oneUrl)).status, 200, 'file masih ada di masa tenggang');
run = (await call('POST', '/admin/maintenance/run', { token: admin, expect: 200 })).json;
ok(run.purged.invitations === 1, 'lewat 30 hari masa tenggang -> dihapus permanen');
eq((await fetch(oneUrl)).status, 404, 'file fisik ikut terhapus dari storage');
await call('GET', `/public/invitations/${detail.slug}`, { expect: 404 });

step('Pemeliharaan: pesanan belum dibayar > 24 jam ditutup & kupon dikembalikan');
const stale = (await call('POST', '/orders', { token: user, body: { ...orderBody, media: [], data: { ...orderBody.data, cover: {}, galeri: {} }, addOns: [] }, expect: 201 })).json.order;
const usedBefore = (await db.query("select \"usedCount\" from coupons where code='TEMANKELUARGA'")).rows[0].usedCount;
await db.query(`update orders set "createdAt" = (now() at time zone 'utc') - interval '25 hours' where id=$1`, [stale.id]);
run = (await call('POST', '/admin/maintenance/run', { token: admin, expect: 200 })).json;
eq(run.staleOrders, 1, '1 pesanan kedaluwarsa ditutup');
eq((await call('GET', `/orders/${stale.id}`, { token: user })).json.status, 'EXPIRED', 'status EXPIRED');
eq((await db.query("select \"usedCount\" from coupons where code='TEMANKELUARGA'")).rows[0].usedCount, usedBefore - 1, 'kuota kupon dikembalikan');

step('Admin: pengguna');
const users = (await call('GET', '/admin/users?q=smoke-user', { token: admin, expect: 200 })).json;
ok(users.items.length === 1 && users.items[0].orders >= 2, 'daftar pengguna + jumlah pesanan');
const uid = users.items[0].id;
eq((await call('PATCH', `/admin/users/${uid}/role`, { token: admin, body: { role: 'ADMIN' }, expect: 200 })).json.role, 'ADMIN', 'ubah peran pengguna');
await call('PATCH', `/admin/users/${uid}/role`, { token: admin, body: { role: 'USER' }, expect: 200 });

console.log(`\n${passed} pengecekan lulus`);
await db.end();
