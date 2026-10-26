import { AuthForm } from "@/components/AuthForm"; import { register } from "../actions";
export const metadata = { title: "Create account", robots: { index: false } };
export default function Page() { return <AuthForm action={register} mode="register" />; }
