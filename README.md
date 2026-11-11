# SmartPesa Market

SmartPesa Market is a Uganda-focused digital marketplace offering affordable digital products under the promise **Digital Products. Smarter Living.** The approved main categories are Education, Business, Employment and Lifestyle.

## Current development status

The `feature/marketplace-foundation` branch contains a responsive React + Vite storefront, a passing GitHub Actions production-build workflow, and the first Cloudflare D1 database/API foundation. The storefront still uses clearly illustrative sample products when the D1 catalogue endpoint is not configured.

Customer authentication, live administration, secure checkout, payment verification, private digital delivery and production deployment are not connected yet.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
npm run build
npm run preview
```

The storefront calls `/api/products` for published catalogue items. That endpoint is a Cloudflare Pages Function and reads from the D1 binding named `DB`.

## Cloudflare D1 setup

1. Create a Cloudflare D1 database named `smartpesa-market-db`.
2. Apply `migrations/0001_initial.sql` to the database.
3. In Cloudflare Pages project settings, add a D1 database binding named `DB` and select that database.
4. Add real approved products to `products` and set `is_published = 1`.

For local Pages Functions development, configure the D1 binding with Wrangler and run the Pages development server. Do not commit Cloudflare account tokens or other secrets.

## Technology

- React and Vite storefront
- Cloudflare Pages Functions for server-side API routes
- Cloudflare D1 (SQLite) for the planned application database
- Responsive CSS with reduced-motion support

## Security and launch principles

- Keep payment-provider credentials and session secrets server-side only.
- Never expose `private_file_key` through public catalogue endpoints.
- Customers must only access their own account and order data.
- Orders and payment states must be written by trusted server-side code.
- Verify mobile-money payments with the provider before marking orders paid or releasing downloads.
- Replace sample products with approved real listings before launch.
- Review Cloudflare free-tier quotas and payment-provider fees before production.
