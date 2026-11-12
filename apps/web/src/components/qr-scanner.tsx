'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui';

export function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  const opening = useRef(false);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const stopTracks = () => { stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; if (timer.current) clearTimeout(timer.current); };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stopTracks(); }; }, []);
  async function start() {
    if (opening.current || stream.current) return;
    opening.current = true;
    setStarting(true); setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Kamera membutuhkan HTTPS dan browser yang mendukung akses kamera. Gunakan pencarian manual jika tidak tersedia.');
      const { default: decode } = await import('jsqr');
      if (!mounted.current) return;
      const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (!mounted.current) { camera.getTracks().forEach((track) => track.stop()); return; }
      stream.current = camera;
      video.current!.srcObject = camera;
      await video.current!.play();
      if (!mounted.current) { stopTracks(); return; }
      setRunning(true);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Browser tidak mendukung pembacaan QR. Gunakan pencarian manual.');
      const scan = () => {
        if (!mounted.current || !stream.current) return;
        const frame = video.current;
        if (frame && frame.readyState >= 2 && frame.videoWidth && frame.videoHeight) {
          canvas.width = Math.min(frame.videoWidth, 640);
          canvas.height = Math.round(frame.videoHeight * canvas.width / frame.videoWidth);
          context.drawImage(frame, 0, 0, canvas.width, canvas.height);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = decode(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
          if (code?.data) { stopTracks(); setRunning(false); onScan(code.data); return; }
        }
        timer.current = setTimeout(scan, 200);
      };
      scan();
    } catch (err) { stopTracks(); if (mounted.current) { setRunning(false); setError(err instanceof Error ? err.message : 'Kamera tidak dapat dibuka. Periksa izin kamera.'); } }
    finally { opening.current = false; if (mounted.current) setStarting(false); }
  }
  return <div className="space-y-3">
    <video ref={video} muted playsInline hidden={!running} className="max-h-80 w-full rounded-xl bg-black" />
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {running ? <Button variant="secondary" onClick={() => { stopTracks(); setRunning(false); }}>Tutup kamera</Button> : <Button loading={starting} onClick={() => void start()}>Buka kamera untuk scan QR</Button>}
  </div>;
}
