import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCoach } from "@/lib/session";
import { sendGuardianCheckInNotification } from "@/lib/notifications";

// Mirrors /api/notify-guardian's shape for the check-in flow — the same
// logic scanCheckIn already calls directly (no self-HTTP round trip); this
// route exists so it's also reachable as its own API, same reasoning as the
// original route's own comment.
const notifyCheckInGuardianSchema = z.object({
  checkInId: z.string().min(1),
});

export async function POST(request: Request) {
  const coach = await requireCoach().catch(() => null);
  if (!coach) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = notifyCheckInGuardianSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  try {
    const result = await sendGuardianCheckInNotification(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Notification failed." }, { status: 400 });
  }
}
