"use client";

import { useEffect, useState } from "react";
import { useRequireCoach } from "@/lib/supabase/session";
import { getCheckInNotifications } from "@/lib/api/notifications";
import { parseUtcTimestamp } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Notifications = Awaited<ReturnType<typeof getCheckInNotifications>>;

export default function NotificationsPage() {
  const coach = useRequireCoach();
  const [notifications, setNotifications] = useState<Notifications | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getCheckInNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load notifications.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (notifications === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Guardian check-in notifications.</p>
      </div>
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {parseUtcTimestamp(n.sentAt).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <Badge variant={n.delivered ? "default" : "secondary"}>{n.delivered ? "Delivered" : "Not delivered"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
