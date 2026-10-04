"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getWhatsAppChatUrl } from "@/lib/orderNotifications";

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.43-9.91 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9C21.95 6.43 17.5 2 12.04 2zm5.76 14.25c-.24.68-1.4 1.3-1.95 1.34-.5.04-1.12.06-1.81-.11-.42-.1-.95-.31-1.64-.61-2.89-1.25-4.77-4.16-4.92-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.24-.27.64-.39 1.02-.39.12 0 .23 0 .33.01.29.01.44.03.63.49.24.58.81 2 .88 2.15.07.15.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.16.27.73 1.2 1.56 1.95 1.08.96 1.97 1.26 2.25 1.4.28.14.44.12.61-.07.16-.19.7-.81.89-1.09.19-.27.38-.23.63-.14.26.09 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
    </svg>
  );
}

export default function MobileBottomBar() {
  const { itemCount, openDrawer } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-brand-primary pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-8px_rgb(15_39_68_/_0.55)] xl:hidden"
      aria-label="Quick actions"
    >
      <div className="mx-auto grid max-w-lg grid-cols-3">
        <Link
          href="/wishlist"
          className="relative flex flex-col items-center gap-0.5 py-2.5 text-white"
        >
          <span className="relative">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[9px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-semibold">Favourites</span>
        </Link>
        <button
          type="button"
          onClick={openDrawer}
          className="relative flex flex-col items-center gap-0.5 py-2.5 text-white"
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[9px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-semibold">Cart</span>
        </button>
        <a
          href={getWhatsAppChatUrl("Hi Budy Bear, I have a question about kidswear.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 py-2.5 text-white"
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span className="text-[10px] font-semibold">WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}
