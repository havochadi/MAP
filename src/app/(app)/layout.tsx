"use client";

import { Toaster } from "@/components/ui/sonner";
import { useRequireCoach } from "@/lib/supabase/session";
import { TopNav } from "@/components/nav/top-nav";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // useRequireCoach() redirects client-side once it confirms there's no
  // session (see src/lib/supabase/session.tsx) — it returns null both while
  // still resolving AND once redirecting, so rendering nothing until it's
  // truthy is the closest client-side equivalent of the old server-side
  // "redirect before render" behavior.
  const coach = useRequireCoach();
  if (!coach) return null;

  return (
    <div className="flex min-h-svh flex-col">
      <TopNav coach={coach} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-4 md:pb-8">{children}</main>
      <BottomTabBar profileHref={`/coaches/${coach.id}`} isAdmin={coach.isAdmin} />
      <Toaster />
    </div>
  );
}
