import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Set a new password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <ResetPasswordForm audience="customer" />;
}
