import type { NextAuthConfig } from "next-auth";

// Edge-safe half of the auth config: no Prisma, no bcrypt, no providers.
// middleware.ts (which runs on the Edge runtime) is built from this file
// only — auth.ts (Node runtime, Credentials + Prisma + bcrypt) extends it.
export default {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      if (isOnLogin) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: "coach" | "student" }).role;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "coach" | "student";
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
