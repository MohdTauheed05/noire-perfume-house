import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin credentials, from either:
 *  - FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON or base64 of the JSON), or
 *  - FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 * The Admin SDK is used only on the server and bypasses Firestore security rules,
 * so the rules in firestore.rules deny ALL direct browser access.
 */
function credentials() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    const o = JSON.parse(json.startsWith("{") ? json : Buffer.from(json, "base64").toString("utf8"));
    return { projectId: o.project_id as string, clientEmail: o.client_email as string, privateKey: o.private_key as string };
  }
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see README).");
  }
  return { projectId, clientEmail, privateKey };
}

const g = globalThis as unknown as { __noireDb?: Firestore };

/** Lazily creates one Firestore instance per server process (survives dev hot-reload). */
export function getDb(): Firestore {
  if (g.__noireDb) return g.__noireDb;
  const app = getApps()[0] ?? initializeApp({ credential: cert(credentials()), storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined });
  const db = getFirestore(app);
  try { db.settings({ ignoreUndefinedProperties: true }); } catch { /* already configured */ }
  g.__noireDb = db;
  return db;
}
