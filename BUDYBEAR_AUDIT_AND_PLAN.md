# BudyBear — Complete Audit & Implementation Plan

**Date:** 9 November 2026  
**Repository:** `Mehrose2001/Budy_bear_ecommerce`  
**Required branch:** `waqas_fixes`  
**Audit branch HEAD:** `69b3c43` (same commit as `backend-complete` at audit time)  
**Live site (spot-check):** https://www.budybear.com  

**Scope of this document:** Phase 0 + Phase 1 only. No application source code was changed during this audit (except this file).

---

## Phase 0 — Git safety (completed)

| Step | Result |
|------|--------|
| Starting branch | `backend-complete` (tracking `origin/backend-complete`) |
| Local changes preserved | No staged modifications; one untracked debug script `scripts/read-delivery-settings.mjs` (unchanged) |
| Branch `waqas_fixes` | **Created** from current HEAD (`69b3c43`); **not** present on `origin` yet |
| Destructive commands | None used |
| Commit / push | **None** (per your instruction) |

**Note:** `waqas_fixes` currently shares history with `backend-complete`, not `main`. If you intended `waqas_fixes` from `main`, say so before implementation—we will not reset or overwrite the branch.

---

## Executive summary

BudyBear is a **Next.js 16** App Router storefront + **admin panel**, with **Supabase** as the primary backend and an optional **Express** mirror in `backend/`. The codebase is mature: catalog, checkout, orders, reviews, banners, SEO, and FTP media uploads are already wired.

The improvement spec is largely **incremental**: fix admin session stability and input focus, unify review/rating UX, extend category banner management (images/video per category/subcategory), then apply a coordinated design-system pass across store and admin—without rewriting the stack.

**Highest-impact confirmed issues:**

1. **Reviews:** Default `rating: 5` on product save (`productToRow`); cards always show stars (no “No reviews yet”); homepage **hardcoded testimonials** fallback.
2. **Stars:** `StarRating` uses `Math.round` (misleading averages); empty stars use `fill-none` + `text-neutral-300` inside `text-amber-500` parent (reported “white star” appearance).
3. **Admin focus loss:** `app/admin/inventory/page.js` uses `key={product.id}-${product.stock}` on stock inputs → **remount on every keystroke** when stock state updates.
4. **Admin logout suspects:** 8s session poll + `setAdmin` with new session objects; refresh failures (`401`); strict admin email in `toAdminSession`; dashboard refetch on `window.focus` / `visibilitychange` (does not remount forms but adds load).
5. **Category banners (gap vs spec):** Only **single category thumbnail** (`categories.image`) in admin; no per-subcategory banner/video model; hero carousel is separate (`banners` table).
6. **Production ops (from prior sessions):** Live `/api/health` showed `hasServiceRoleKey: false` until Hostinger env is set—order delete and some admin writes affected. **Not re-probed during this audit** (no secret/env probing).

**Routes spot-check (HTTP only):**

| URL | Status | Notes |
|-----|--------|--------|
| `/category/accessories` | **200** | Page loads; product count depends on DB (not verified in audit) |
| `/category/gifts` | **200** | Same |
| `/category/baby` | **200** | Nav labels “Infant” → slug **`baby`** (naming inconsistency) |
| “Boys Stretch Chino Pants” PDP | **Not in repo seed** | Likely production-only SKU; root cause **unconfirmed** without DB slug or live PDP check |

---

## 1. Architecture overview

### Stack

- **Framework:** Next.js 16.3.4 (`next dev/build --webpack`), React 19  
- **Styling:** Tailwind CSS v4 (`app/globals.css`, CSS-first `@theme`)  
- **Icons:** `lucide-react` (no separate animation library)  
- **Data:** Supabase JS 2.49.8; optional `backend/` Express API via `lib/withBackend.js`  
- **Auth:** Supabase Auth + JWT in `localStorage` (`lib/adminSession.js`, `context/AdminAuthContext.jsx`)  
- **Catalog cache:** In-memory snapshot TTL **15s** (`lib/catalog.js`)

### Key directories

| Area | Path |
|------|------|
| Store routes | `app/(store)/` |
| Admin routes | `app/admin/` |
| API routes | `app/api/` |
| UI components | `components/` |
| Context | `context/` |
| Supabase services | `services/` |
| Facade | `lib/catalog.js`, `lib/mappers.js` |
| SQL migrations (reference) | `backend/sql/` |
| Static seeds | `data/` |

### Duplicate layers (intentional fallbacks)

- `services/*` ↔ `backend/src/services/*`  
- `lib/mappers.js` ↔ `backend/src/lib/map.js`  
- `lib/catalogStore.js` in-memory when Supabase unavailable  

**Implication:** Fixes must land in **Next `services/` + components** first; backend mirror updated only if Express proxy is still used in any environment.

---

## 2. Issue register

Legend: **Confirmed** = traced in code or reproduced via safe check; **Suspected** = likely from code smell; **Unverified** = needs browser/DB/production check.

### P0 — Critical (stability, revenue, trust)

| ID | Area | Severity | Status | Root cause / evidence |
|----|------|----------|--------|------------------------|
| P0-1 | Admin order delete (prod) | High | Confirmed (prior) | Missing `SUPABASE_SERVICE_ROLE_KEY` on Hostinger; partial fix on `backend-complete` |
| P0-2 | Admin unexpected logout | High | Suspected | Token refresh `401` → `expireAdminSession`; 8s poll; `verifyAdminSession` strict role/email; possible refresh race (`REFRESH_LOCK_KEY`) |
| P0-3 | Admin input focus loss | High | Confirmed | `inventory/page.js` dynamic `key` includes `product.stock` |
| P0-4 | Fake 5★ on products | High | Confirmed | `lib/mappers.js` `productToRow` defaults `rating` to **5**; cards always render `StarRating` |
| P0-5 | Homepage fake testimonials | Medium | Confirmed | `Testimonials.jsx` `FALLBACK_TESTIMONIALS` when API returns empty |

### P1 — Reviews & ratings (spec Phase 3)

| ID | Issue | Status | Files |
|----|-------|--------|-------|
| P1-1 | Single star component but inconsistent display rules | Confirmed | `components/ui/StarRating.jsx`, `ProductCard.jsx`, `ProductInfo.jsx` |
| P1-2 | No “No reviews yet” on cards/PDP | Confirmed | `ProductCard.jsx`, `ProductInfo.jsx` |
| P1-3 | Client-side summary bump in `ProductReviews` vs server stats | Suspected drift | `ProductReviews.jsx`, `reviewService.refreshProductReviewStats` |
| P1-4 | `publishedFilter` / status column drift | Suspected | `reviewService.js`, `lib/reviewStatus.js` |
| P1-5 | Testimonials mix DB + fallback | Confirmed | `lib/catalog.js` `listStoreTestimonials`, home `page.js` |

### P2 — Category banners (spec Phase 4)

| ID | Gap | Status | Notes |
|----|-----|--------|-------|
| P2-1 | No video banner fields per category/subcategory | Confirmed | Only `image` on categories; hero `banners` table separate |
| P2-2 | No desktop/mobile banner pair per PLP | Confirmed | Hero has `013_banner_mobile_image.sql`; categories do not |
| P2-3 | Subcategory PLP banner | Missing | PLP uses `ProductListing` + category image indirectly via SEO/metadata |
| P2-4 | Dynamic future categories | Partial | Admin category CRUD exists; banner fields must extend schema + admin form |

**DB migration risk:** Additive JSON column (e.g. `banner` on `categories` + `subcategory_banners` map) **preferred** over hardcoded lists. **Requires your approval before production SQL.**

### P3 — Routes & catalog data (spec Phase 11)

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| P3-1 | Infant vs `baby` slug | Confirmed | `data/navigation.js` uses `/category/baby`; no `infant` slug |
| P3-2 | Empty category counts | Unverified | `getProductsByCategory` filters `product.category === slug`; empty = no rows or wrong `category_id` |
| P3-3 | Accessories / Gifts “broken” report | Partially disproven (HTTP 200) | May have meant **empty** or **wrong products**, not 404 |
| P3-4 | Chino pants PDP | Unverified | Not in `data/products.js`; check production `slug`, `is_active`, images |
| P3-5 | Subcategory query params | Confirmed working pattern | `ProductListing` + `slugify` on `?subcategory=` |

### P4 — UI/UX, responsive, performance (spec Phases 5–10)

| ID | Theme | Status | Notes |
|----|-------|--------|-------|
| P4-1 | Design tokens exist but uneven use | Confirmed | `:root` in `globals.css`; many one-off spacing classes |
| P4-2 | Product card height / alignment | Suspected | Mixed aspect ratios; hover image swap |
| P4-3 | Quick View gallery | Partial prior work | `ProductGallery.jsx` on PDP; Quick View separate—verify parity |
| P4-4 | Footer / section spacing | Suspected | Needs page-by-page pass |
| P4-5 | Duplicate API on dashboard focus | Confirmed | `app/admin/page.js` refetch on focus/visibility |
| P4-6 | Catalog 15s cache | Confirmed | Stale stats acceptable; may confuse admin after edits until invalidate |
| P4-7 | `generateStaticParams` on PDP | Confirmed | Builds from `listProducts()` at build time; new products need rebuild or dynamic fallback OK (`dynamic` not set) |

### P5 — Admin dashboard UX (spec Phase 12)

| ID | Issue | Notes |
|----|-------|-------|
| P5-1 | Tables overflow mobile | `AdminTable` + horizontal scroll; needs audit at 320px |
| P5-2 | Consistent icons | Lucide already in `AdminShell`; extend to destructive actions |
| P5-3 | Loading states | Mix of skeletons and spinners |

---

## 3. Deep-dive notes

### 3.1 Admin authentication (`AdminAuthContext`, `adminSession.js`)

**Current behaviour:**

- Session stored in **localStorage** (`ADMIN_SESSION_KEY`).
- **Idle timeout:** 8 hours (`ADMIN_IDLE_MS`).
- **Max session:** 7 days (`ADMIN_SESSION_MAX_MS`).
- **Token renewal:** `accessTokenNeedsRenewal` with 2-minute skew; refresh via `/api/auth/refresh`.
- **Poll:** every **8 seconds** checks refresh need and syncs `setAdmin`.
- **Activity:** `touchAdminSession` on pointer/keydown/focus when pathname starts with `/admin`.
- **Boot:** single `verifyAdminSession` on mount via `/api/auth/me`.
- **`toAdminSession`:** requires `role === admin` **and** email exactly `budybear2026@gmail.com`.

**Logout hypotheses (priority order for investigation during implementation):**

1. Refresh returns 401 (invalid/revoked refresh token) → hard expire.  
2. Poll calls `setAdmin(null)` when `readAdminSession()` returns null after failed fresh check.  
3. Cross-tab `storage` event desync.  
4. AdminShell redirect when `isAuthenticated` flickers false during refresh.  
5. `adminFetch` 401 retry path (read `lib/adminApi.js` during Phase 2).

**Planned fixes (after approval):**

- Debounce `setAdmin` when session payload unchanged (deep compare token + expiry).  
- Do not null admin on transient `/api/auth/me` network errors if refresh token valid.  
- Extend refresh skew; single-flight refresh (already partially implemented).  
- Add optional dev-only logging (no tokens in logs).  
- **Do not** disable auth or extend sessions without bound.

### 3.2 Input focus loss

**Confirmed smoking gun:**

```jsx
// app/admin/inventory/page.js (approx line 71)
key={`${product.id}-${product.stock}`}
```

Any state update to `stock` while typing changes React key → unmount/remount → **focus lost**.

**Other areas to audit in Phase 2:**

- `ProductForm.jsx` `useEffect(() => setForm(toForm(product)), [product])` — safe if `product` reference stable while modal open.  
- `RichTextEditor.jsx` on legal pages — check re-init on parent `load()`.  
- Settings / SEO forms — `settings/page.js` keys on `item.id` (stable).  
- Avoid refetching entire form state on interval while editing (use “Save” not autosave polling).

### 3.3 Reviews & ratings

**Data flow:**

1. Customer POST → `app/api/reviews/route.js` → `reviewService` → DB.  
2. Admin moderation → `app/api/admin/content?resource=reviews`.  
3. Approval should call `refreshProductReviewStats` (verify all code paths).  
4. Store reads `product.rating` / `product.reviewCount` from `products` row via `mapProduct`.

**Bugs:**

- `productToRow` sets `rating: … ?? 5` → new products appear as 5★.  
- `mapProduct` uses `Number(row.rating || 0)` → displays 0 if DB null, but save path seeds 5.  
- `StarRating`: `filled = index < Math.round(value)` → 4.2 displays as 4, not 4½.  
- Unfilled stars: `fill-none text-neutral-300` may look “white” on cream backgrounds.  
- `ProductReviews` optimistically recalculates average locally—must match server after refresh.

**Target architecture:**

- `lib/ratings.js` (or `hooks/useProductRating.js`): `getDisplayRating(product)` → `{ average, count, hasReviews }`.  
- Enhanced `StarRating`: half-star support optional; `emptyState` prop; `gold` / `grey` tokens from CSS variables.  
- Cards/PDP: if `!hasReviews` → text **“No reviews yet”**, hide stars or show empty grey row.  
- Testimonials: remove `FALLBACK_TESTIMONIALS`; hide section if `items.length === 0`.  
- One-time data fix script (optional, **with approval**): set `rating = 0` where `review_count = 0`.

### 3.4 Category / subcategory banners

**Today:**

- Admin **Categories**: thumbnail URL, SEO, subcategory list (`app/admin/categories/page.js`).  
- Admin **Banners**: home hero carousel (`app/admin/banners/page.js`).  
- **Seasonal** block: `store_settings` / seasonal JSON.  
- **PromoBanner**: static SVG on home.

**Spec requires:**

- Per category **and** subcategory: image/video, heading, description, CTA, enable flag, preview, replace/remove.  
- Desktop/mobile assets optional.  
- Must scale when new categories are added in admin (read from DB, no hardcoded slug list).

**Proposed additive schema (draft—for approval):**

```sql
-- Example only; do not run on production without sign-off
alter table public.categories
  add column if not exists banner jsonb default '{}'::jsonb;
-- Structure: { enabled, heading, description, ctaLabel, ctaHref,
--   image, imageMobile, video, videoPoster, mediaType }
-- subcategory_banners: { [slug]: { ...same } }
```

**Storage:** Reuse `app/api/admin/uploads` + `storageService.js` with new folders `category-banners`, validation (mime, size caps).

**UI:** Extend category admin form with tabs: **Details | Banner | Subcategory banners** without changing product assignment fields.

### 3.5 Routing & “Boys Stretch Chino Pants”

**Code path:** `app/(store)/product/[slug]/page.js` → `getProductPage(slug)` → `notFound()` if null.

**Failure modes:**

- Slug typo in links vs DB.  
- `is_active = false`.  
- Supabase timeout → memory fallback without product.  
- Build-time `generateStaticParams` omitting new slug (still dynamic at runtime).

**Investigation checklist (Phase 11):**

1. Admin → Products: locate item, copy slug, test `/product/{slug}` locally with production data.  
2. Supabase: `select id, slug, is_active, category_id from products where name ilike '%chino%'`.  
3. Check image URLs (broken media should not 404 the page).  
4. Verify category `boys` + subcategory `pants` filters include the product.

### 3.6 Performance

- Increase catalog cache selectively or invalidate on admin mutations (partially exists).  
- `next/image` remote patterns in `next.config.mjs` (budybear.com, supabase, FTP media).  
- Lazy below-fold sections; priority only on hero LCP image.  
- Avoid duplicate `getCatalogSnapshot` per request in same render tree (React `cache()` if needed).  
- Video: `preload="metadata"`, poster required.

---

## 4. Prioritized implementation plan

Work proceeds **only after your approval** of this document. No commit/push without permission.

### Wave 1 — Critical bugs & admin stability (spec Phases 2, 11 partial, prod ops)

| Task | Files (primary) | Acceptance tests |
|------|-----------------|-------------------|
| Fix inventory input keys | `app/admin/inventory/page.js` | Type in stock field 5+ min, no focus loss |
| Harden admin session refresh | `context/AdminAuthContext.jsx`, `lib/adminSession.js`, `lib/adminApi.js` | Navigate admin 30+ min; refresh tab; stay logged in |
| AdminShell auth flicker | `components/admin/AdminShell.jsx` | No redirect loop during refresh |
| Production env checklist | Docs only / Hostinger | `/api/health` → `hasServiceRoleKey: true` |
| Route audit script | `scripts/audit-routes.mjs` (new) | List categories/products slugs vs 404 |
| Chino / accessories data | Supabase read-only queries | PDP opens |

### Wave 2 — Reviews & ratings (spec Phase 3)

| Task | Files | Tests |
|------|-------|-------|
| Remove default rating 5 | `lib/mappers.js`, backend `map.js` if needed | New product shows no false stars |
| `refreshProductReviewStats` on all approval paths | `services/reviewService.js`, admin content route | Approve review → PDP count updates |
| Unified display helper | `lib/ratings.js`, `StarRating.jsx` | Same numbers on card, PLP, PDP, Quick View |
| “No reviews yet” | `ProductCard`, `ProductInfo`, Quick View | Zero-review products |
| Testimonials | `Testimonials.jsx`, home `page.js` | No hardcoded names when DB empty |
| Optional DB cleanup migration | SQL file + approval | Products with 0 reviews → rating 0 |

### Wave 3 — Category banners (spec Phase 4)

| Task | Files | Tests |
|------|-------|-------|
| Schema migration (additive) | `backend/sql/016_category_banners.sql` | **Your approval before prod** |
| Mapper + service | `mappers.js`, `categoryService.js`, `contentService.js` | Round-trip save |
| Admin UI | `app/admin/categories/page.js` | Upload image/video, preview, disable |
| Storefront PLP hero | `ProductListing.jsx` or new `CategoryBanner.jsx` | All categories from DB |
| Upload validation | `storageService.js`, uploads API | Reject oversize / wrong mime |

### Wave 4 — Design system & UI pass (spec Phases 5–9, 6–7)

| Task | Scope |
|------|--------|
| Token pass | `globals.css` spacing, radii, shadows |
| Header/Footer/Nav | `Header.jsx`, `Footer.jsx`, `AnnouncementBar.jsx` |
| Home sections | `app/(store)/page.js` + `components/home/*` |
| Product card / PDP / Quick View | `ProductCard`, `ProductDetailsClient`, `QuickView` modal |
| Admin tables/forms | `AdminTable`, forms polish, icons |
| Animations | CSS 180–300ms, `prefers-reduced-motion` |

### Wave 5 — Responsiveness, performance, regression (spec Phases 8, 10, 15)

| Task | Deliverable |
|------|-------------|
| Viewport matrix testing | Checklist in PR notes (320–2560) |
| `npm run lint` + `npm run build` | Log results in delivery report |
| Browser console pass | Major routes |
| Broken image audit | PDP, PLP, banners |

---

## 5. File map (planned touch points)

| Phase | Primary files |
|-------|----------------|
| Admin auth | `context/AdminAuthContext.jsx`, `lib/adminSession.js`, `lib/adminApi.js`, `app/api/auth/refresh/route.js` |
| Focus | `app/admin/inventory/page.js`, `components/admin/RichTextEditor.jsx`, legal admin pages |
| Ratings | `lib/mappers.js`, `services/reviewService.js`, `components/ui/StarRating.jsx`, `components/product/*`, `components/home/Testimonials.jsx` |
| Banners | `app/admin/categories/page.js`, `services/categoryService.js`, `components/product/ProductListing.jsx`, SQL `backend/sql/016_*` |
| Routes | `lib/catalog.js`, `services/productService.js`, `data/navigation.js`, `lib/storeNav.js` |
| Design | `app/globals.css`, layout components, `components/ui/Button.jsx`, `Input.jsx` |
| Admin UI | `components/admin/AdminShell.jsx`, `AdminTable.jsx`, all `app/admin/*/page.js` |

---

## 6. Database & security constraints

- **No production migrations** without explicit approval.  
- **No** service role keys in client bundles (`lib/supabase/secrets.server.js` pattern already on `backend-complete`).  
- **No** deletion of production orders/products for “fixes”.  
- RLS remains; admin delete policies may need SQL (e.g. `013_orders_admin_delete.sql` on `backend-complete`).  
- File upload: validate type/size server-side in `storageService.js`.

---

## 7. Tests performed in this audit

| Check | Result |
|-------|--------|
| `git status` / branch `waqas_fixes` | Done |
| Codebase structural survey | Done (agent + manual reads) |
| Live category HTTP status (accessories, gifts, baby) | **200** (prior curl in session) |
| Live PDP “Chino” | **Not tested** (product not in seed) |
| `npm run build` | **Not re-run** in this audit (succeeded on `backend-complete` earlier) |
| `npm run lint` | **Not run** |
| Browser visual regression | **Not performed** (limitation: no side-by-side live vs local screenshots) |
| Admin 5-minute typing test | **Not performed** (scheduled for Wave 1) |

---

## 8. Dependencies & packages

**Spec says:** avoid unnecessary packages.

- **Animations:** use CSS + existing Tailwind transitions.  
- **Icons:** continue `lucide-react`.  
- **Half stars:** prefer inline SVG in `StarRating`, not a new dependency.

---

## 9. Deployment / manual config (reminder)

For production parity with local order delete and admin uploads:

1. Hostinger Node env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.  
2. Deploy branch containing `secrets.server.js` and order-delete fixes.  
3. Run approved Supabase SQL (order delete RLS, future banner columns).  
4. Verify https://www.budybear.com/api/health (`hasServiceRoleKey`, `orderDeleteMode`).

---

## 10. Approval request

Please confirm:

1. **Branch base:** OK that `waqas_fixes` was created from `backend-complete` (includes recent order-delete fixes)?  
2. **Wave order:** Proceed 1 → 5 as above, or reprioritize (e.g. UI before banners)?  
3. **Database:** Approve drafting `016_category_banners.sql` for staging only first?  
4. **Testimonials:** Agree to **remove** hardcoded fallback entirely?  
5. **Production data:** Permission to run **read-only** Supabase queries for Chino pants / category counts during Wave 1?

After approval, implementation will begin on **`waqas_fixes`** with phase-by-phase diffs, tests, and progress updates—**no commit/push until you ask**.

---

## Appendix A — Confirmed vs suspected summary

| Confirmed | Suspected / unverified |
|-----------|-------------------------|
| Default product rating 5 on save | Chino PDP failure mode |
| Hardcoded testimonials fallback | Accessories/Gifts “empty vs broken” |
| Inventory input remount keys | Widespread admin focus loss beyond inventory |
| Category routes return 200 | Infant empty = data vs mapping |
| No subcategory video banner system | Star “white” on all backgrounds |
| Infant nav → `baby` slug | Admin logout exact trigger in prod |
| `StarRating` round + always visible on cards | Horizontal overflow on specific pages |

---

## Appendix B — Related commits on `backend-complete` (context)

Recent work on sibling branch (already merged into `waqas_fixes` base):

- Admin order delete + `secrets.server.js`  
- Dashboard stats from DB  
- Delivery settings, gallery, offer flow  

Implementation should **merge or rebase** from `backend-complete` if that branch advances before Waves start.

---

*End of audit document.*
