# NOIRÉ PERFUME HOUSE — Next.js + Firebase (Firestore) + Vercel

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · React Three Fiber · **Firebase Firestore** (database) · Firebase Storage (admin image uploads) · Vitest.

## 1. Firebase setup (one time, ~10 minutes)
1. https://console.firebase.google.com → **Add project**.
2. **Build → Firestore Database → Create database** (production mode, pick a region near your customers, e.g. `me-central1` Doha or `europe-west1`).
3. **Project settings → Service accounts → Generate new private key.** Keep that JSON file private; never commit it.
   From it you need `project_id`, `client_email`, `private_key`.
4. Rules: Firestore → **Rules** tab → paste the contents of `firestore.rules` → Publish. (Everything is denied to browsers; the server uses the Admin SDK.)
5. *(Optional, for uploading photos from /admin)* **Build → Storage → Get started.** Storage may require upgrading to the pay-as-you-go (Blaze) plan; the free monthly quota is generous. Copy the bucket name (e.g. `your-project.firebasestorage.app`) into `FIREBASE_STORAGE_BUCKET`. Publish `storage.rules` the same way.
   Skip this step if you prefer to keep photos in git (`public/products/`, see below).

## 2. Run locally
```bash
npm install
cp .env.example .env.local       # fill in SESSION_SECRET + the FIREBASE_* values
npm run db:seed                  # 20 brands, 48 products, coupon WELCOME10 (safe to re-run)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-passphrase' npm run admin:create
npm run dev                      # http://localhost:3000   admin: /admin
```
You can now watch your data live in **Firebase console → Firestore Database → Data** (collections: `products`, `brands`, `orders`, `users`, …).

## 3. Real perfume photos
Product images are placeholders until you add real photos. Two ways:
- **In git (no Storage needed):** copy photos into `public/products/` named by slug (`dior-sauvage.jpg`; list in `public/products/FILENAMES.txt`), run `npm run db:images`, commit and push. Run `db:images` again whenever you add more.
- **From the admin panel:** /admin → Products → Edit → *Replace main image* / *Add gallery images* (needs Firebase Storage, max 4 MB per photo).
Use only photos you own or are licensed to use; official brand photography is copyrighted.

## 4. Deploy: GitHub → Vercel
1. `git init && git add . && git commit -m "NOIRÉ" ` and push to a new GitHub repo. (`.env*` and service-account JSON are git-ignored; check `git status` shows no secrets.)
2. https://vercel.com → **Add New → Project** → import the repo (framework: Next.js, defaults are fine).
3. **Settings → Environment Variables** (all environments):
   `SESSION_SECRET` (32+ random chars) · `SITE_URL` (your https URL) · `FIREBASE_PROJECT_ID` · `FIREBASE_CLIENT_EMAIL` · `FIREBASE_PRIVATE_KEY` (paste the whole value incl. `-----BEGIN…`; `\n` sequences are handled) · `FIREBASE_STORAGE_BUCKET` (optional).
4. Deploy. Seed/admin only need to be run once (from your computer, against the same Firebase project): `npm run db:seed`, `npm run admin:create`.
5. Open `/admin/login`, sign in, and manage everything. Orders, customers and stock appear in the Firebase console too.

## Architecture
- `src/db/firestore.ts` Admin SDK singleton · `src/db/models.ts` types + document mappers + the collection layout.
- `src/lib/store.ts` uncached Firestore reads/writes · `src/lib/queries.ts` cached storefront reads (tag `catalog`, invalidated on every admin save and order; 5 min safety TTL) · `src/lib/catalog-filter.ts` pure search/filter/sort.
- Variants, images and category ids are embedded in each product document; a `variantIds` array indexes variant → product lookups.
- `src/lib/checkout.ts` `planOrder` (pure pricing/stock/coupon rules) + `createOrder` (one Firestore transaction: re-prices from the DB, checks and decrements stock, counts coupon use, writes order, stock movements and audit log).
- Auth: bcrypt + signed JWT cookie; users in Firestore; role re-read from Firestore on every request. Admins exist only via `admin:create`.
- Prices are integer **fils** (AED × 100), VAT-inclusive.

## Scripts
`dev build start lint typecheck test` · `db:seed` · `db:images` · `admin:create`

## Payments
No provider is connected: checkout is a clearly labelled **DEMO** (orders saved as `DEMO_UNPAID`, no money collected). Real payments need Stripe/Telr/PayTabs with a verified webhook. See `LIMITATIONS.md`.
