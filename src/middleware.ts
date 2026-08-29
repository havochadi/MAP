import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Built ONLY from the edge-safe config — see src/auth.config.ts for why.
export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
