import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const handoff = path.join(root, "artwork-handoff/musim");
const generated = "C:/Users/ThinkPad/.codex/generated_images/01a1309b-e37e-7b92-880a-a8b0e6c9a1d0";
const W = 1024;
const H = 1536;
const autumnInteractiveOnly = process.argv.includes("--autumn-interactive-only");

const themes = {
  semi: {
    title: "Spring — Vellum Blossom",
    source: "exec-0b76cc7f-e12f-4922-b9f1-92ec6323c75a.png",
    ink: "#49363d",
    accent: "#8d9a78",
    instruction: "Tap the seal to open",
    duration: 1500,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    cue: "seal scale 1 → 1.025 → 1, once every 4.8s",
  },
  panas: {
    title: "Summer — Golden Tide",
    source: "exec-d690370e-ba02-47f3-9b95-23d973e004a4.png",
    ink: "#174c4b",
    accent: "#b58b43",
    instruction: "Touch the pearl to open",
    duration: 1600,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    cue: "pearl highlight opacity 0.55 → 0.82 → 0.55, once every 5.2s",
  },
  gugur: {
    title: "Autumn — Letter in the Wind",
    source: "exec-a93f4ba3-d487-451f-bdca-233b0a0887d6.png",
    ink: "#4b2d1d",
    accent: "#a85e30",
    instruction: "Release the leaf to open",
    duration: 1650,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    cue: "leaf rotates −1.5° → 1.5° → 0°, once every 5s",
  },
  salju: {
    title: "Winter — Frosted Monogram",
    source: "exec-688a97fa-208a-42d9-9326-f1af4814fa50.png",
    ink: "#1d3453",
    accent: "#7895b8",
    instruction: "Touch to clear the frost",
    duration: 1400,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    cue: "monogram ring opacity 0.7 → 1 → 0.7, once every 5.5s",
  },
};

const svg = (body, width = W, height = H) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
);

function typeLayer(t, { open = 0, reduced = false } = {}) {
  const opacity = open ? Math.max(0.2, 1 - open * 0.42) : 1;
  const nameBlur = t === themes.salju && !open ? "opacity:.62" : "opacity:1";
  return svg(`<style>
    .sans{font-family:Arial,Helvetica,sans-serif;text-anchor:middle;fill:${t.ink}}
    .serif{font-family:Georgia,'Times New Roman',serif;text-anchor:middle;fill:${t.ink}}
  </style>
  <g opacity="${opacity}">
    <text class="sans" x="512" y="382" font-size="21" letter-spacing="7">UNDANGAN PERNIKAHAN</text>
    <text class="serif" x="512" y="515" font-size="76" font-style="italic" style="${nameBlur}">Andi &amp; Sinta</text>
    <line x1="416" y1="570" x2="608" y2="570" stroke="${t.accent}" stroke-width="1.5" opacity=".7"/>
    <text class="sans" x="512" y="646" font-size="18" letter-spacing="3" opacity=".7">Kepada Yth.</text>
    <text class="serif" x="512" y="696" font-size="29">Bapak/Ibu/Saudara/i</text>
    <text class="sans" x="512" y="1058" font-size="19" letter-spacing="2.4" opacity=".78">${t.instruction}</text>
    ${reduced ? `<text class="sans" x="512" y="1110" font-size="15" letter-spacing="1.5" opacity=".5">REDUCED MOTION</text>` : ""}
  </g>`);
}

function springVellum(progress = 0) {
  const lift = Math.round(progress * -90);
  const opacity = 0.82 - progress * 0.42;
  return svg(`<defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#705b58" flood-opacity=".16"/></filter></defs>
    <g transform="translate(0 ${lift})" opacity="${opacity}">
      <rect x="176" y="250" width="672" height="940" rx="8" fill="#fffaf1" fill-opacity=".67" stroke="#d8cfc4" stroke-opacity=".7" filter="url(#s)"/>
      <path d="M210 285 H814 M210 1152 H814" stroke="#fff" stroke-opacity=".42"/>
    </g>`);
}

function springObject(progress = 0) {
  const gap = progress * 130;
  const sealY = 820 - progress * 36;
  const sealOpacity = 1 - progress * 0.55;
  return svg(`<defs>
    <linearGradient id="r" x1="0" x2="1"><stop stop-color="#94a080"/><stop offset=".5" stop-color="#b0b99d"/><stop offset="1" stop-color="#899779"/></linearGradient>
    <radialGradient id="wax"><stop stop-color="#d8a5ab"/><stop offset=".72" stop-color="#b9747f"/><stop offset="1" stop-color="#975964"/></radialGradient>
    <filter id="o"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity=".2"/></filter>
  </defs>
  <path d="M210 ${sealY} C330 ${sealY-12} ${410-gap} ${sealY+10} ${486-gap} ${sealY}" fill="none" stroke="url(#r)" stroke-width="20" opacity=".92"/>
  <path d="M538 ${sealY} C${615+gap} ${sealY+10} ${694+gap} ${sealY-12} 814 ${sealY}" fill="none" stroke="url(#r)" stroke-width="20" opacity=".92"/>
  <g opacity="${sealOpacity}" filter="url(#o)"><circle cx="512" cy="${sealY}" r="48" fill="url(#wax)"/><circle cx="512" cy="${sealY}" r="34" fill="none" stroke="#efd5d2" stroke-opacity=".68"/><path d="M495 ${sealY+4} Q512 ${sealY-22} 529 ${sealY+4} Q512 ${sealY+21} 495 ${sealY+4}" fill="none" stroke="#f4dedd" stroke-width="2"/></g>`);
}

function summerTransition(progress = 0) {
  const split = progress * 95;
  const glow = .55 + progress * .38;
  return svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e8c97f" stop-opacity="0"/><stop offset=".48" stop-color="#d9b45d" stop-opacity="${glow}"/><stop offset="1" stop-color="#fff4cc" stop-opacity="0"/></linearGradient></defs>
    <rect x="501" y="610" width="22" height="430" rx="11" fill="url(#g)"/>
    <g fill="none" stroke="#d7ffff" stroke-width="4" stroke-linecap="round" opacity=".52">
      <path d="M170 ${975+split*.1} C330 ${920+split*.1} 420 ${1020+split*.1} 512 ${975+split*.1} S700 ${925+split*.1} 854 ${975+split*.1}"/>
      <path d="M205 ${1025+split*.25} C345 ${980+split*.25} 430 ${1062+split*.25} 512 ${1025+split*.25} S680 ${986+split*.25} 819 ${1025+split*.25}" opacity=".72"/>
      <path d="M250 ${1070+split*.4} C365 ${1038+split*.4} 443 ${1100+split*.4} 512 ${1070+split*.4} S660 ${1042+split*.4} 774 ${1070+split*.4}" opacity=".48"/>
    </g>
    ${progress ? `<g fill="none" stroke="#f9e5a5" opacity="${.65-progress*.3}"><circle cx="512" cy="850" r="${58+progress*190}" stroke-width="3"/><circle cx="512" cy="850" r="${18+progress*120}" stroke-width="2"/></g>` : ""}`);
}

function summerObject(progress = 0) {
  return svg(`<defs><radialGradient id="p" cx="36%" cy="28%"><stop stop-color="#fff"/><stop offset=".35" stop-color="#f8f1dc"/><stop offset=".72" stop-color="#d9e7df"/><stop offset="1" stop-color="#9fc7c0"/></radialGradient><filter id="d"><feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#145c59" flood-opacity=".22"/></filter></defs>
    <g transform="translate(0 ${-progress*18})" opacity="${1-progress*.55}" filter="url(#d)"><circle cx="512" cy="850" r="42" fill="url(#p)"/><ellipse cx="498" cy="835" rx="11" ry="8" fill="#fff" opacity=".76"/></g>`);
}

function autumnPaper(progress = 0) {
  const x = Math.round(progress * 260);
  const rotate = progress * -5;
  return svg(`<defs><filter id="s"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#6d3820" flood-opacity=".16"/></filter><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b5764d" stop-opacity=".48"/><stop offset="1" stop-color="#d9ae82" stop-opacity=".32"/></linearGradient></defs>
    <rect x="178" y="245" width="668" height="950" rx="7" fill="#fffaf0" stroke="#e2d5c4" filter="url(#s)"/>
    <g transform="translate(${x} 0) rotate(${rotate} 512 720)" opacity="${.78-progress*.25}"><rect x="190" y="265" width="644" height="910" rx="5" fill="url(#c)"/><path d="M215 295 H809 M215 1142 H809" stroke="#f6dbc0" stroke-opacity=".45"/></g>`);
}

function autumnObject(progress = 0) {
  const y = 828 - progress * 170;
  const x = 512 + progress * 175;
  const rot = progress * 300;
  return svg(`<defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c67a42"/><stop offset=".55" stop-color="#9c4e28"/><stop offset="1" stop-color="#71341f"/></linearGradient><filter id="d"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity=".2"/></filter></defs>
    <g transform="translate(${x} ${y}) rotate(${rot}) scale(.72)" opacity="${1-progress*.35}" filter="url(#d)">
      <path d="M0 -74 C-3 -57 -9 -46 -18 -34 C-22 -41 -29 -49 -38 -57 C-36 -44 -35 -34 -38 -26 C-47 -30 -59 -35 -70 -37 C-63 -25 -58 -15 -55 -6 C-65 -5 -75 -3 -84 2 C-71 12 -60 19 -49 23 C-54 31 -58 40 -60 49 C-43 44 -29 38 -16 31 C-12 47 -7 60 0 73 C7 60 12 47 16 31 C29 38 43 44 60 49 C58 40 54 31 49 23 C60 19 71 12 84 2 C75 -3 65 -5 55 -6 C58 -15 63 -25 70 -37 C59 -35 47 -30 38 -26 C35 -34 36 -44 38 -57 C29 -49 22 -41 18 -34 C9 -46 3 -57 0 -74 Z" fill="url(#l)"/>
      <path d="M0 -57 C-2 -18 -1 25 0 92" fill="none" stroke="#f0c493" stroke-width="3" stroke-linecap="round" opacity=".72"/>
      <path d="M-2 -8 C-17 -12 -31 -20 -43 -31 M2 -4 C20 -9 34 -18 47 -30 M-1 20 C-16 23 -28 29 -39 36 M2 18 C17 22 30 29 41 36" fill="none" stroke="#e7b27f" stroke-width="2" stroke-linecap="round" opacity=".48"/>
    </g>`);
}

function winterFrost(progress = 0) {
  const opacity = .58 - progress * .5;
  const radius = progress * 380;
  return svg(`<defs>
    <radialGradient id="clear"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${Math.min(.82,progress+.12)}" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#eaf3fb" stop-opacity="${opacity}"/></radialGradient>
    <filter id="b"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="1024" height="1536" fill="#eaf3fb" fill-opacity="${progress ? 0 : .34}"/>
  <rect x="18" y="18" width="988" height="1500" rx="34" fill="none" stroke="#d9e7f4" stroke-width="34" stroke-opacity="${opacity}" filter="url(#b)"/>
  ${progress ? `<circle cx="512" cy="820" r="${radius}" fill="url(#clear)"/>` : ""}
  <g fill="#fff" opacity="${opacity}"><circle cx="110" cy="230" r="4"/><circle cx="882" cy="340" r="3"/><circle cx="145" cy="1160" r="3"/><circle cx="916" cy="1240" r="4"/></g>`);
}

function winterObject(progress = 0) {
  const glow = progress ? .45 : .12;
  return svg(`<defs><radialGradient id="w"><stop stop-color="#f7dfb7" stop-opacity="${glow}"/><stop offset="1" stop-color="#f7dfb7" stop-opacity="0"/></radialGradient></defs>
    <circle cx="512" cy="820" r="${70+progress*250}" fill="url(#w)"/>
    <g opacity="${1-progress*.3}"><circle cx="512" cy="820" r="72" fill="#eef6fb" fill-opacity=".24" stroke="#294a71" stroke-width="2"/><circle cx="512" cy="820" r="58" fill="none" stroke="#8fa9c7" stroke-width="1"/><text x="512" y="838" text-anchor="middle" font-family="Georgia,serif" font-size="47" font-style="italic" fill="#294a71">A·S</text></g>`);
}

function transitionLayer(id, progress = 0) {
  if (id === "semi") return springVellum(progress);
  if (id === "panas") return summerTransition(progress);
  if (id === "gugur") return autumnPaper(progress);
  return winterFrost(progress);
}

function interactionLayer(id, progress = 0) {
  if (id === "semi") return springObject(progress);
  if (id === "panas") return summerObject(progress);
  if (id === "gugur") return autumnObject(progress);
  return winterObject(progress);
}

async function compositeState(id, t, background, progress, { reduced = false, opened = false } = {}) {
  if (opened) {
    const cover = path.join(handoff, id, "v2-final", "cover-premium.webp");
    return sharp(cover).resize(W, H, { fit: "cover" }).composite([{ input: typeLayer(t, { open: .82 }), left: 0, top: 0 }]).webp({ quality: 91, effort: 6 }).toBuffer();
  }
  return sharp(background).composite([
    { input: transitionLayer(id, progress), left: 0, top: 0 },
    { input: typeLayer(t, { open: progress, reduced }), left: 0, top: 0 },
    { input: interactionLayer(id, progress), left: 0, top: 0 },
  ]).webp({ quality: 91, effort: 6 }).toBuffer();
}

function motionSpec(id, t) {
  const sequences = {
    semi: [
      "0–180 ms: seal depresses by 2 px and scales to 0.97.",
      "180–700 ms: seal releases; sage ribbon separates 130 px toward both sides.",
      "360–1250 ms: vellum lifts 90 px and fades to 40% opacity.",
      "850–1500 ms: gate crossfades into the real invitation cover; edge petals exit once.",
    ],
    panas: [
      "0–160 ms: pearl compresses to 0.96 and the champagne reflection brightens.",
      "160–920 ms: two concentric ripples expand from the pearl.",
      "420–1320 ms: the sea-glass field separates softly left and right using a displacement mask.",
      "980–1600 ms: the reflection fades as the invitation cover resolves behind it.",
    ],
    gugur: [
      "0–180 ms: central leaf lifts 10 px from the paper surface.",
      "180–1050 ms: leaf rotates once and travels upward-right out of the central field.",
      "300–1220 ms: cognac tracing paper slides right 260 px with a slight −5° rotation.",
      "1000–1650 ms: ivory card advances 10 px in scale and dissolves into the invitation cover.",
    ],
    salju: [
      "0–180 ms: monogram acknowledges touch with a restrained warm point of light.",
      "180–1050 ms: frost clears radially from the monogram while the names sharpen.",
      "700–1250 ms: glass opacity falls to zero and the real cover becomes visible.",
      "1100–1400 ms: monogram and warm light fade; optional fine snow begins only after opening.",
    ],
  };
  return `# ${t.title}\n\n## Timing\n\n- Primary transition: ${t.duration} ms\n- Easing: \`${t.easing}\`\n- Waiting-state cue: ${t.cue}; pause entirely when the document is hidden.\n- No continuous decorative motion while waiting.\n\n## Sequence\n\n${sequences[id].map((v, i) => `${i + 1}. ${v}`).join("\n")}\n\n## Reduced motion\n\nSkip translation, rotation, displacement, and particles. On activation, fade the gate to the real cover over 220 ms. The reduced-motion preview is a visually complete closed state, not a disabled or unfinished screen.\n\n## Layer order\n\n1. Real invitation cover (hidden until transition)\n2. \`gate-background.webp\`\n3. \`transition-layer.png\`\n4. Live HTML text\n5. \`interactive-object.png\`\n\nThe interaction target should be at least 64 × 64 CSS px even when the visible object is smaller. All preview text is mock content; production text must be rendered by HTML.\n`;
}

for (const [id, t] of Object.entries(themes)) {
  if (autumnInteractiveOnly && id !== "gugur") continue;
  const out = path.join(handoff, id, "premium-gate-redesign");
  await fs.mkdir(out, { recursive: true });
  const background = path.join(out, "gate-background.webp");
  if (autumnInteractiveOnly) {
    await sharp(interactionLayer(id, 0)).png().toFile(path.join(out, "interactive-object.png"));
    await sharp(await compositeState(id, t, background, 0)).toFile(path.join(out, "closed-preview.webp"));
    await sharp(await compositeState(id, t, background, .52)).toFile(path.join(out, "opening-preview.webp"));
    await sharp(await compositeState(id, t, background, 0, { reduced: true })).toFile(path.join(out, "reduced-motion-preview.webp"));
    continue;
  }
  await sharp(path.join(generated, t.source)).resize(W, H, { fit: "cover" }).webp({ quality: 91, effort: 6 }).toFile(background);
  await sharp(transitionLayer(id, 0)).png().toFile(path.join(out, "transition-layer.png"));
  await sharp(interactionLayer(id, 0)).png().toFile(path.join(out, "interactive-object.png"));
  await sharp(await compositeState(id, t, background, 0)).toFile(path.join(out, "closed-preview.webp"));
  await sharp(await compositeState(id, t, background, .52)).toFile(path.join(out, "opening-preview.webp"));
  await sharp(await compositeState(id, t, background, 1, { opened: true })).toFile(path.join(out, "opened-transition-preview.webp"));
  await sharp(await compositeState(id, t, background, 0, { reduced: true })).toFile(path.join(out, "reduced-motion-preview.webp"));
  await fs.writeFile(path.join(out, "motion-spec.md"), motionSpec(id, t));
  const manifest = {
    schemaVersion: 1,
    designId: id,
    tier: "premium",
    visualRevision: "premium-gate-redesign",
    artboard: { width: W, height: H, aspectRatio: "2:3" },
    productionTextEmbedded: false,
    interaction: { instruction: t.instruction, durationMs: t.duration, easing: t.easing, waitingMotion: "interactive-object-only" },
    safeArea: { left: 150, right: 874, top: 300, bottom: 1125 },
    cropSafeArea: { left: 110, right: 914, top: 190, bottom: 1320 },
    assets: {
      gateBackground: "gate-background.webp",
      interactiveObject: "interactive-object.png",
      transitionLayer: "transition-layer.png",
      closedPreview: "closed-preview.webp",
      openingPreview: "opening-preview.webp",
      openedTransitionPreview: "opened-transition-preview.webp",
      reducedMotionPreview: "reduced-motion-preview.webp",
      motionSpec: "motion-spec.md",
    },
  };
  await fs.writeFile(path.join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(autumnInteractiveOnly ? "Updated Autumn maple object and related previews." : "Built four Premium Seasonal gate redesign packages.");
