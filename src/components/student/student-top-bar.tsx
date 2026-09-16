"use client";

import { LogOut, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase/session";

export function StudentTopBar({ name }: { name: string }) {
  const router = useRouter();
  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="border-b bg-white/60">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="text-base font-semibold">{name}</p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
          <LogOut className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
