import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const LOGIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomLoginCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += LOGIN_CODE_ALPHABET[Math.floor(Math.random() * LOGIN_CODE_ALPHABET.length)];
  }
  return code;
}

async function generateUniqueLoginCode(admin: ReturnType<typeof createClient>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomLoginCode();
    const { data } = await admin.from("Student").select("id").eq("loginCode", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique login code after 10 attempts.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => null);
  const required = [
    "name", "level", "contactNumber", "schoolName", "email",
    "emergencyContactName", "emergencyContactRelationship", "emergencyContactPhone",
  ];
  if (!body || required.some((key) => typeof body[key] !== "string" || body[key].length === 0)) {
    return Response.json({ error: "Please check the form — something wasn't filled in correctly." }, { status: 400, headers: corsHeaders });
  }

  const loginCode = await generateUniqueLoginCode(admin);

  const { data: student, error } = await admin
    .from("Student")
    .insert({
      // Prisma's `@default(cuid())` only ever runs client-side in Prisma
      // Client — there's no DB-level default, so inserts via PostgREST
      // (bypassing Prisma) must generate their own id. No code in this repo
      // validates the id's format, so a UUID is fine here.
      id: crypto.randomUUID(),
      name: body.name,
      level: body.level,
      contactNumber: body.contactNumber,
      schoolName: body.schoolName,
      email: body.email,
      isMapStudent: body.isMapStudent ?? true,
      emergencyContactName: body.emergencyContactName,
      emergencyContactRelationship: body.emergencyContactRelationship,
      emergencyContactPhone: body.emergencyContactPhone,
      referralSource: body.referralSource ?? null,
      loginCode,
    })
    .select("id")
    .single();

  if (error || !student) {
    return Response.json({ error: "Registration failed." }, { status: 400, headers: corsHeaders });
  }

  return Response.json({ studentId: student.id, loginCode }, { status: 200, headers: corsHeaders });
});
