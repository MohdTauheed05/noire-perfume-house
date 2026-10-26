"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/app/actions";
export function AuthForm({ action, mode, next, admin }: { action: (s: AuthState, f: FormData) => Promise<AuthState>; mode: "login" | "register"; next?: string; admin?: boolean }) {
  const [st, run, pending] = useActionState(action, undefined);
  return (<form action={run} className="card mx-auto mt-12 max-w-sm space-y-4 p-6"><h1 className="h-display text-3xl text-champagne">{admin ? "Admin sign in" : mode === "login" ? "Sign in" : "Create account"}</h1>
    {mode === "register" && <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="input" autoComplete="name" /></div>}
    <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /></div>
    <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={8} className="input" autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
    {next && <input type="hidden" name="next" value={next} />}{admin && <input type="hidden" name="admin" value="1" />}
    {st?.error && <p role="alert" className="text-sm text-red-400">{st.error}</p>}
    <button disabled={pending} className="btn-gold w-full">{mode === "login" ? "Sign in" : "Register"}</button>
    {!admin && <p className="text-center text-xs text-white/50">{mode === "login" ? <>No account? <Link className="text-gold" href="/register">Register</Link></> : <>Have an account? <Link className="text-gold" href="/login">Sign in</Link></>}</p>}</form>);
}
