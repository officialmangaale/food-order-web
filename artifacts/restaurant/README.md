# Restaurant menu implementation

Implemented for both existing `/restaurants/[restaurantId]` and `/r/[slug]` routes, through their shared restaurant detail component. Uses existing Next.js, TanStack Query, Framer Motion, menu adapters, API services, image fallback, customisation form, merchant conflict dialog and Zustand cart. No dependency, backend, API, authentication, checkout or pricing changes.

## Changed files for this task

- `src/components/restaurant/RestaurantDetailPage.tsx`: retains restaurant/menu queries, ordering rules and campaign handling; mounts the new presentation.
- `src/components/restaurant/RestaurantMenuExperience.tsx`: fullscreen product, diagonal animated previews, input navigation, cart controls and panels.
- `src/components/restaurant/RestaurantFullMenu.tsx`: restaurant-only search, filters, categories, exact-item selection and shared ordering controls.
- `src/components/restaurant/RestaurantCategoryTabs.tsx`: keeps the active category visible across resizing.
- `src/components/restaurant/RestaurantScreen.tsx`: scopes the fullscreen surface and temporarily makes covered app chrome inert, restoring it on exit.
- `src/components/restaurant/RestaurantExperience.module.css`: restaurant-scoped responsive layout and panel styling.
- `src/components/restaurant/restaurantMenuModel.ts`: existing filtering/category helpers; Popular requires actual supporting flags.
- `src/components/restaurant/useRestaurantPanels.ts`: same-URL panel history and safe direct-entry Back fallback.
- `scripts/verify-restaurant.mjs` and `scripts/verify-restaurant-navigation.mjs`: focused browser verification.
- `artifacts/restaurant/`: screenshots and verification records.

The Home responsiveness changes already present before this task were left untouched. SHA-256 comparisons passed for 14 protected files: Home page, global styles, AppHeader, existing changed Home components/styles, all standalone category components/styles/helpers, cart store and restaurant API service.

## Checks completed

- Production build, TypeScript, restaurant/script ESLint, `git diff --check`, and all six existing unit tests passed.
- Live merchant data: real categories, products, prices, variants and variant-specific extras.
- Exact previous/next destinations, first boundary, rapid navigation lock, keyboard arrows, swipe and reduced motion.
- Full menu mobile bottom sheet and desktop side drawer, scoped search, exact-item selection and list additions without closing.
- Required variant validation, cancel without adding, duplicate submission prevention, successful acknowledgement and cart subtotal.
- Edit quantity, separate variant lines, selection manager, incompatible extras protection and explicit merchant conflict handling.
- Browser Back/Forward through nested panels; actual Home and Search links restore entry URL and scroll with usable app chrome; direct URL falls back to Home.
- One detail request and one menu request across the primary browsing/ordering scenario; no animation-triggered API requests.
- Browser-local fixtures verify restaurant isolation, missing images, empty menu, unavailable products, closed merchants and retryable menu errors. Fixtures do not modify server data.
- Layout checks at 320×568, 360×640, 390×844, 768×1024, 844×390, 1024×768, 1440×1000 and 2560×1440; previews, purchase, Full menu and cart do not overlap.
- Additional bottom-sheet checks at 320×480, 768×1024 and 844×390, and accessible customisation Close/Confirm controls at 320×480.
- Primary browser run reported zero JavaScript runtime errors. See `checks.json` and `navigation-checks.json`.

## Screenshots

| Screen | Mobile | Desktop |
| --- | --- | --- |
| Product | [Product](product-mobile.png) | [Product](product-desktop.png) |
| Full menu | [Bottom sheet](full-menu-mobile.png) | [Side drawer](full-menu-desktop.png) |
| Customisation | [Customisation](customisation-mobile.png) | [Customisation](customisation-desktop.png) |
| Added | [Added](added-mobile.png) | [Added](added-desktop.png) |

Additional screenshots cover all eight layout sizes listed above.

## Existing constraints and verification limits

- The existing cart keys a line by product and variant. Different extras for the same variant cannot coexist; incompatible additions are blocked with guidance to Edit or choose another variant. Separate variants stay separate. No second cart was introduced.
- The existing merchant menu service returns that merchant's complete menu and exposes no pagination cursor; its existing request and cache are reused.
- Favourite remains the pre-existing local toggle; the app has no persisted restaurant-favourite action here.
- Browser verification used desktop Chrome and emulated viewports, including synthetic touch events. Physical iOS/Safari and Android devices were not tested.
- Campaign tracking logic was preserved but no campaign links, payments, checkout, deployment or order submissions were exercised.
- The successful build emitted a non-blocking Node warning about an existing `--localstorage-file` runtime option.
