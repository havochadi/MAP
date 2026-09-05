"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, UserCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/format";
import { signOutAction } from "@/actions/coaches";
import { AppLogo } from "@/components/app-logo";

type NavCoach = { id: string; name: string; isAdmin: boolean };

export function TopNav({ coach }: { coach: NavCoach }) {
  const pathname = usePathname();
  const profileHref = `/coaches/${coach.id}`;
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/curriculum", label: "Curriculum", icon: BookOpen },
    { href: profileHref, label: "Profile", icon: UserCircle },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-sm font-semibold">
          <AppLogo size={28} />
          MAP Coach Portal
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
                  isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          {coach.isAdmin && (
            <>
              <Link
                href="/students"
                aria-current={pathname.startsWith("/students") ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
                  pathname.startsWith("/students") ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Users className="size-4" aria-hidden="true" />
                Students
              </Link>
              <Link
                href="/venues"
                aria-current={pathname.startsWith("/venues") ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  pathname.startsWith("/venues") ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Venues
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
          </Avatar>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
