"use client";

import { useCallback, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { scanCheckIn } from "@/actions/checkins";
import { clockOut } from "@/actions/coach-shifts";
import { Scanner } from "@/components/checkin/scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Shift = { id: string; venue: { name: string }; clockInAt: Date };

export function CheckInDesk({ shift, initialCount }: { shift: Shift; initialCount: number }) {
  const [scanning, setScanning] = useState(true);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [count, setCount] = useState(initialCount);
  const [manualCode, setManualCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isClockingOut, startClockOutTransition] = useTransition();

  // Stable across renders (empty dep array) — Scanner's effect re-inits the
  // camera every time this reference changes, which would otherwise flicker
  // on every state update this component makes.
  const handleCode = useCallback((code: string) => {
    setScanning(false);
    startTransition(async () => {
      const result = await scanCheckIn({ code });
      if (result.outcome === "checked_in") {
        setLastMessage(`${result.studentName} checked in.`);
        setCount((c) => c + 1);
      } else if (result.outcome === "already_checked_in") {
        setLastMessage(`${result.studentName} already checked in today.`);
      } else if (result.outcome === "not_found") {
        setLastMessage("Code not recognized — not registered yet.");
      } else {
        toast.error(result.error);
        setScanning(true);
      }
    });
  }, []);

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    setManualCode("");
    handleCode(code);
  }

  function handleClockOut() {
    startClockOutTransition(async () => {
      const result = await clockOut({ shiftId: shift.id });
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-gradient-to-r from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white">
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Clocked in at {shift.venue.name}</p>
            <p className="text-xs opacity-80">
              since {new Date(shift.clockInAt).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            onClick={handleClockOut}
            disabled={isClockingOut}
          >
            Clock Out
          </Button>
        </CardContent>
      </Card>

      {scanning ? (
        <Scanner onDecode={handleCode} active={scanning} />
      ) : (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm font-medium">{isPending ? "Checking…" : lastMessage}</p>
            <Button
              onClick={() => {
                setLastMessage(null);
                setScanning(true);
              }}
            >
              Scan next
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Or type code, e.g. GHW7UD"
          autoCapitalize="characters"
          className="text-center uppercase tracking-[0.2em]"
        />
        <Button type="submit" variant="outline">
          Check in
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{count} checked in this shift</span>
        <Link href="/checkin/register" className="underline">
          Register new visitor
        </Link>
      </div>
    </div>
  );
}
