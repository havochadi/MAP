import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const LOGIN_LOCK_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string") {
    return Response.json({ error: "email and password are required." }, { status: 400, headers: corsHeaders });
  }

  const { data: coach, error: coachError } = await admin
    .from("Coach")
    .select('id, "authUserId", "failedLoginAttempts", "lockedUntil"')
    .eq("email", email)
    .maybeSingle();

  if (coachError) {
    return Response.json({ error: "Lookup failed." }, { status: 500, headers: corsHeaders });
  }
  if (!coach || !coach.authUserId) {
    return Response.json({ error: "Invalid email or password." }, { status: 401, headers: corsHeaders });
  }
  if (coach.lockedUntil && new Date(coach.lockedUntil) > new Date()) {
    return Response.json({ error: "Account temporarily locked. Try again later." }, { status: 423, headers: corsHeaders });
  }

  const { data: signInData, error: signInError } = await admin.auth.signInWithPassword({ email, password });

  if (signInError || !signInData.session) {
    const attempts = coach.failedLoginAttempts + 1;
    await admin
      .from("Coach")
      .update({
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= LOGIN_LOCK_ATTEMPTS
            ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString()
            : coach.lockedUntil,
      })
      .eq("id", coach.id);
    return Response.json({ error: "Invalid email or password." }, { status: 401, headers: corsHeaders });
  }

  if (coach.failedLoginAttempts > 0 || coach.lockedUntil) {
    await admin.from("Coach").update({ failedLoginAttempts: 0, lockedUntil: null }).eq("id", coach.id);
  }

  return Response.json({ session: signInData.session }, { status: 200, headers: corsHeaders });
});
