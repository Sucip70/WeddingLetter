// Ornamen SVG kecil untuk undangan (warna mengikuti currentColor sehingga ikut tema).

export function Divider({ className = 'w-40' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 12" className={className} fill="none" aria-hidden>
      <path d="M0 6h64M96 6h64" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <path d="M80 1l5 5-5 5-5-5z" fill="currentColor" />
      <circle cx="68" cy="6" r="1.5" fill="currentColor" opacity=".6" />
      <circle cx="92" cy="6" r="1.5" fill="currentColor" opacity=".6" />
    </svg>
  );
}

export function Sprig({ className = 'w-24', flip }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" aria-hidden>
      <path d="M4 52C30 46 56 34 86 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {[
        [22, 47, -30],
        [36, 41, 20],
        [48, 35, -35],
        [60, 29, 18],
        [72, 22, -32],
        [84, 15, 15],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="9" ry="3.6" transform={`rotate(${r} ${x} ${y})`} fill="currentColor" opacity={0.55 + (i % 3) * 0.15} />
      ))}
      <circle cx="94" cy="9" r="3" fill="currentColor" />
      <circle cx="102" cy="5" r="2" fill="currentColor" opacity=".6" />
    </svg>
  );
}

export function Corner({ className = 'w-28', rotate = 0 }: { className?: string; rotate?: 0 | 90 | 180 | 270 }) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={{ transform: `rotate(${rotate}deg)` }} fill="none" aria-hidden>
      <path d="M4 116C4 56 56 4 116 4" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
      <path d="M4 92C4 46 46 4 92 4" stroke="currentColor" strokeWidth="1" opacity=".4" />
      <path d="M4 68C4 34 34 4 68 4" stroke="currentColor" strokeWidth=".8" opacity=".3" />
      {[
        [16, 34],
        [26, 22],
        [40, 14],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="8" ry="3.2" transform={`rotate(${-40 + i * 25} ${x} ${y})`} fill="currentColor" opacity={0.5 + i * 0.1} />
      ))}
      <circle cx="10" cy="10" r="4" fill="currentColor" />
      <circle cx="20" cy="8" r="2" fill="currentColor" opacity=".6" />
      <circle cx="8" cy="20" r="2" fill="currentColor" opacity=".6" />
    </svg>
  );
}

export function Monogram({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className} aria-hidden>
      {text}
    </div>
  );
}

export function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}
