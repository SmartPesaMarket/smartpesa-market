# SmartPesa Market

SmartPesa Market is an online marketplace offering affordable digital products to make life easier. Discover educational resources, business templates, career tools and lifestyle planners. Shop conveniently, access useful resources and download your purchases with ease. We make learning, working and everyday life smarter.

## Current development status

The `feature/marketplace-foundation` branch contains the first responsive React + Vite storefront foundation. The catalogue currently uses clearly illustrative sample products and local in-browser interactions. Authentication, live inventory, checkout, payment verification, digital delivery and admin tools are not connected yet.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. To create a production build:

```bash
npm run build
npm run preview
```

## Technology

- React
- Vite
- CSS (responsive layout and reduced-motion support)

## Project principles

- Prioritise a polished, mobile-first experience.
- Keep the initial development cost low and disclose unavoidable service and transaction fees.
- Never put payment-provider secrets in browser code.
- Verify payments server-side before marking orders as paid or releasing downloads.
- Replace sample catalogue data with approved, real product listings before launch.
