import { auth } from "@/auth";

export type CurrentCoach = {
  id: string;
  isAdmin: boolean;
  name: string;
  email: string;
};

export type CurrentStudent = {
  id: string;
  name: string;
};

export async function getCurrentCoach(): Promise<CurrentCoach | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "coach") return null;
  return {
    id: session.user.id,
    isAdmin: session.user.isAdmin,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

export async function getCurrentStudent(): Promise<CurrentStudent | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") return null;
  return { id: session.user.id, name: session.user.name ?? "" };
}

// Every Server Action and every page that touches a specific class/student
// must call this (or requireAdmin) — middleware only gates "logged in at
// all," never per-resource access or role, and Server Actions are public
// network endpoints regardless of what the UI hides.
export async function requireCoach(): Promise<CurrentCoach> {
  const coach = await getCurrentCoach();
  if (!coach) throw new Error("UNAUTHENTICATED");
  return coach;
}

export async function requireAdmin(): Promise<CurrentCoach> {
  const coach = await requireCoach();
  if (!coach.isAdmin) throw new Error("FORBIDDEN");
  return coach;
}

export async function requireStudent(): Promise<CurrentStudent> {
  const student = await getCurrentStudent();
  if (!student) throw new Error("UNAUTHENTICATED");
  return student;
}
