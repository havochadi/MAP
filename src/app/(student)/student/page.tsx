import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/session";
import { getStudentProfile } from "@/data/students";
import { StudentProfileContent } from "@/components/students/student-profile-content";

export default async function StudentDashboardPage() {
  const student = await requireStudent();
  const data = await getStudentProfile(student.id);
  if (!data) redirect("/login");

  return <StudentProfileContent {...data} />;
}
