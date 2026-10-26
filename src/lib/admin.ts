import "server-only";
import { redirect } from "next/navigation";
import { getUser, HttpError } from "./auth";
import { writeAudit } from "./store";

/** For pages: redirects non-admins. */
export async function adminPage() {
  const u = await getUser(); if (!u || u.role !== "ADMIN") redirect("/admin/login"); return u;
}
/** For server actions: throws 401/403 (never relies on the UI hiding controls). */
export async function adminAction() {
  const u = await getUser(); if (!u) throw new HttpError(401, "Authentication required");
  if (u.role !== "ADMIN") throw new HttpError(403, "Forbidden"); return u;
}
export const audit = (actorId: string, action: string, entity: string, entityId?: string) => writeAudit(actorId, action, entity, entityId);
