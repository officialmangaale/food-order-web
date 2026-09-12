Home responsiveness fixes are complete. The hero now sizes to its content, the photograph blends into the background at both edges on wide displays, long greetings wrap on phones, and search controls fit small screens. Category and nearby-restaurant empty states use a compact layout on tablets/desktops and a stacked layout on phones.

All new styling is scoped to home. Existing content order, category cards, banners, cart behavior, location filtering, and other routes retain their existing behavior.

Changed files:

- `src/components/home/HomeResponsive.module.css`: responsive hero, greeting, search, and empty-state rules.
- `src/components/layout/AppHeader.tsx`: applies those rules only on `/`.
- `src/components/home/ExploreCategories.tsx`: home-only empty-state class.
- `src/components/home/NearbyRestaurantsSection.tsx`: the same class for home location/restaurant empty states.
- `scripts/verify-home-responsive.mjs`: viewport, long-content, text-zoom, location-action, and live category-navigation checks.

Validation passed at 320 × 568, 360 × 640, 390 × 844, 480 × 800, 640 × 900, 768 × 1024, 820 × 1180, 844 × 390, 1024 × 768, 1280 × 800, 1440 × 900, 1920 × 1080, 2560 × 1440, and 2880 × 1542. Checks cover content overflow, greeting/search separation, action containment, and compact desktop empty states. Long names/addresses and populated search controls pass at 320, 640, and 1280 pixels. The 200% text-zoom check, Change location action, and live home → category → Back scroll restoration also pass. Browser runtime errors: zero. Results are in [checks.json](checks.json).

Production build, TypeScript, changed-file lint, and `git diff --check` pass.

Screenshots: [mobile](home-390.png), [tablet](home-768.png), [desktop](home-1440.png), [wide desktop](home-2560.png), and [live populated mobile home](home-populated-mobile.png).

The empty-state screenshots reproduce the supplied screenshot using controlled empty API responses and a local test greeting. The populated screenshot and navigation check use the public API. No server data or orders were changed. “No categories available” remains the correct state when the location-based API returns no categories; styling does not bypass that rule. Testing used Chrome viewport emulation, not physical devices.

Run `node scripts/verify-home-responsive.mjs` against the local server to repeat verification. Set `PLAYWRIGHT_MODULE` to an external Playwright `index.mjs` file URL if needed, and optionally set `HOME_TEST_URL` (default `http://localhost:3000`).
