"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

export type CurrentCoach = { id: string; isAdmin: boolean; name: string; email: string };
export type CurrentStudent = { id: string; name: string };

type SessionState = {
  loading: boolean;
  coach: CurrentCoach | null;
  student: CurrentStudent | null;
};

const initialState: SessionState = { loading: true, coach: null, student: null };
const SessionContext = createContext<SessionState>(initialState);

// The JWT's custom claims tell us which table to look the session up in —
// app_role, NOT role (role is PostgREST's reserved claim, always
// "authenticated" for a signed-in session; see Plan 1's Task 4 hook fix).
function decodeAppRole(session: Session): "coach" | "student" | null {
  try {
    const payload = JSON.parse(atob(session.access_token.split(".")[1])) as { app_role?: string };
    return payload.app_role === "coach" || payload.app_role === "student" ? payload.app_role : null;
  } catch {
    return null;
  }
}

async function resolveSession(session: Session | null): Promise<SessionState> {
  if (!session) return { loading: false, coach: null, student: null };

  const appRole = decodeAppRole(session);

  if (appRole === "coach") {
    const { data } = await supabase
      .from("Coach")
      .select("id, name, email, isAdmin")
      .eq("authUserId", session.user.id)
      .maybeSingle();
    return { loading: false, coach: data, student: null };
  }

  if (appRole === "student") {
    const { data } = await supabase.from("Student").select("id, name").eq("authUserId", session.user.id).maybeSingle();
    return { loading: false, coach: null, student: data };
  }

  return { loading: false, coach: null, student: null };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => resolveSession(data.session).then((s) => !cancelled && setState(s)));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveSession(session).then((s) => !cancelled && setState(s));
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}

// Every page that touches a specific class/student must call one of these
// (or useRequireAdmin) — RLS is the real boundary, but a signed-out user
// should never even see a loading skeleton for a page they can't use.
export function useRequireCoach(): CurrentCoach | null {
  const { loading, coach } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !coach) router.replace("/login");
  }, [loading, coach, router]);
  return coach;
}

export function useRequireAdmin(): CurrentCoach | null {
  const coach = useRequireCoach();
  const router = useRouter();
  useEffect(() => {
    if (coach && !coach.isAdmin) router.replace("/");
  }, [coach, router]);
  return coach?.isAdmin ? coach : null;
}

export function useRequireStudent(): CurrentStudent | null {
  const { loading, student } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !student) router.replace("/login");
  }, [loading, student, router]);
  return student;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
