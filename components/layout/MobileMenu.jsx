"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, User, X } from "lucide-react";
import { mainNavItems } from "@/data/navigation";
import { cn } from "@/lib/utils";
import BrandLogo from "./BrandLogo";

export default function MobileMenu({ isOpen, onClose }) {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (label) => {
    setOpenSection((current) => (current === label ? null : label));
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <BrandLogo size={44} showWordmark onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-brand-cream"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Mobile navigation">
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              const isExpanded = openSection === item.label;
              const itemClass = cn(
                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold tracking-wide text-neutral-800 transition-colors hover:bg-brand-cream",
                item.label === "SALE" && "text-brand-accent",
                item.label === "NEW ARRIVALS" && "text-brand-secondary"
              );

              return (
                <li key={item.label}>
                  {item.megaMenu ? (
                    <>
                      <button
                        type="button"
                        className={itemClass}
                        aria-expanded={isExpanded}
                        onClick={() => toggleSection(item.label)}
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-neutral-400 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {isExpanded && (
                        <ul className="mb-2 ml-4 space-y-1 border-l border-neutral-100 pl-4">
                          <li>
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
                            >
                              Shop all {item.label.toLowerCase()}
                            </Link>
                          </li>
                          {item.megaMenu.map((subItem) => (
                            <li key={subItem.label}>
                              <Link
                                href={subItem.href}
                                onClick={onClose}
                                className="block rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-brand-cream hover:text-brand-primary"
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} onClick={onClose} className={itemClass}>
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-brand-cream"
          >
            <User className="h-5 w-5" />
            Account
          </Link>
        </div>
      </div>
    </>
  );
}
