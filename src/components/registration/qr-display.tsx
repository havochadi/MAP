// No "use client" — a plain presentational component with no hooks or
// server-only APIs. Its qrDataUrl prop may have been generated server-side
// (student profile pages) or client-side (RegistrationFlow, right after a
// successful registration, before any navigation) — this component doesn't
// care which.
import { Card, CardContent } from "@/components/ui/card";

export function QrDisplay({ name, loginCode, qrDataUrl }: { name: string; loginCode: string; qrDataUrl: string }) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm font-medium opacity-90">{name}&apos;s check-in code</p>
        <div className="rounded-2xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, not an optimizable remote/static asset */}
          <img src={qrDataUrl} alt={`QR code for ${name}`} width={192} height={192} />
        </div>
        <p className="font-mono text-lg font-semibold tracking-[0.3em]">{loginCode}</p>
        <p className="max-w-xs text-xs opacity-80">
          Screenshot this or save the code — a coach scans it every time you visit a study space.
        </p>
      </CardContent>
    </Card>
  );
}
