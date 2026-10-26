import { adminPage } from "@/lib/admin";
import { AForm, Field } from "@/components/admin/Form";
import { changeAdminPassword } from "../../actions";

export default async function PasswordPage() {
  await adminPage();
  return <section className="max-w-xl">
    <h1 className="h-display text-3xl text-champagne">Change password</h1>
    <p className="mt-2 text-sm text-white/60">Use your current password and choose a new password with at least 12 characters.</p>
    <div className="card mt-6 p-5">
      <AForm action={changeAdminPassword} submit="Update password">
        <Field n="currentPassword" l="Current password" t="password" req />
        <Field n="newPassword" l="New password" t="password" req ph="12 or more characters" />
        <Field n="confirmPassword" l="Confirm new password" t="password" req />
      </AForm>
    </div>
  </section>;
}
