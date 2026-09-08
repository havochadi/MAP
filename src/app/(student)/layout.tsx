import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/session";
import { Toaster } from "@/components/ui/sonner";
import { StudentTopBar } from "@/components/student/student-top-bar";

// Deliberately a distinct visual shell from the coach (app) layout — a
// warmer background and a welcoming top bar, since this whole route group
// is a student's own view rather than a coach's working tool. The actual
// data cards (StudentProfileContent) stay identical between the two: the
// underlying attendance/progress presentation was already clean and clear,
// it's the surrounding entry experience that needed to feel different.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  return (
    <div className="min-h-svh bg-gradient-to-b from-[color-mix(in_oklch,var(--gradient-primary-start),white_92%)] via-background to-background">
      <StudentTopBar name={student.name} />
      <main className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6">{children}</main>
      <Toaster />
    </div>
  );
}
