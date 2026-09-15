import { supabase } from "@/lib/supabase/client";
import { getSingaporeTodayString } from "@/lib/dates";
import { createClassSchema } from "@/validations/class";
import type { ActionResult } from "./types";

export async function getClassesForCoach(coachId: string, isAdmin: boolean) {
  let classIds: string[] | null = null;
  if (!isAdmin) {
    const { data: assignments, error } = await supabase.from("ClassAssignment").select("classId").eq("coachId", coachId);
    if (error) throw error;
    classIds = assignments.map((a) => a.classId);
    if (classIds.length === 0) return [];
  }

  let query = supabase
    .from("Class")
    .select("*, venue:Venue(*)")
    .order("level", { ascending: true });
  if (classIds) query = query.in("id", classIds);
  const { data: classes, error: classesError } = await query;
  if (classesError) throw classesError;
  if (classes.length === 0) return [];

  const ids = classes.map((c) => c.id);
  const today = getSingaporeTodayString();

  const [{ data: sessions, error: sessionsError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
    supabase.from("AttendanceSession").select("*").in("classId", ids).eq("sessionDate", today),
    supabase.from("Enrollment").select("classId").in("classId", ids).eq("status", "ACTIVE"),
  ]);
  if (sessionsError) throw sessionsError;
  if (enrollmentsError) throw enrollmentsError;

  const sessionByClass = new Map(sessions.map((s) => [s.classId, s]));
  const countByClass = new Map<string, number>();
  for (const e of enrollments) countByClass.set(e.classId, (countByClass.get(e.classId) ?? 0) + 1);

  return classes
    .sort((a, b) => a.venue.name.localeCompare(b.venue.name) || a.level.localeCompare(b.level))
    .map((cls) => ({
      ...cls,
      studentCount: countByClass.get(cls.id) ?? 0,
      todaySession: sessionByClass.get(cls.id) ?? null,
    }));
}

export async function getClassById(classId: string) {
  const { data, error } = await supabase.from("Class").select("*, venue:Venue(*)").eq("id", classId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getClassDetail(classId: string) {
  const { data: cls, error: classError } = await supabase
    .from("Class")
    .select("*, venue:Venue(*), enrollments:Enrollment(*, student:Student(*))")
    .eq("id", classId)
    .eq("enrollments.status", "ACTIVE")
    .maybeSingle();
  if (classError) throw classError;
  if (!cls) return null;

  const { data: assignments, error: assignmentsError } = await supabase
    .from("ClassAssignment")
    .select("*")
    .eq("classId", classId);
  if (assignmentsError) throw assignmentsError;

  const coachIds = assignments.map((a) => a.coachId);
  const { data: coaches, error: coachesError } =
    coachIds.length === 0
      ? { data: [], error: null }
      : await supabase.from("coach_public").select("id, name, isAdmin").in("id", coachIds);
  if (coachesError) throw coachesError;
  const coachById = new Map(coaches.map((c) => [c.id, c]));

  return {
    ...cls,
    enrollments: cls.enrollments.sort((a, b) => a.student.name.localeCompare(b.student.name)),
    assignments: assignments
      .map((a) => ({ ...a, coach: coachById.get(a.coachId) ?? null }))
      .sort((a, b) => (a.coach?.name ?? "").localeCompare(b.coach?.name ?? "")),
  };
}

export async function getAllClassesForSelect() {
  const { data: classes, error } = await supabase
    .from("Class")
    .select("*, venue:Venue(*)")
    .order("level", { ascending: true });
  if (error) throw error;
  return classes.sort((a, b) => a.venue.name.localeCompare(b.venue.name) || a.level.localeCompare(b.level));
}

export async function getAllVenuesWithClassCounts() {
  const { data: venues, error: venuesError } = await supabase.from("Venue").select("*").order("name", { ascending: true });
  if (venuesError) throw venuesError;
  if (venues.length === 0) return [];

  const venueIds = venues.map((v) => v.id);
  const [{ data: classes, error: classesError }, { data: checkIns, error: checkInsError }] = await Promise.all([
    supabase.from("Class").select("venueId").in("venueId", venueIds),
    supabase.from("CheckIn").select("venueId").in("venueId", venueIds),
  ]);
  if (classesError) throw classesError;
  if (checkInsError) throw checkInsError;

  const classCount = new Map<string, number>();
  for (const c of classes) classCount.set(c.venueId, (classCount.get(c.venueId) ?? 0) + 1);
  const checkInCount = new Map<string, number>();
  for (const c of checkIns) checkInCount.set(c.venueId, (checkInCount.get(c.venueId) ?? 0) + 1);

  return venues.map((v) => ({
    ...v,
    _count: { classes: classCount.get(v.id) ?? 0, checkIns: checkInCount.get(v.id) ?? 0 },
  }));
}

export async function getVenueWithClasses(venueId: string) {
  const { data: venue, error: venueError } = await supabase.from("Venue").select("*").eq("id", venueId).maybeSingle();
  if (venueError) throw venueError;
  if (!venue) return null;

  const { data: classes, error: classesError } = await supabase
    .from("Class")
    .select("*, enrollments:Enrollment(*)")
    .eq("venueId", venueId)
    .eq("enrollments.status", "ACTIVE");
  if (classesError) throw classesError;

  return {
    ...venue,
    classes: classes
      .map((c) => ({ ...c, _count: { enrollments: c.enrollments.length } }))
      .sort((a, b) => a.level.localeCompare(b.level) || a.subject.localeCompare(b.subject)),
  };
}

export async function createClass(input: unknown): Promise<ActionResult<{ classId: string }>> {
  const parsed = createClassSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("Class")
    .insert({ id: crypto.randomUUID(), ...parsed.data })
    .select("id")
    .single();
  if (error || !data) return { success: false, error: "Could not create class." };
  return { success: true, data: { classId: data.id } };
}
