import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin",
  },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
