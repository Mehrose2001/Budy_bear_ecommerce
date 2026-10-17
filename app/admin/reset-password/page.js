import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Set a new password" };

export default function AdminResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-8 shadow-lg">
        <ResetPasswordForm audience="admin" />
      </div>
    </div>
  );
}
