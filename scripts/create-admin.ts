import "../src/db/env";
import bcrypt from "bcryptjs";
import { col, createUser, fetchUserByEmail } from "../src/lib/store";
// Usage: ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='long-passphrase' npm run admin:create
const email = process.env.ADMIN_EMAIL?.toLowerCase(); const pw = process.env.ADMIN_PASSWORD;
if (!email || !pw || pw.length < 12) { console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars)."); process.exit(1); }
async function main() {
  const passwordHash = await bcrypt.hash(pw as string, 12);
  const u = await fetchUserByEmail(email as string);
  if (u) await col("users").doc(u.id).update({ role: "ADMIN", passwordHash, active: true });
  else await createUser({ email: email as string, name: "Administrator", passwordHash, role: "ADMIN" });
  console.log("Admin ready:", email);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
