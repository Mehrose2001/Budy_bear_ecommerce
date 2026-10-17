import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-8 shadow-lg">
        <ForgotPasswordForm audience="admin" />
      </div>
    </div>
  );
}
