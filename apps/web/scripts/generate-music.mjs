// Membuat pustaka lagu bawaan (apps/web/public/audio/<id>.mp3) lewat sintesis kode.
// Semua trek ORISINAL (komposisi prosedural + instrumen sintetis), jadi bebas royalti dan bebas klaim hak cipta.
// Jalankan:  npm run music -w web            (semua trek)
//            npm run music -w web -- kalimba-taman gamelan-bali   (sebagian)
// Id trek harus sama dengan apps/api/src/templates/music-library.ts. Hasilnya di-commit supaya tidak perlu dibuat ulang.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';

const SR = 22050;
const KBPS = 48;
const TARGET_SECONDS = 40;
const TAU = Math.PI * 2;
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');

// ---------- utilitas ----------

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const atk = (t, a) => Math.min(1, t / a);
const gate = (t, dur, rel) => (t < dur ? 1 : Math.max(0, 1 - (t - dur) / rel));
const decay = (t, tau) => Math.exp(-t / tau);

// Tangga nada dalam semitone (boleh pecahan untuk slendro).
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  slendro: [0, 2.4, 4.8, 7.2, 9.6],
  pelog: [0, 1, 3, 7, 8],
  nusantara: [0, 2, 3, 7, 8],
  hijaz: [0, 1, 4, 5, 7, 8, 10],
};

const scaleNote = (scale, index) => {
  const n = scale.length;
  const octave = Math.floor(index / n);
  return scale[((index % n) + n) % n] + 12 * octave;
};

// ---------- instrumen: (freq, dur, rand) => { len, fn(t) } ----------
// `len` = lama render (detik, termasuk ekor); `fn` dipanggil berurutan sehingga boleh menyimpan state.

function additive(partials, tau, opts = {}) {
  const { attack = 0.004, release = 0.15, tauFall = 0.5 } = opts;
  return (f, dur) => ({
    len: dur + release + tau * 1.5,
    fn: (t) => {
      let v = 0;
      for (let k = 0; k < partials.length; k++) {
        const [ratio, weight] = partials[k];
        if (f * ratio > SR / 2.2) continue;
        v += weight * Math.sin(TAU * f * ratio * t) * decay(t, tau / (1 + tauFall * k));
      }
      return v * atk(t, attack) * (opts.sustain ? gate(t, dur, release) : 1);
    },
  });
}

function karplus(damp, tau, brightness = 1) {
  return (f, dur, rand) => {
    const L = Math.max(2, Math.round(SR / f));
    const line = new Float32Array(L);
    for (let i = 0; i < L; i++) line[i] = (rand() * 2 - 1) * brightness;
    let pos = 0;
    let prev = 0;
    return {
      len: dur + tau * 1.2,
      fn: (t) => {
        const cur = line[pos];
        const out = (cur + prev) * 0.5 * damp;
        line[pos] = out;
        prev = cur;
        pos = (pos + 1) % L;
        return out * atk(t, 0.002) * gate(t, dur + tau, 0.4);
      },
    };
  };
}

function sawPad({ attack, release, cutoff, voices = 3, detune = 0.006, vibrato = 0 }) {
  return (f, dur) => {
    let lp = 0;
    const a = 1 - Math.exp((-TAU * cutoff) / SR);
    return {
      len: dur + release,
      fn: (t) => {
        let v = 0;
        const vib = 1 + vibrato * Math.sin(TAU * 5.2 * t) * Math.min(1, t / 0.6);
        for (let k = 0; k < voices; k++) {
          const ff = f * vib * (1 + (k - (voices - 1) / 2) * detune);
          const ph = (ff * t) % 1;
          v += (2 * ph - 1) / voices;
        }
        lp += a * (v - lp);
        return lp * atk(t, attack) * gate(t, dur, release);
      },
    };
  };
}

function choir({ attack, release }) {
  const vowel = [[1, 1], [2, 0.5], [3, 0.55], [4, 0.3], [5, 0.22], [6, 0.12]];
  return (f, dur) => ({
    len: dur + release,
    fn: (t) => {
      const vib = 1 + 0.004 * Math.sin(TAU * 5 * t);
      let v = 0;
      for (const [r, w] of vowel) {
        v += w * Math.sin(TAU * f * r * vib * t) + w * 0.6 * Math.sin(TAU * f * r * 1.004 * vib * t);
      }
      return (v / 4) * atk(t, attack) * gate(t, dur, release);
    },
  });
}

function pulse(width, tau) {
  return (f, dur) => ({
    len: dur + 0.05,
    fn: (t) => {
      const ph = (f * t) % 1;
      return (ph < width ? 1 : -1) * 0.5 * atk(t, 0.002) * (tau ? decay(t, tau) : 1) * gate(t, dur, 0.03);
    },
  });
}

function triangle() {
  return (f, dur) => ({
    len: dur + 0.05,
    fn: (t) => {
      const ph = (f * t) % 1;
      return (4 * Math.abs(ph - 0.5) - 1) * atk(t, 0.003) * gate(t, dur, 0.04);
    },
  });
}

function sawPluck({ cutoffStart, cutoffEnd, tau }) {
  return (f, dur) => {
    let lp = 0;
    return {
      len: dur + 0.2,
      fn: (t) => {
        const ph = (f * t) % 1;
        const cut = cutoffEnd + (cutoffStart - cutoffEnd) * decay(t, tau);
        const a = 1 - Math.exp((-TAU * cut) / SR);
        lp += a * (2 * ph - 1 - lp);
        return lp * atk(t, 0.003) * gate(t, dur, 0.08);
      },
    };
  };
}

const INSTRUMENTS = {
  piano: additive([[1, 1], [2, 0.45], [3, 0.22], [4, 0.14], [5, 0.07]], 1.3, { attack: 0.003, sustain: true, release: 0.3 }),
  epiano: additive([[1, 1], [2, 0.18], [7, 0.05]], 1.1, { attack: 0.004, sustain: true, release: 0.25 }),
  kalimba: additive([[1, 1], [5.4, 0.16], [8.9, 0.05]], 0.7, { tauFall: 1.5 }),
  marimba: additive([[1, 1], [4, 0.28], [9.2, 0.06]], 0.28, { tauFall: 2 }),
  bell: additive([[1, 1], [2.76, 0.4], [5.4, 0.2], [8.93, 0.1]], 1.6, { tauFall: 0.8 }),
  musicbox: additive([[1, 1], [3.01, 0.3], [6.2, 0.12]], 0.9, { tauFall: 1.2 }),
  gamelan: additive([[1, 1], [1.004, 0.7], [2.32, 0.28], [4.13, 0.12]], 1.5, { tauFall: 0.7 }),
  gong: additive([[1, 1], [1.5, 0.45], [2.02, 0.4], [2.99, 0.2]], 3.2, { tauFall: 0.5, attack: 0.02 }),
  harp: karplus(0.9985, 1.6, 0.8),
  guitar: karplus(0.998, 1.1, 1),
  uke: karplus(0.9965, 0.6, 1),
  oud: karplus(0.9955, 0.9, 1),
  guzheng: karplus(0.999, 1.5, 0.9),
  strings: sawPad({ attack: 0.45, release: 0.7, cutoff: 2200, voices: 4, detune: 0.01, vibrato: 0.003 }),
  softpad: sawPad({ attack: 0.9, release: 1.2, cutoff: 900, voices: 3, detune: 0.008 }),
  cello: sawPad({ attack: 0.12, release: 0.35, cutoff: 1400, voices: 2, detune: 0.004, vibrato: 0.008 }),
  choir: choir({ attack: 0.9, release: 1.1 }),
  chip: pulse(0.25, 0.35),
  chipbass: triangle(),
  synth: sawPluck({ cutoffStart: 3800, cutoffEnd: 500, tau: 0.16 }),
  synthbass: sawPluck({ cutoffStart: 900, cutoffEnd: 180, tau: 0.2 }),
  synthpad: sawPad({ attack: 0.4, release: 0.6, cutoff: 1500, voices: 3, detune: 0.012 }),
};

// Perkusi: (t) => sampel, panjang tetap.
function percHit(kind, rand) {
  if (kind === 'kick') {
    let ph = 0;
    return { len: 0.3, fn: (t) => { ph += (TAU * (46 + 110 * decay(t, 0.03))) / SR; return Math.sin(ph) * decay(t, 0.11) * 1.1; } };
  }
  if (kind === 'snare') {
    return { len: 0.25, fn: (t) => ((rand() * 2 - 1) * 0.6 + Math.sin(TAU * 190 * t) * 0.5) * decay(t, 0.07) };
  }
  if (kind === 'hat') {
    let last = 0;
    return { len: 0.08, fn: (t) => { const n = rand() * 2 - 1; const v = n - last; last = n; return v * 0.35 * decay(t, 0.02); } };
  }
  // shaker
  let last = 0;
  return { len: 0.12, fn: (t) => { const n = rand() * 2 - 1; const v = n - last * 0.6; last = n; return v * 0.22 * atk(t, 0.01) * decay(t, 0.035); } };
}

// ---------- mixer ----------

function createMix(seconds, seed) {
  const N = Math.round(seconds * SR);
  return { N, buf: new Float32Array(N), rand: mulberry32(seed) };
}

// Menulis dengan wrap-around: ekor nada di ujung loop bersambung ke awal, jadi loop mulus.
function play(mix, start, note) {
  const s0 = Math.round(start * SR);
  const n = Math.min(mix.N, Math.round(note.len * SR));
  for (let i = 0; i < n; i++) {
    mix.buf[(s0 + i) % mix.N] += note.fn(i / SR);
  }
}

function playNote(mix, instName, start, midi, dur, amp) {
  const make = INSTRUMENTS[instName];
  if (!make) throw new Error('Instrumen tidak dikenal: ' + instName);
  const note = make(mtof(midi), dur, mix.rand);
  play(mix, start, { len: note.len, fn: (t) => note.fn(t) * amp });
}

function playPerc(mix, kind, start, amp) {
  const hit = percHit(kind, mix.rand);
  play(mix, start, { len: hit.len, fn: (t) => hit.fn(t) * amp });
}

// Reverb Schroeder sederhana. Diproses pada buffer yang diulang dua kali supaya ekornya melingkar mulus.
function reverb(input, wet) {
  if (wet <= 0) return input;
  const N = input.length;
  const x = new Float32Array(N * 2);
  x.set(input, 0);
  x.set(input, N);
  const combs = [0.0297, 0.0371, 0.0411, 0.0437, 0.0533].map((sec) => ({ line: new Float32Array(Math.round(sec * SR)), pos: 0, damp: 0 }));
  const allpass = [0.005, 0.0017].map((sec) => ({ line: new Float32Array(Math.round(sec * SR)), pos: 0 }));
  const fb = 0.72 + wet * 0.2;
  const out = new Float32Array(N * 2);
  for (let i = 0; i < x.length; i++) {
    let s = 0;
    for (const c of combs) {
      const y = c.line[c.pos];
      c.damp = y * 0.6 + c.damp * 0.4;
      c.line[c.pos] = x[i] * 0.3 + c.damp * fb;
      c.pos = (c.pos + 1) % c.line.length;
      s += y;
    }
    for (const a of allpass) {
      const y = a.line[a.pos];
      const v = s + y * 0.5;
      a.line[a.pos] = v;
      s = y - v * 0.5;
      a.pos = (a.pos + 1) % a.line.length;
    }
    out[i] = x[i] * (1 - wet * 0.5) + s * wet * 0.45;
  }
  return out.subarray(N);
}

// ---------- komposisi ----------

function chordSemitones(spec, degree) {
  const idx = [degree, degree + 2, degree + 4];
  if (spec.seventh) idx.push(degree + 6);
  return idx.map((i) => scaleNote(spec.scale, i));
}

function arrange(spec) {
  const beats = spec.beats ?? 4;
  const beatSec = 60 / spec.bpm;
  const barSec = beats * beatSec;
  const prog = spec.prog;
  const bars = prog.length * Math.max(1, Math.round(TARGET_SECONDS / (barSec * prog.length)));
  const seconds = bars * barSec;
  const mix = createMix(seconds, spec.seed ?? 7);
  const rootMidi = spec.root;

  for (const layer of spec.layers) {
    const base = rootMidi + (layer.oct ?? 0);
    const amp = layer.amp ?? 0.3;

    if (layer.kind === 'melody') {
      const rand = mulberry32((layer.seed ?? 3) + 101);
      const n = spec.scale.length;
      const slot = beatSec / 2;
      const slots = Math.round(seconds / slot);
      const slotsPerBar = beats * 2;
      let index = Math.round(n * 1.5);
      for (let s = 0; s < slots; s++) {
        const bar = Math.floor(s / slotsPerBar);
        const inBar = s % slotsPerBar;
        const strong = inBar % 2 === 0;
        if (rand() > (layer.density ?? 0.5) * (strong ? 1.35 : 0.8)) continue;
        const chord = prog[bar % prog.length];
        if (inBar === 0) {
          const target = [chord, chord + 2, chord + 4][Math.floor(rand() * 3)];
          const octaveShift = Math.round((index - target) / n) * n;
          index = target + octaveShift;
        } else {
          const step = [-2, -1, -1, 1, 1, 2][Math.floor(rand() * 6)];
          index += step;
        }
        const low = 0;
        const high = n * (layer.range ?? 2);
        if (index < low) index = low + 1;
        if (index > high) index = high - 1;
        const long = rand() < (layer.hold ?? 0.35);
        playNote(mix, layer.inst, s * slot, base + scaleNote(spec.scale, index), slot * (long ? 2.2 : 1.1), amp);
      }
      continue;
    }

    for (let bar = 0; bar < bars; bar++) {
      const t0 = bar * barSec;
      const chord = chordSemitones(spec, prog[bar % prog.length]);

      if (layer.kind === 'pad') {
        for (const semi of chord) playNote(mix, layer.inst, t0, base + semi, barSec * (layer.hold ?? 1.02), amp / Math.sqrt(chord.length));
      } else if (layer.kind === 'arp') {
        const div = layer.div ?? 2;
        const pattern = layer.pattern ?? [0, 1, 2, 1];
        const steps = beats * div;
        for (let k = 0; k < steps; k++) {
          const p = pattern[k % pattern.length];
          const semi = chord[p % chord.length] + 12 * Math.floor(p / chord.length);
          playNote(mix, layer.inst, t0 + (k / div) * beatSec, base + semi, (beatSec / div) * (layer.len ?? 1.6), amp);
        }
      } else if (layer.kind === 'bass') {
        const every = layer.every ?? beats;
        for (let b = 0; b < beats; b += every) {
          let semi = chord[0];
          if (layer.walk) semi = chord[[0, 2, 1, 2][Math.floor(b / every) % 4]];
          if (layer.octave && Math.floor(b / every) % 2 === 1) semi += 12;
          playNote(mix, layer.inst, t0 + b * beatSec, base + semi, beatSec * every * 0.95, amp);
        }
      } else if (layer.kind === 'stab') {
        for (const b of layer.beats) {
          for (const semi of chord) playNote(mix, layer.inst, t0 + (b - 1) * beatSec, base + semi, beatSec * 0.8, amp / Math.sqrt(chord.length));
        }
      } else if (layer.kind === 'strum') {
        for (const b of layer.beats) {
          chord.forEach((semi, i) => playNote(mix, layer.inst, t0 + (b - 1) * beatSec + i * 0.018, base + semi, beatSec * 0.9, amp));
        }
      } else if (layer.kind === 'perc') {
        for (const [kind, beatList] of Object.entries(layer.hits)) {
          for (const b of beatList) playPerc(mix, kind, t0 + (b - 1) * beatSec, amp);
        }
      }
    }
  }

  const wet = reverb(mix.buf, spec.reverb ?? 0.2);
  return { samples: wet, seconds };
}

// ---------- daftar trek ----------

const perc4 = { kick: [1, 3], snare: [2, 4], hat: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5] };

const TRACK_SPECS = {
  'piano-romantis': {
    bpm: 76, root: 60, scale: SCALES.major, prog: [0, 4, 5, 3], reverb: 0.3, seed: 11,
    layers: [
      { kind: 'arp', inst: 'piano', oct: -12, div: 2, pattern: [0, 1, 2, 3, 2, 1], amp: 0.24 },
      { kind: 'bass', inst: 'piano', oct: -36, amp: 0.3, len: 1 },
      { kind: 'melody', inst: 'piano', oct: 12, amp: 0.3, density: 0.45, seed: 5 },
    ],
  },
  'gitar-akustik': {
    bpm: 96, root: 55, scale: SCALES.major, prog: [0, 4, 5, 3], reverb: 0.15, seed: 12,
    layers: [
      { kind: 'arp', inst: 'guitar', oct: -12, div: 2, pattern: [0, 2, 1, 2, 0, 2, 1, 2], amp: 0.3 },
      { kind: 'bass', inst: 'guitar', oct: -24, every: 2, amp: 0.34 },
      { kind: 'melody', inst: 'guitar', oct: 12, amp: 0.3, density: 0.4, seed: 8 },
    ],
  },
  'kalimba-taman': {
    bpm: 100, root: 60, scale: SCALES.pentatonic, prog: [0, 2, 3, 1], reverb: 0.3, seed: 13,
    layers: [
      { kind: 'arp', inst: 'kalimba', div: 2, pattern: [0, 1, 2, 1], amp: 0.26 },
      { kind: 'melody', inst: 'kalimba', oct: 12, amp: 0.3, density: 0.55, seed: 4 },
      { kind: 'bass', inst: 'chipbass', oct: -24, amp: 0.18 },
    ],
  },
  'harpa-nusantara': {
    bpm: 80, root: 57, scale: SCALES.nusantara, prog: [0, 3, 2, 4], reverb: 0.42, seed: 14,
    layers: [
      { kind: 'arp', inst: 'harp', div: 4, pattern: [0, 1, 2, 3, 4, 3, 2, 1], amp: 0.2, len: 2.2 },
      { kind: 'pad', inst: 'choir', oct: -12, amp: 0.1 },
      { kind: 'melody', inst: 'harp', oct: 12, amp: 0.26, density: 0.35, seed: 6 },
    ],
  },
  'gamelan-slendro': {
    bpm: 66, root: 57, scale: SCALES.slendro, prog: [0, 2, 4, 2], reverb: 0.35, seed: 15,
    layers: [
      { kind: 'arp', inst: 'gamelan', oct: 12, div: 1, pattern: [0, 1, 2, 1], amp: 0.22, len: 2.4 },
      { kind: 'melody', inst: 'gamelan', oct: 12, amp: 0.26, density: 0.4, seed: 9, hold: 0.5 },
      { kind: 'bass', inst: 'gong', oct: -24, amp: 0.4 },
    ],
  },
  'gamelan-bali': {
    bpm: 112, root: 60, scale: SCALES.pelog, prog: [0, 2, 4, 1], reverb: 0.25, seed: 16,
    layers: [
      { kind: 'arp', inst: 'gamelan', oct: 12, div: 4, pattern: [0, 2, 1, 2, 0, 3, 1, 3], amp: 0.2, len: 1.6 },
      { kind: 'melody', inst: 'gamelan', oct: 24, amp: 0.2, density: 0.55, seed: 10 },
      { kind: 'bass', inst: 'gong', oct: -24, amp: 0.4 },
    ],
  },
  'guzheng-tionghoa': {
    bpm: 84, root: 62, scale: SCALES.pentatonic, prog: [0, 3, 1, 4], reverb: 0.35, seed: 17,
    layers: [
      { kind: 'arp', inst: 'guzheng', div: 4, pattern: [0, 1, 2, 3, 4, 5, 4, 3], amp: 0.2, len: 2 },
      { kind: 'melody', inst: 'guzheng', oct: 12, amp: 0.3, density: 0.4, seed: 12 },
      { kind: 'pad', inst: 'softpad', oct: -12, amp: 0.08 },
    ],
  },
  'oud-hijaz': {
    bpm: 90, root: 50, scale: SCALES.hijaz, prog: [0, 0, 3, 0], reverb: 0.25, seed: 18,
    layers: [
      { kind: 'arp', inst: 'oud', oct: 12, div: 2, pattern: [0, 2, 1, 2, 0, 1], amp: 0.3 },
      { kind: 'melody', inst: 'oud', oct: 24, amp: 0.3, density: 0.5, seed: 14 },
      { kind: 'bass', inst: 'oud', oct: -12, every: 2, amp: 0.3 },
      { kind: 'perc', hits: { kick: [1], shaker: [2, 3, 4] }, amp: 0.4 },
    ],
  },
  'paduan-suci': {
    bpm: 60, root: 57, scale: SCALES.major, prog: [0, 3, 4, 0], reverb: 0.55, seed: 19,
    layers: [
      { kind: 'pad', inst: 'choir', oct: 0, amp: 0.3 },
      { kind: 'pad', inst: 'softpad', oct: -24, amp: 0.2 },
      { kind: 'melody', inst: 'bell', oct: 24, amp: 0.14, density: 0.16, seed: 2, hold: 0.8 },
    ],
  },
  'kotak-musik': {
    bpm: 92, beats: 3, root: 72, scale: SCALES.major, prog: [0, 5, 3, 4], reverb: 0.3, seed: 20,
    layers: [
      { kind: 'arp', inst: 'musicbox', div: 2, pattern: [0, 2, 1, 2, 0, 1], amp: 0.2 },
      { kind: 'melody', inst: 'musicbox', oct: 12, amp: 0.26, density: 0.55, seed: 15 },
    ],
  },
  'lonceng-salju': {
    bpm: 84, root: 64, scale: SCALES.major, prog: [0, 5, 3, 4], reverb: 0.5, seed: 21,
    layers: [
      { kind: 'arp', inst: 'bell', div: 2, pattern: [0, 2, 1, 2], amp: 0.16, len: 2 },
      { kind: 'pad', inst: 'strings', oct: -12, amp: 0.16 },
      { kind: 'melody', inst: 'bell', oct: 12, amp: 0.2, density: 0.35, seed: 16, hold: 0.6 },
    ],
  },
  'chiptune-petualangan': {
    bpm: 132, root: 60, scale: SCALES.major, prog: [0, 5, 3, 4], reverb: 0.04, seed: 22,
    layers: [
      { kind: 'arp', inst: 'chip', div: 4, pattern: [0, 1, 2, 1, 0, 2, 1, 2], amp: 0.13, len: 0.9 },
      { kind: 'melody', inst: 'chip', oct: 12, amp: 0.16, density: 0.6, seed: 17, hold: 0.25 },
      { kind: 'bass', inst: 'chipbass', oct: -24, every: 1, amp: 0.3 },
      { kind: 'perc', hits: perc4, amp: 0.3 },
    ],
  },
  'synthwave-malam': {
    bpm: 100, root: 45, scale: SCALES.minor, prog: [0, 5, 2, 6], reverb: 0.3, seed: 23,
    layers: [
      { kind: 'arp', inst: 'synth', oct: 24, div: 2, pattern: [0, 1, 2, 1, 0, 1, 2, 3], amp: 0.2, len: 1.2 },
      { kind: 'pad', inst: 'synthpad', oct: 12, amp: 0.16 },
      { kind: 'bass', inst: 'synthbass', oct: -12, every: 0.5, octave: true, amp: 0.3 },
      { kind: 'perc', hits: perc4, amp: 0.34 },
    ],
  },
  'sinema-string': {
    bpm: 70, root: 50, scale: SCALES.minor, prog: [0, 5, 2, 6], reverb: 0.5, seed: 24,
    layers: [
      { kind: 'pad', inst: 'strings', oct: 0, amp: 0.3 },
      { kind: 'melody', inst: 'cello', oct: 12, amp: 0.26, density: 0.3, seed: 18, hold: 0.7 },
      { kind: 'arp', inst: 'harp', oct: 12, div: 1, pattern: [0, 1, 2, 3], amp: 0.14, len: 3 },
      { kind: 'bass', inst: 'cello', oct: -24, amp: 0.28 },
    ],
  },
  'ambient-galaksi': {
    bpm: 50, root: 55, scale: SCALES.pentatonic, prog: [0, 2, 3, 1], reverb: 0.7, seed: 25,
    layers: [
      { kind: 'pad', inst: 'softpad', oct: 0, amp: 0.3 },
      { kind: 'pad', inst: 'strings', oct: -12, amp: 0.14 },
      { kind: 'melody', inst: 'bell', oct: 24, amp: 0.13, density: 0.2, seed: 19, hold: 0.9 },
    ],
  },
  'jazz-klasik': {
    bpm: 108, root: 60, scale: SCALES.major, seventh: true, prog: [1, 4, 0, 5], reverb: 0.2, seed: 26,
    layers: [
      { kind: 'stab', inst: 'epiano', oct: -12, beats: [1.5, 3.5], amp: 0.34 },
      { kind: 'bass', inst: 'guitar', oct: -36, every: 1, walk: true, amp: 0.4 },
      { kind: 'melody', inst: 'epiano', oct: 12, amp: 0.28, density: 0.5, seed: 20 },
      { kind: 'perc', hits: { hat: [2, 2.5, 4, 4.5], shaker: [1, 3] }, amp: 0.5 },
    ],
  },
  'waltz-paris': {
    bpm: 138, beats: 3, root: 55, scale: SCALES.major, prog: [0, 3, 4, 0], reverb: 0.3, seed: 27,
    layers: [
      { kind: 'bass', inst: 'piano', oct: -24, every: 3, amp: 0.34 },
      { kind: 'stab', inst: 'piano', oct: -12, beats: [2, 3], amp: 0.26 },
      { kind: 'melody', inst: 'strings', oct: 12, amp: 0.2, density: 0.5, seed: 21, hold: 0.5 },
    ],
  },
  'ukulele-pantai': {
    bpm: 104, root: 60, scale: SCALES.major, prog: [0, 4, 5, 3], reverb: 0.1, seed: 28,
    layers: [
      { kind: 'strum', inst: 'uke', beats: [1, 2.5, 3, 4.5], amp: 0.2 },
      { kind: 'melody', inst: 'kalimba', oct: 12, amp: 0.22, density: 0.4, seed: 22 },
      { kind: 'bass', inst: 'guitar', oct: -24, every: 2, amp: 0.3 },
      { kind: 'perc', hits: { shaker: [1.5, 2, 2.5, 3.5, 4, 4.5] }, amp: 0.5 },
    ],
  },
  'cello-gugur': {
    bpm: 68, root: 52, scale: SCALES.minor, prog: [0, 3, 4, 0], reverb: 0.4, seed: 29,
    layers: [
      { kind: 'pad', inst: 'cello', oct: -12, amp: 0.3 },
      { kind: 'melody', inst: 'cello', oct: 12, amp: 0.3, density: 0.35, seed: 23, hold: 0.7 },
      { kind: 'arp', inst: 'piano', oct: 12, div: 1, pattern: [0, 1, 2, 1], amp: 0.14, len: 2.4 },
    ],
  },
  'perayaan-ceria': {
    bpm: 124, root: 62, scale: SCALES.major, prog: [0, 3, 4, 0], reverb: 0.12, seed: 30,
    layers: [
      { kind: 'arp', inst: 'marimba', div: 2, pattern: [0, 2, 1, 2], amp: 0.24 },
      { kind: 'melody', inst: 'marimba', oct: 12, amp: 0.28, density: 0.65, seed: 24, hold: 0.2 },
      { kind: 'bass', inst: 'guitar', oct: -24, every: 1, amp: 0.3 },
      { kind: 'perc', hits: { kick: [1, 3], shaker: [2, 4, 1.5, 3.5] }, amp: 0.4 },
    ],
  },
};

// ---------- ekspor mp3 ----------

function encodeMp3(samples) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  const gain = peak > 0 ? 0.85 / peak : 1;
  const pcm = new Int16Array(samples.length);
  // Encoder MP3 menambah jeda ±50 ms di awal; fade pendek di kedua ujung mencegah bunyi "klik" saat <audio loop> mengulang.
  const fade = Math.round(0.03 * SR);
  for (let i = 0; i < samples.length; i++) {
    const edge = Math.min(1, i / fade, (samples.length - 1 - i) / fade);
    pcm[i] = Math.round(Math.tanh(samples[i] * gain * 1.1) * 32767 * 0.9 * edge);
  }
  const encoder = new Mp3Encoder(1, SR, KBPS);
  const chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const part = encoder.encodeBuffer(pcm.subarray(i, i + 1152));
    if (part.length) chunks.push(Buffer.from(part));
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(Buffer.from(tail));
  return Buffer.concat(chunks);
}

const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const ids = requested.length ? requested : Object.keys(TRACK_SPECS);
mkdirSync(OUT_DIR, { recursive: true });
let total = 0;
for (const id of ids) {
  const spec = TRACK_SPECS[id];
  if (!spec) {
    console.error('Trek tidak dikenal: ' + id);
    process.exitCode = 1;
    continue;
  }
  const started = Date.now();
  const { samples, seconds } = arrange(spec);
  const mp3 = encodeMp3(samples);
  writeFileSync(path.join(OUT_DIR, id + '.mp3'), mp3);
  total += mp3.length;
  console.log(id.padEnd(24) + seconds.toFixed(1).padStart(5) + ' dtk  ' + Math.round(mp3.length / 1024) + ' KB  (' + (Date.now() - started) + ' ms)');
}
console.log('Total ' + (total / 1024 / 1024).toFixed(2) + ' MB');
