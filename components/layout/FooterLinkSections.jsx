"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function FooterAccordion({ title, links, panelId }) {
  const [open, setOpen] = useState(false);
  const headingId = useId();

  return (
    <div className="border-b border-white/10 md:border-0">
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left md:hidden"
      >
        <span className="text-sm font-bold uppercase tracking-wider text-white">{title}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-white/70 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      <h3 className="hidden text-sm font-bold uppercase tracking-wider text-white md:block">
        {title}
      </h3>

      <ul
        id={panelId}
        aria-labelledby={headingId}
        className={cn(
          "space-y-3 overflow-hidden transition-[max-height,opacity] duration-200 ease-out md:mt-4 md:block md:max-h-none md:opacity-100",
          open
            ? "max-h-[520px] pb-3 opacity-100"
            : "pointer-events-none max-h-0 opacity-0 md:pointer-events-auto md:max-h-none md:pb-0"
        )}
      >
        {links.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="inline-block py-0.5 text-sm text-white/70 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FooterLinkSections({ shopLinks, customerCareLinks, companyLinks }) {
  const shopId = useId();
  const careId = useId();
  const companyId = useId();

  return (
    <>
      <div className="md:contents">
        <FooterAccordion title="Shop" links={shopLinks} panelId={shopId} />
      </div>
      <div className="md:contents">
        <FooterAccordion title="Customer Care" links={customerCareLinks} panelId={careId} />
      </div>
      <div className="md:contents">
        <FooterAccordion title="Company" links={companyLinks} panelId={companyId} />
      </div>
    </>
  );
}
