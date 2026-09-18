"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { mainNavItems } from "@/data/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <nav aria-label="Main navigation">
      <ul className="flex flex-wrap items-center gap-1 py-3">
        {mainNavItems.map((item) => (
          <li
            key={item.label}
            className="relative"
            onMouseEnter={() => setActiveMenu(item.label)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <Link
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold tracking-wide text-brand-primary transition-colors hover:bg-brand-cream hover:text-brand-primary",
                item.label === "SALE" && "text-brand-accent hover:text-brand-accent",
                item.label === "NEW ARRIVALS" && "text-brand-secondary hover:text-brand-secondary"
              )}
            >
              {item.label}
              {item.megaMenu && (
                <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
              )}
            </Link>

            {item.megaMenu && activeMenu === item.label && (
              <div className="absolute left-0 top-full z-50 min-w-[220px] pt-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Shop {item.label}
                  </p>
                  <ul className="space-y-1">
                    {item.megaMenu.map((subItem) => (
                      <li key={subItem.label}>
                        <Link
                          href={subItem.href}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-brand-primary"
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={item.href}
                    className="mt-3 inline-flex text-sm font-semibold text-brand-primary hover:underline"
                  >
                    View all {item.label.toLowerCase()}
                  </Link>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
