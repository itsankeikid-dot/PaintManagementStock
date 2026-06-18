/**
 * One-time script to hash all existing plaintext PINs in the database.
 * Run with: npx tsx scripts/hash-existing-pins.ts
 *
 * This script:
 * 1. Fetches all users from Supabase
 * 2. Identifies plaintext PINs (not starting with $2a$ or $2b$)
 * 3. Hashes them with bcrypt and updates the database
 */
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(import.meta.dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Use service role key — needed after RLS is enabled (anon can't access users table)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("🔍 Fetching all users...\n");
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, pin");

  if (error) {
    console.error("❌ Error fetching users:", error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log("No users found.");
    return;
  }

  let hashed = 0;
  let skipped = 0;

  for (const user of users) {
    const pin = user.pin as string;

    // Skip already hashed PINs
    if (pin.startsWith("$2a$") || pin.startsWith("$2b$")) {
      skipped++;
      console.log(`⏭️  ${user.name} — already hashed`);
      continue;
    }

    // Hash the plaintext PIN
    const hashedPin = await bcrypt.hash(pin, 10);
    const { error: updateError } = await supabase
      .from("users")
      .update({ pin: hashedPin })
      .eq("id", user.id);

    if (updateError) {
      console.error(`❌ ${user.name} — update failed:`, updateError.message);
    } else {
      hashed++;
      console.log(`✅ ${user.name} — PIN hashed`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total users: ${users.length}`);
  console.log(`   Hashed:      ${hashed}`);
  console.log(`   Skipped:     ${skipped}`);
}

main().catch(console.error);
