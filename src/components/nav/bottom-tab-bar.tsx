"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Deliberately not shadcn's Sidebar primitive — a slide-out drawer needs an
// extra tap to open, which works against "fast, standing in a classroom."
// This bar is always visible, thumb-reachable, no open/close step.
export function BottomTabBar({ profileHref, isAdmin }: { profileHref: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "Home", icon: Home },
    ...(isAdmin ? [{ href: "/students", label: "Students", icon: Users }] : []),
    { href: "/curriculum", label: "Curriculum", icon: BookOpen },
    { href: profileHref, label: "Profile", icon: UserCircle },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map((tab) => {
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
