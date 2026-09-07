import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getStudentProfile } from "@/data/students";
import { StudentProfileContent } from "@/components/students/student-profile-content";
import { LoginCodeCard } from "@/components/students/login-code-card";

export default async function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const coach = await requireCoach();

  const data = await getStudentProfile(studentId);
  if (!data) notFound();

  return (
    <>
      {coach.isAdmin && (
        <div className="mb-4">
          <LoginCodeCard studentId={studentId} initialCode={data.student.loginCode} />
        </div>
      )}
      <StudentProfileContent {...data} />
    </>
  );
}
