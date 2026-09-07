"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

export function Scanner({ onDecode, active }: { onDecode: (code: string) => void; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !videoRef.current) return;

    const scanner = new QrScanner(videoRef.current, (result) => onDecode(result.data), {
      highlightScanRegion: true,
      highlightCodeOutline: true,
      preferredCamera: "environment",
    });

    scanner.start().catch(() => {
      setError("Couldn't access the camera — check permissions, or use the code field below.");
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [active, onDecode]);

  if (error) {
    return <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{error}</p>;
  }

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      className="aspect-square w-full rounded-2xl bg-black object-cover"
    />
  );
}
