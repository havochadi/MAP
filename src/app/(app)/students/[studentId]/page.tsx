import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { canAccessStudent } from "@/lib/authorization";
import { getStudentProfile } from "@/data/students";
import { getAllClassesForSelect } from "@/data/classes";
import { StudentProfileContent } from "@/components/students/student-profile-content";
import { EnrollInClassForm, DropEnrollmentButton } from "@/components/students/manage-enrollment";
import { LoginCodeCard } from "@/components/students/login-code-card";

export default async function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const coach = await requireCoach();
  if (!(await canAccessStudent(coach.id, studentId, coach.isAdmin))) redirect("/students");

  const data = await getStudentProfile(studentId);
  if (!data) notFound();

  const availableClasses = coach.isAdmin
    ? (await getAllClassesForSelect()).filter((cls) => !data.student.enrollments.some((e) => e.classId === cls.id))
    : [];

  return (
    <>
      {coach.isAdmin && (
        <div className="mb-4">
          <LoginCodeCard studentId={studentId} initialCode={data.student.loginCode} />
        </div>
      )}
      <StudentProfileContent
        {...data}
        classHref={(classId) => `/classes/${classId}`}
        enrollmentExtra={coach.isAdmin ? (enrollmentId) => <DropEnrollmentButton enrollmentId={enrollmentId} /> : undefined}
      />
      {coach.isAdmin && (
        <div className="mt-3">
          <EnrollInClassForm studentId={studentId} availableClasses={availableClasses} />
        </div>
      )}
    </>
  );
}
