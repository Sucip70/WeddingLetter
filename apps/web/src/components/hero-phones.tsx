'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

// Includes the rotated frames, so scaling reserves their full width and height.
const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 700;

export function HeroPhones({ back, front }: { back: ReactNode; front: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const fit = () => setScale(element.clientWidth / CANVAS_WIDTH);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} data-hero-phones className="relative mx-auto aspect-[4/5] w-full max-w-md lg:ml-auto lg:mr-0">
      <div
        className="absolute left-1/2 top-0 origin-top"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, marginLeft: -CANVAS_WIDTH / 2, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}
      >
        <div data-hero-phone="back" className="absolute left-9 top-14 -rotate-[5deg]">{back}</div>
        <div data-hero-phone="front" className="absolute right-9 top-4 rotate-[4deg]">{front}</div>
      </div>
    </div>
  );
}
