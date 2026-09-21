import { supabase } from "@/lib/supabase/client";

export async function getCheckInNotifications() {
  const { data, error } = await supabase
    .from("CheckInNotification")
    .select("*")
    .order("sentAt", { ascending: false });
  if (error) throw error;
  return data;
}
