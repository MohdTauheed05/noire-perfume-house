import { AuthForm } from "@/components/AuthForm"; import { login } from "@/app/actions";
export const metadata = { title: "Admin sign in", robots: { index: false } };
export default function Page() { return <AuthForm action={login} mode="login" admin next="/admin" />; }
