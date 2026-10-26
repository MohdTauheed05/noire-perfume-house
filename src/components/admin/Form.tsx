"use client";
import { useActionState, type ReactNode } from "react";
import type { Res } from "@/app/admin/actions";
export function AForm({ action, children, className = "space-y-4", submit = "Save" }: { action: (s: Res, f: FormData) => Promise<Res>; children: ReactNode; className?: string; submit?: string }) {
  const [st, run, pending] = useActionState(action, undefined);
  return (<form action={run} className={className}>{children}
    {st?.error && <p role="alert" className="text-sm text-red-400">{st.error}</p>}{st?.ok && <p role="status" className="text-sm text-gold">Saved.</p>}
    <button disabled={pending} className="btn-gold">{pending ? "Saving…" : submit}</button></form>);
}
export const Field = ({ n, l, v, t = "text", req, ph, step }: { n: string; l: string; v?: string | number | null; t?: string; req?: boolean; ph?: string; step?: string }) =>
  (<div><label htmlFor={n} className="label">{l}</label><input id={n} name={n} type={t} defaultValue={v ?? ""} required={req} placeholder={ph} step={step} className="input" /></div>);
