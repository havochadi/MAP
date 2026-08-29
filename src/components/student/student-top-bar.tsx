import { LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/coaches";

export function StudentTopBar({ name }: { name: string }) {
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
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </header>
  );
}
