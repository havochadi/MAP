import { createClient } from "npm:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerToken = authHeader.replace("Bearer ", "");
  const { data: callerUser, error: callerError } = await admin.auth.getUser(callerToken);
  if (callerError || !callerUser.user) {
    return Response.json({ error: "Unauthenticated." }, { status: 401, headers: corsHeaders });
  }

  // Authoritative check against the database, not the JWT claim — this
  // function bypasses RLS anyway (service role), so there's no cost to
  // reading the live value instead of trusting a cached claim.
  const { data: callerCoach } = await admin
    .from("Coach")
    .select('"isAdmin"')
    .eq("authUserId", callerUser.user.id)
    .maybeSingle();
  if (!callerCoach?.isAdmin) {
    return Response.json({ error: "Admin access required." }, { status: 403, headers: corsHeaders });
  }

  const { name, email, password, phone, isAdmin } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return Response.json({ error: "name, email, and password are required." }, { status: 400, headers: corsHeaders });
  }

  const { data: newAuthUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !newAuthUser.user) {
    return Response.json({ error: createError?.message ?? "Could not create login." }, { status: 400, headers: corsHeaders });
  }

  // Coach.passwordHash is still NOT NULL (Global Constraints: it's not
  // dropped until Plan 2, since src/auth.ts's NextAuth path still reads
  // it) — hash the same password at the same cost factor as the existing
  // admin coach-creation flow (src/actions/coaches.ts) so it stays valid
  // there too, not just via this new Supabase-auth path.
  const passwordHash = await bcrypt.hash(password, 12);

  const { data: coach, error: insertError } = await admin
    .from("Coach")
    // id: Prisma's @default(cuid()) only runs client-side in Prisma Client —
    // a direct PostgREST insert must supply its own id (see register-student,
    // Task 7, which hit this as a NOT NULL violation first).
    .insert({
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      phone: phone ?? null,
      isAdmin: Boolean(isAdmin),
      authUserId: newAuthUser.user.id,
    })
    .select("id")
    .single();
  if (insertError || !coach) {
    return Response.json({ error: "Could not create coach profile." }, { status: 400, headers: corsHeaders });
  }

  return Response.json({ coachId: coach.id }, { status: 200, headers: corsHeaders });
});
