import Link from "next/link";
import { footerLinks } from "@/data/navigation";
import { brand } from "@/data/brand";
import { getWhatsAppChatUrl } from "@/lib/orderNotifications";
import BrandLogo from "./BrandLogo";

function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4V10c0-.6.4-1 1-1z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
};

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-primary/20 bg-brand-primary-dark text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <BrandLogo size={56} showWordmark variant="light" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
              {brand.slogan} Premium kids fashion and accessories for every little adventure in Pakistan.
            </p>
            <div className="mt-4 space-y-1 text-sm text-white/80">
              <p>
                WhatsApp / Phone:{" "}
                <a
                  href={getWhatsAppChatUrl("Hi Budy Bear, I would like to get in touch.")}
                  className="font-semibold text-white hover:text-brand-accent"
                >
                  {brand.whatsapp}
                </a>
              </p>
              <p>
                Email:{" "}
                <a href={`mailto:${brand.supportEmail}`} className="hover:text-white">
                  {brand.supportEmail}
                </a>
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {footerLinks.social.map((item) => {
                const Icon = SOCIAL_ICONS[item.label];
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:border-brand-accent hover:text-white"
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Shop
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.shop.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Customer Care
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.customerCare.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="text-sm text-white/50">
            Prices shown in PKR (Rs.). Cash on Delivery available across Pakistan.
          </p>
        </div>
      </div>
    </footer>
  );
}
