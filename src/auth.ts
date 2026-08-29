import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/validations/coach";
import { studentLoginSchema } from "@/validations/student";
import authConfig from "@/auth.config";

const LOGIN_LOCK_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      id: "coach",
      name: "Coach",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const coach = await prisma.coach.findUnique({ where: { email } });
        if (!coach) return null;
        if (coach.lockedUntil && coach.lockedUntil > new Date()) return null;

        const valid = await bcrypt.compare(password, coach.passwordHash);
        if (!valid) {
          const attempts = coach.failedLoginAttempts + 1;
          await prisma.coach.update({
            where: { id: coach.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil:
                attempts >= LOGIN_LOCK_ATTEMPTS
                  ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000)
                  : coach.lockedUntil,
            },
          });
          return null;
        }

        if (coach.failedLoginAttempts > 0) {
          await prisma.coach.update({
            where: { id: coach.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return { id: coach.id, email: coach.email, name: coach.name, role: "coach" as const, isAdmin: coach.isAdmin };
      },
    }),
    Credentials({
      id: "student",
      name: "Student",
      credentials: { code: {} },
      async authorize(raw) {
        const parsed = studentLoginSchema.safeParse(raw);
        if (!parsed.success) return null;

        // The code is the entire credential — see the schema comment on
        // Student.loginCode for why there's no separate lockout counter.
        const student = await prisma.student.findUnique({ where: { loginCode: parsed.data.code.toUpperCase() } });
        if (!student || student.status !== "ACTIVE") return null;

        return { id: student.id, name: student.name, role: "student" as const, isAdmin: false };
      },
    }),
  ],
});
