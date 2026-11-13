import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generated = "C:/Users/ThinkPad/.codex/generated_images/01a1309b-e37e-7b92-880a-a8b0e6c9a1d0";
const handoff = path.join(root, "artwork-handoff/musim");

const themes = {
  semi: { standard: "exec-f3446ba8-50fa-4c67-ab7c-36dddf50c554.png", premium: "exec-257654e1-9162-490d-9c00-1d0056cc4ecb.png", ink: "#4a3040", primary: "#b76182", accent: "#c98fa5" },
  panas: { standard: "exec-0d5296be-478a-449f-818b-e2ab2cb1ef24.png", premium: "exec-83a8226b-5eaf-498e-b713-b8f4a4c628cb.png", ink: "#0f3d3a", primary: "#167d78", accent: "#c79b48" },
  gugur: { standard: "exec-f2b96d68-d9f5-4ded-8d35-49d11cce2f1c.png", premium: "exec-264a7e77-6ace-4af9-9524-7c4ad3e29ac7.png", ink: "#3d2410", primary: "#9a4c17", accent: "#b98535" },
  salju: { standard: "exec-7ca53908-2c38-44d8-9a47-1224b01a6758.png", premium: "exec-65c93983-686c-4335-b57e-909cf24fd90a.png", ink: "#1c2f4a", primary: "#4b6f9e", accent: "#8ca9ca" },
};

function hierarchySvg(theme, { longName = false, premium = false } = {}) {
  const names = longName
    ? `<text class="serif" x="512" y="475" font-size="57" font-style="italic">Alexandra Putri</text><text class="serif" x="512" y="555" font-size="57" font-style="italic">&amp; Muhammad Rasyid</text>`
    : `<text class="serif" x="512" y="520" font-size="82" font-style="italic">Alya &amp; Raka</text>`;
  const buttonX = longName ? 187 : 287;
  const buttonWidth = longName ? 650 : 450;
  const buttonText = longName ? "BUKA UNDANGAN PERNIKAHAN" : "BUKA UNDANGAN";
  const premiumRule = premium
    ? `<line x1="310" y1="650" x2="405" y2="650" stroke="${theme.accent}" stroke-width="2" opacity="0.7"/><line x1="619" y1="650" x2="714" y2="650" stroke="${theme.accent}" stroke-width="2" opacity="0.7"/>`
    : "";
  return Buffer.from(`<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">
    <style>.sans{font-family:Arial,Helvetica,sans-serif;fill:${theme.ink};text-anchor:middle}.serif{font-family:Georgia,'Times New Roman',serif;fill:${theme.ink};text-anchor:middle}</style>
    <text class="sans" x="512" y="355" font-size="24" letter-spacing="8">THE WEDDING OF</text>
    ${names}
    ${premiumRule}
    <text class="sans" x="512" y="735" font-size="29" letter-spacing="6">12 · 12 · 2026</text>
    <text class="sans" x="512" y="914" font-size="20" letter-spacing="2" opacity="0.72">KEPADA YTH.</text>
    <text class="serif" x="512" y="965" font-size="31">Bapak/Ibu/Saudara/i</text>
    <rect x="${buttonX}" y="1050" width="${buttonWidth}" height="94" rx="47" fill="${theme.primary}"/>
    <text x="512" y="1110" font-family="Arial,Helvetica,sans-serif" font-size="${longName ? 20 : 23}" font-weight="700" letter-spacing="${longName ? 2 : 3}" fill="#fff" text-anchor="middle">${buttonText}</text>
  </svg>`);
}

function safeAreaSvg(theme) {
  const z = (x, y, w, h, label, color) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-width="4" stroke-dasharray="16 12"/><text x="${x + 18}" y="${y + 31}" font-family="Arial" font-size="21" font-weight="700" fill="${color}">${label}</text>`;
  return Buffer.from(`<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1536" fill="#fff" fill-opacity="0.56"/>
    ${z(146,305,732,92,"KICKER","#356859")}
    ${z(110,405,804,220,"LONG COUPLE NAMES","#8b3a62")}
    ${z(146,635,732,150,"DIVIDER + DATE","#7b5a22")}
    ${z(120,845,784,170,"GUEST NAME","#3d5b8a")}
    ${z(130,1025,764,165,"WIDE CTA","#8a3d35")}
    <rect x="96" y="270" width="832" height="950" rx="28" fill="none" stroke="${theme.ink}" stroke-width="3" stroke-dasharray="8 12" opacity="0.38"/>
  </svg>`);
}

async function previewBuffer(background, theme, dividerFile, options = {}) {
  const divider = await sharp(dividerFile).resize({ width: options.premium ? 230 : 210, height: 68, fit: "inside" }).toBuffer();
  return sharp(background)
    .resize(1024,1536,{fit:"cover"})
    .composite([{input:hierarchySvg(theme,options),left:0,top:0},{input:divider,left:options.premium?397:407,top:615}])
    .webp({quality:91,effort:6})
    .toBuffer();
}

for (const [id, theme] of Object.entries(themes)) {
  const out = path.join(handoff,id,"v2-final");
  await fs.mkdir(out,{recursive:true});
  const standard = path.join(out,"cover-standard.webp");
  const premium = path.join(out,"cover-premium.webp");
  await sharp(path.join(generated,theme.standard)).resize(1024,1536,{fit:"cover"}).webp({quality:90,effort:6}).toFile(standard);
  await sharp(path.join(generated,theme.premium)).resize(1024,1536,{fit:"cover"}).webp({quality:90,effort:6}).toFile(premium);

  const divider = path.join(handoff,id,"v1","divider.webp");
  const standardPreview = await previewBuffer(standard,theme,divider,{premium:false});
  const premiumPreview = await previewBuffer(premium,theme,divider,{premium:true});
  const longPreview = await previewBuffer(premium,theme,divider,{premium:true,longName:true});

  await sharp(standardPreview).resize(480,720,{fit:"cover"}).webp({quality:89,effort:6}).toFile(path.join(out,"catalog-thumbnail-standard.webp"));
  await sharp(premiumPreview).resize(480,720,{fit:"cover"}).webp({quality:89,effort:6}).toFile(path.join(out,"catalog-thumbnail-premium.webp"));
  await sharp(longPreview).toFile(path.join(out,"long-name-preview.webp"));
  await sharp(premium).composite([{input:safeAreaSvg(theme),left:0,top:0}]).webp({quality:89,effort:6}).toFile(path.join(out,"safe-area-guide.webp"));

  const panels = await Promise.all([
    sharp(standardPreview).resize(360,540,{fit:"cover"}).toBuffer(),
    sharp(premiumPreview).resize(360,540,{fit:"cover"}).toBuffer(),
    sharp(longPreview).resize(360,540,{fit:"cover"}).toBuffer(),
  ]);
  const labels=Buffer.from(`<svg width="1160" height="70" xmlns="http://www.w3.org/2000/svg"><rect width="1160" height="70" fill="#f4f1ec"/><g font-family="Arial" font-size="18" font-weight="700" letter-spacing="2" fill="${theme.ink}" text-anchor="middle"><text x="200" y="43">STANDARD</text><text x="580" y="43">PREMIUM</text><text x="960" y="43">LONG NAME</text></g></svg>`);
  await sharp({create:{width:1160,height:630,channels:4,background:{r:244,g:241,b:236,alpha:1}}})
    .composite([{input:labels,left:0,top:0},{input:panels[0],left:20,top:70},{input:panels[1],left:400,top:70},{input:panels[2],left:780,top:70}])
    .webp({quality:89,effort:6}).toFile(path.join(out,"handoff-review.webp"));
}

console.log("Built all seasonal v2-final deliverables.");
