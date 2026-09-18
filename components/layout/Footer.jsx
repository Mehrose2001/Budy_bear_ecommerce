import Link from "next/link";
import { footerLinks } from "@/data/navigation";
import { brand } from "@/data/brand";
import BrandLogo from "./BrandLogo";

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
            <div className="mt-6 flex flex-wrap gap-3">
              {footerLinks.social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:border-brand-accent hover:text-white"
                >
                  {item.label}
                </a>
              ))}
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
