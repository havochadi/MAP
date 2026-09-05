import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCoach } from "@/lib/session";
import { canAccessClass } from "@/lib/authorization";
import { sendGuardianAttendanceNotification } from "@/lib/notifications";

// A real, independently-callable endpoint — not just an internal helper.
// src/actions/attendance.ts calls sendGuardianAttendanceNotification directly
// (same logic, no self-HTTP round trip) when a coach submits attendance;
// this route exists so the same guardian-contact behavior is also reachable
// as its own API, e.g. for testing or a future external caller.
const notifyGuardianSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PRESENT", "LATE"]),
});

export async function POST(request: Request) {
  const coach = await requireCoach().catch(() => null);
  if (!coach) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = notifyGuardianSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  if (!(await canAccessClass(coach.id, parsed.data.classId, coach.isAdmin))) {
    return NextResponse.json({ error: "You don't have access to this class." }, { status: 403 });
  }

  try {
    const result = await sendGuardianAttendanceNotification(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Notification failed." }, { status: 400 });
  }
}
