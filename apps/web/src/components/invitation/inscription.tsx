'use client';

// Nama tamu ditulis huruf demi huruf, dengan titik cahaya yang menyapu seperti ujung pena (dipakai gerbang
// portal sihir & kayon). Per kata dibungkus supaya baris hanya patah di spasi; ukuran huruf mengecil untuk
// nama panjang (maks. 60 karakter dari ?to=). Warna teks & titik cahaya dari pemanggil (kelas Tailwind).
import { Fragment } from 'react';
import { motion } from 'motion/react';

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function Inscription({ text, reduced, start, step = 0.045, className, sparkClassName }: {
  text: string;
  reduced: boolean;
  // detik sejak gerbang tampil sampai huruf pertama muncul
  start: number;
  // detik per huruf
  step?: number;
  className: string;
  sparkClassName: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((n, w) => n + w.length, 0);
  const size = total <= 18 ? 'text-[1.05rem]' : total <= 32 ? 'text-[0.92rem]' : 'text-[0.8rem]';
  let index = 0;
  return (
    <p className={`relative mt-1 font-semibold leading-snug ${size} ${className}`}>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          {wi > 0 && ' '}
          <span className="inline-block whitespace-nowrap">
            {[...word].map((ch) => {
              const i = index++;
              return (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: 5, scale: 1.3 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={reduced ? { duration: 0 } : { delay: r3(start + i * step), duration: 0.35 }}
                >
                  {ch}
                </motion.span>
              );
            })}
          </span>
        </Fragment>
      ))}
      {!reduced && (
        <motion.span
          className={`pointer-events-none absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${sparkClassName}`}
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ delay: start, duration: r3(total * step + 0.25), ease: 'linear' }}
          aria-hidden
        />
      )}
    </p>
  );
}
