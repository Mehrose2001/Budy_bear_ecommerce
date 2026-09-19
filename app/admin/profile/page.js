"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminProfilePage() {
  const { admin, updateProfile } = useAdminAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    title: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!admin) return;
    setForm({
      name: admin.name || "",
      phone: admin.phone || "",
      title: admin.title || "",
    });
  }, [admin]);

  const save = (event) => {
    event.preventDefault();
    updateProfile(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminPageHeader
        title="Your profile"
        description="This name appears in the admin sidebar and activity context."
      />
      <form onSubmit={save} className="max-w-xl space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <Input label="Email" value={admin?.email || ""} disabled />
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
        <Button type="submit">Save profile</Button>
        {saved && <p className="text-sm text-success">Profile updated.</p>}
      </form>
    </div>
  );
}
