import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("FAIL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey);

async function main() {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) {
    console.error("FAIL:", error.message);
    process.exit(1);
  }
  console.log(`PASS: connected, admin API reachable (${data.users.length} user(s) on page 1)`);
}

main();
