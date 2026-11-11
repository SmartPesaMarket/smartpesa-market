# SmartPesa Market

SmartPesa Market is an online marketplace offering affordable digital products to make life easier. Discover educational resources, business templates, career tools and lifestyle planners. The longer-term marketplace can expand to additional product and service categories.

## Current development status

The `feature/marketplace-foundation` branch contains a responsive React + Vite storefront, a configured production build workflow, and the first Supabase database integration files. The storefront continues to show clearly illustrative sample products until Supabase is configured and real products are published.

Authentication screens, live inventory management, secure checkout, payment verification, digital delivery and admin tools are not connected yet.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Create a local `.env` file from `.env.example` and add your Supabase project URL and publishable/anon key. These are public client configuration values; never use a service-role key in the browser.

```bash
npm run build
npm run preview
```

## Supabase setup

1. Create a Supabase project.
2. Open the project's SQL Editor and run `supabase/schema.sql`.
3. Copy the project URL and publishable/anon key into `.env` using the names in `.env.example`.
4. Add product rows to `public.products` and set `is_published` to `true` when they are ready to appear.

The app falls back to its sample catalogue if Supabase environment values are not configured. Once configured, it reads only published products. Product file paths are private metadata; do not expose paid download files through a public bucket.

## Technology

- React and Vite
- Supabase JS client (catalogue read integration and database foundation)
- PostgreSQL with row-level security policies
- Responsive CSS with reduced-motion support

## Security and launch principles

- Keep payment-provider secrets and Supabase service-role keys server-side only.
- Browser users can read published products and their own account/order records only.
- Orders and order items have no browser-side write policies. Trusted server functions must validate prices and create orders.
- Verify mobile-money payments server-side before marking orders as paid or releasing downloads.
- Replace sample catalogue data with approved, real product listings before launch.
- Review hosting, database and payment-provider quotas/fees before launch.
