import { generateQrDataUrl } from "@/lib/qr";
import { getInitials, formatLevel, EMERGENCY_CONTACT_LABELS } from "@/lib/format";
import { formatDateForDisplay } from "@/lib/dates";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrDisplay } from "@/components/registration/qr-display";
import type { getStudentProfile } from "@/data/students";

type StudentProfileData = NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>;

// Shared between the coach-facing student profile (/students/[id]) and the
// student's own self-view (/student) — same data, same read-only rendering.
export async function StudentProfileContent({ student, checkIns }: StudentProfileData) {
  const qrDataUrl = await generateQrDataUrl(student.loginCode);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{student.name}</h1>
            {student.status !== "ACTIVE" && (
              <Badge variant={student.status === "REMOVED" ? "destructive" : "secondary"}>{student.status}</Badge>
            )}
            {student.isMapStudent && <Badge variant="outline">MAP student</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatLevel(student.level)} · {student.schoolName}
          </p>
        </div>
      </div>

      <QrDisplay name={student.name} loginCode={student.loginCode} qrDataUrl={qrDataUrl} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{student.contactNumber}</p>
          <p>{student.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Emergency contact</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {student.emergencyContactName} ({EMERGENCY_CONTACT_LABELS[student.emergencyContactRelationship]}) ·{" "}
          {student.emergencyContactPhone}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Check-in history</h2>
        {checkIns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins recorded yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm">
            {checkIns.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-3 py-2">
                <span>{formatDateForDisplay(c.checkInDate)}</span>
                <span className="text-muted-foreground">{c.venue.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
