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

function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M14.5 3c.4 2.4 1.8 4.1 4.2 4.4v2.4c-1.4 0-2.7-.4-3.8-1.2v6.5c0 3.3-2.7 5.9-6.1 5.9S2.7 18.4 2.7 15.1c0-3.2 2.5-5.8 5.7-5.9v2.5c-1.8.1-3.2 1.6-3.2 3.4 0 1.9 1.5 3.4 3.4 3.4s3.4-1.5 3.4-3.4V3h2.5z" />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M14.7 10.3 21.2 3h-1.5l-5.6 6.4L9.6 3H3.5l6.8 9.9L3.5 21h1.5l6-6.8 4.7 6.8h6.1l-7.1-10.7zm-2.1 2.4-.7-1L5.6 4.2h2.4l4.5 6.4.7 1 5.9 8.3h-2.4l-4.1-6.2z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  TikTok: TikTokIcon,
  X: XIcon,
};

export default function Footer({ shopLinks }) {
  return (
    <footer className="mt-auto mb-24 border-t border-brand-primary/20 bg-brand-primary-dark text-neutral-300 xl:mb-0">
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
              {(shopLinks || footerLinks.shop).map((item) => (
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
