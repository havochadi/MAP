"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createCoachSchema } from "@/validations/coach";
import { classAssignmentSchema } from "@/validations/class";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export type LoginState = { error?: string } | undefined;

export type QuickLoginRole = "coach" | "admin" | "student";

// Demo accounts this project already treats as its designated examples —
// farhan and Amir Hafiz are called out by name in the README as the
// showcase coach/student, admin@map.test is the only admin account that
// exists. Not gated to non-production: these credentials are already
// published in plain text in the README for anyone reading the repo.
const QUICK_LOGIN_COACH_ACCOUNTS: Record<"coach" | "admin", { email: string; password: string }> = {
  coach: { email: "farhan@map.test", password: "Coach123!" },
  admin: { email: "admin@map.test", password: "Coach123!" },
};
const QUICK_LOGIN_STUDENT_CODE = "GHW7UD";

export async function quickLoginAction(role: QuickLoginRole): Promise<LoginState> {
  try {
    if (role === "student") {
      await signIn("student", { code: QUICK_LOGIN_STUDENT_CODE, redirectTo: "/student" });
    } else {
      const { email, password } = QUICK_LOGIN_COACH_ACCOUNTS[role];
      await signIn("coach", { email, password, redirectTo: "/" });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Quick login failed — the demo account may have changed." };
    }
    throw error;
  }
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("coach", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    // signIn()'s internal redirect() throws a tagged error on success — it
    // must propagate, or a successful login silently fails to redirect.
    throw error;
  }
}

export async function studentLoginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("student", {
      code: formData.get("code"),
      redirectTo: "/student",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That code wasn't recognised. Check with your coach and try again." };
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createCoach(input: unknown): Promise<ActionResult<{ coachId: string }>> {
  await requireAdmin();
  const parsed = createCoachSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { name, email, password, phone, isAdmin } = parsed.data;

  const existing = await prisma.coach.findUnique({ where: { email } });
  if (existing) return { success: false, error: "A coach with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 12);
  const coach = await prisma.coach.create({
    data: { name, email, passwordHash, phone, isAdmin },
  });

  revalidatePath("/venues");
  return { success: true, data: { coachId: coach.id } };
}

export async function assignCoachToClass(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = classAssignmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { coachId, classId } = parsed.data;

  const existing = await prisma.classAssignment.findUnique({ where: { coachId_classId: { coachId, classId } } });
  if (existing) return { success: false, error: "Coach is already assigned to this class." };

  await prisma.classAssignment.create({ data: { coachId, classId } });
  revalidatePath(`/classes/${classId}`);
  return { success: true, data: undefined };
}

export async function unassignCoachFromClass(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = classAssignmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { coachId, classId } = parsed.data;

  await prisma.classAssignment.delete({ where: { coachId_classId: { coachId, classId } } });
  revalidatePath(`/classes/${classId}`);
  return { success: true, data: undefined };
}
