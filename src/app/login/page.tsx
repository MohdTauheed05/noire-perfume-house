import { AuthForm } from "@/components/AuthForm"; import { login } from "../actions";
export const metadata = { title: "Sign in", robots: { index: false } };
export default function Page() { return <AuthForm action={login} mode="login" />; }
