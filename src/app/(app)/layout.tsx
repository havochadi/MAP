import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentCoach } from "@/lib/session";
import { TopNav } from "@/components/nav/top-nav";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const coach = await getCurrentCoach();
  // Middleware already gates unauthenticated requests, but this page still
  // needs the session to render the nav — checking again here is effectively
  // free and keeps this layout correct even if it's ever reached another way.
  if (!coach) redirect("/login");

  return (
    <div className="flex min-h-svh flex-col">
      <TopNav coach={coach} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-4 md:pb-8">{children}</main>
      <BottomTabBar profileHref={`/coaches/${coach.id}`} isAdmin={coach.isAdmin} />
      <Toaster />
    </div>
  );
}
