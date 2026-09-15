import { supabase } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/database.types";

type Subject = Enums<"Subject">;
type Level = Enums<"Level">;

export async function getSubjectLevelCombos() {
  const { data, error } = await supabase
    .from("CurriculumTopic")
    .select("subject, level")
    .order("subject", { ascending: true })
    .order("level", { ascending: true });
  if (error) throw error;
  // Postgres has no client-side DISTINCT equivalent in supabase-js — dedupe
  // in JS instead of the DB, matching Prisma's `distinct: ["subject", "level"]`.
  const seen = new Set<string>();
  return data.filter((row) => {
    const key = `${row.subject}:${row.level}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getTopics(subject: Subject, level: Level) {
  const { data, error } = await supabase
    .from("CurriculumTopic")
    .select("*")
    .eq("subject", subject)
    .eq("level", level)
    .order("order", { ascending: true });
  if (error) throw error;
  return data;
}
