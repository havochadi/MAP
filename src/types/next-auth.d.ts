import { DefaultSession } from "next-auth";

// Two very different account types share one auth system: a Coach (email +
// password, full session) and a Student (login code only, read-only self
// view). `role` is how every guard tells them apart. `isAdmin` is always
// present but only ever meaningful for role "coach" — kept non-optional so
// the existing coach-only code (canAccessClass, requireAdmin, etc.) doesn't
// need null-checks; students simply never reach those guards.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "coach" | "student";
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "coach" | "student";
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "coach" | "student";
    isAdmin: boolean;
  }
}
