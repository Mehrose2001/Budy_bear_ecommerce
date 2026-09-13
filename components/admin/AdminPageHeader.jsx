export default function AdminPageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-black text-brand-primary">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
