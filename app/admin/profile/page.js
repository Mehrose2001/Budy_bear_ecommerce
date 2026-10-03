"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminProfilePage() {
  const { admin, updateProfile, updateCredentials } = useAdminAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    title: "",
  });
  const [security, setSecurity] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securitySaved, setSecuritySaved] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    if (!admin) return;
    setForm({
      name: admin.name || "",
      phone: admin.phone || "",
      title: admin.title || "",
    });
    setSecurity((current) => ({
      ...current,
      email: admin.email || "",
    }));
  }, [admin]);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setSaved("");
    setSavingProfile(true);
    const result = await updateProfile(form);
    setSavingProfile(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved("Profile updated.");
    window.setTimeout(() => setSaved(""), 2500);
  };

  const saveSecurity = async (event) => {
    event.preventDefault();
    setSecurityError("");
    setSecuritySaved("");
    if (!security.currentPassword) {
      setSecurityError("Enter your current password to change email or password.");
      return;
    }
    if (security.newPassword && security.newPassword !== security.confirmPassword) {
      setSecurityError("New password and confirmation do not match.");
      return;
    }
    setSavingSecurity(true);
    const result = await updateCredentials({
      email: security.email,
      currentPassword: security.currentPassword,
      newPassword: security.newPassword,
    });
    setSavingSecurity(false);
    if (!result.ok) {
      setSecurityError(result.error);
      return;
    }
    setSecurity((current) => ({
      ...current,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      email: result.email || current.email,
    }));
    setSecuritySaved(result.message || "Login details updated.");
    window.setTimeout(() => setSecuritySaved(""), 4000);
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminPageHeader
        title="Your profile"
        description="This name appears in the admin sidebar. Update email and password for admin login here."
      />
      <div className="max-w-xl space-y-6">
        <form onSubmit={save} className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <Input label="Role" value={admin?.role || ""} disabled />
          <Input
            label="User name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save profile"}
          </Button>
          {error && <p className="text-sm text-error">{error}</p>}
          {saved && <p className="text-sm text-success">{saved}</p>}
        </form>

        <form
          onSubmit={saveSecurity}
          autoComplete="off"
          className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-bold text-brand-primary">Login details</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Set a new login email or change your password. Current password is required.
            </p>
          </div>
          <Input
            label="Login email"
            type="email"
            name="admin-new-email"
            autoComplete="off"
            value={security.email}
            onChange={(event) => setSecurity({ ...security, email: event.target.value })}
            required
          />
          <Input
            label="Current password"
            type="password"
            name="admin-current-password"
            autoComplete="current-password"
            value={security.currentPassword}
            onChange={(event) =>
              setSecurity({ ...security, currentPassword: event.target.value })
            }
            required
          />
          <Input
            label="New password"
            type="password"
            name="admin-new-password"
            autoComplete="new-password"
            value={security.newPassword}
            onChange={(event) => setSecurity({ ...security, newPassword: event.target.value })}
            placeholder="Leave blank to keep current password"
          />
          <Input
            label="Confirm new password"
            type="password"
            name="admin-confirm-password"
            autoComplete="new-password"
            value={security.confirmPassword}
            onChange={(event) =>
              setSecurity({ ...security, confirmPassword: event.target.value })
            }
          />
          <Button type="submit" disabled={savingSecurity}>
            {savingSecurity ? "Updating..." : "Update email and password"}
          </Button>
          {securityError && <p className="text-sm text-error">{securityError}</p>}
          {securitySaved && <p className="text-sm text-success">{securitySaved}</p>}
        </form>
      </div>
    </div>
  );
}
