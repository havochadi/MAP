import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || code.length === 0) {
    return Response.json({ error: "code is required." }, { status: 400, headers: corsHeaders });
  }

  const { data: student, error: studentError } = await admin
    .from("Student")
    .select('id, status, "authUserId"')
    .eq("loginCode", code.toUpperCase())
    .maybeSingle();

  if (studentError || !student || student.status !== "ACTIVE" || !student.authUserId) {
    return Response.json({ error: "Invalid code." }, { status: 401, headers: corsHeaders });
  }

  const { data: authUser, error: getUserError } = await admin.auth.admin.getUserById(student.authUserId);
  if (getUserError || !authUser.user?.email) {
    return Response.json({ error: "Account not fully set up." }, { status: 500, headers: corsHeaders });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.user.email,
  });
  if (linkError || !linkData.properties?.hashed_token) {
    return Response.json({ error: "Could not start session." }, { status: 500, headers: corsHeaders });
  }

  const { data: verifyData, error: verifyError } = await admin.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyError || !verifyData.session) {
    return Response.json({ error: "Could not start session." }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ session: verifyData.session }, { status: 200, headers: corsHeaders });
});
