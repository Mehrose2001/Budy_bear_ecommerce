import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function InfoPage({ title, intro, children }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: title },
        ]}
      />
      <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-primary">
        {title}
      </h1>
      {intro ? <p className="mt-3 text-neutral-600">{intro}</p> : null}
      <div className="mt-8 space-y-6 text-sm leading-7 text-neutral-700 [&_h2]:text-base [&_h2]:font-black [&_h2]:text-brand-primary [&_a]:font-semibold [&_a]:text-brand-primary [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
