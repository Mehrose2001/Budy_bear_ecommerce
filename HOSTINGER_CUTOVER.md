# Hostinger cutover plan

Do not switch production until this checklist is signed off.

Production remains on Supabase while `USE_HOSTINGER_BACKEND=false`.

## Auth strategy

Supabase sessions cannot be reused. New JWTs are signed with `JWT_SECRET`.

Password hashes are **not** imported by default. Migrated users get `password_needs_reset=1` and must use Forgot password (Nodemailer/Gmail). Optional `--import-password-hashes` is experimental: GoTrue `listUsers` often omits `encrypted_password`, and bcrypt formats can differ.

Admin login remains restricted to `budybear2026@gmail.com`.

## Sequence

1. Create a Hostinger MySQL database. Use host `127.0.0.1`.
2. Create `MEDIA_ROOT` **outside** `public_html` and `hbuilds`, e.g. `/home/USER/domains/budybear.com/storage/uploads`. Confirm write permission.
3. Add env vars from `.env.example`. Keep `USE_HOSTINGER_BACKEND=false`.
4. `node scripts/apply-mysql-schema.mjs --confirm-schema`
5. `node scripts/migrate-db-to-mysql.mjs` (dry-run)
6. `node scripts/migrate-db-to-mysql.mjs --execute --confirm-mysql-import`
7. `node scripts/migrate-media-to-persistent.mjs` (dry-run)
8. `node scripts/migrate-media-to-persistent.mjs --execute`
9. After files verify: `node scripts/migrate-media-to-persistent.mjs --execute --update-urls --confirm-url-update` (MySQL only; Supabase is not updated)
10. `node scripts/verify-media-persistence.mjs` then deploy/restart then `--check`
11. `node scripts/validate-hostinger-migration.mjs`
12. Point a **staging** Node env at MySQL with `USE_HOSTINGER_BACKEND=true` and test:
    - catalog, PDP, drafts, banners, offers
    - admin login, product CRUD, uploads
    - COD checkout, order email
    - forgot-password for a migrated customer
13. Wait for explicit approval.
14. Only then set production `USE_HOSTINGER_BACKEND=true` and restart. Keep Supabase credentials in place as rollback.

## Rollback

Set `USE_HOSTINGER_BACKEND=false` and restart. Supabase tables, storage, and APIs are not deleted by these scripts.

## Persistence

`public_html/uploads` is not permanent. Do not declare media migration successful until the persistence probe survives deploy, Git deploy, rebuild, and restart.
