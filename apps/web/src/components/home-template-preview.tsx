'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const HOME_PREVIEW_SIZE = { width: 390, height: 810 } as const;
export function homePreviewScale(width: number) {
  return Math.max(0, width) / HOME_PREVIEW_SIZE.width;
}

// Keep rem-based type, ornaments, photos and card spacing in phone coordinates.
// Only Home uses this wrapper; the invitation and catalog renderers are unchanged.
export function HomeTemplatePreview({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const fit = () => setScale(homePreviewScale(element.clientWidth));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} data-home-template-preview className="relative aspect-[390/810] w-full overflow-hidden" aria-hidden="true" inert>
    <div className="absolute left-0 top-0 origin-top-left" style={{ ...HOME_PREVIEW_SIZE, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}>
      {children}
    </div>
  </div>;
}
