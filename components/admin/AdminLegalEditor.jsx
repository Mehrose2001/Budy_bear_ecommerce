"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import RichTextEditor from "@/components/admin/RichTextEditor";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch } from "@/lib/adminApi";
import { editorHtml } from "@/lib/legalHtml";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/context/ToastContext";

export default function AdminLegalEditor({ slug, title }) {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const [intro, setIntro] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!admin?.token) return;
    setLoading(true);
    adminFetch(`/api/admin/content?resource=pages&slug=${slug}`, {}, admin.token)
      .then((data) => {
        setIntro(data.page?.intro || "");
        setBody(editorHtml(data.page?.body || ""));
      })
      .catch((loadError) => {
        setError(loadError.message || "Unable to load this page.");
      })
      .finally(() => setLoading(false));
  }, [admin?.token, slug]);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminFetch(
        "/api/admin/content",
        {
          method: "POST",
          body: JSON.stringify({
            resource: "pages",
            data: { slug, intro, body },
          }),
        },
        admin.token
      );
      showToast(`${title} updated.`);
    } catch (saveError) {
      setError(saveError.message || "Unable to save this page.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminPageHeader
        title={title}
        description="Edit this page like a Word document: font, size, bold, colour, lists, and alignment all show on the website."
      />
      {loading ? (
        <p className="text-sm text-neutral-500">Loading page content...</p>
      ) : (
        <form onSubmit={save} className="max-w-3xl space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <Input
            label="Intro"
            value={intro}
            onChange={(event) => setIntro(event.target.value)}
          />
          <div>
            <label htmlFor={`${slug}-body`} className="mb-2 block text-sm font-medium text-neutral-700">
              Page content
            </label>
            <RichTextEditor id={`${slug}-body`} value={body} onChange={setBody} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save page"}
          </Button>
        </form>
      )}
    </div>
  );
}
