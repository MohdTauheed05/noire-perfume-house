// Loads .env.local then .env for CLI scripts (db:seed, admin:create, db:images). Next.js loads these itself.
import { config } from "dotenv";
config({ path: ".env.local" });
config();
