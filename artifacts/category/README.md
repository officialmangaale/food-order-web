The category browsing experience is implemented at the existing `/categories/[categoryKey]` route. It displays one product with diagonal previews, approximately 400 ms image transitions, swipe and keyboard navigation, paged loading, customisation, editing, and a compact cart summary.

The home screen's only source change is its category click handler. Global styles, shared UI components, the cart store, API services, authentication, checkout, payment, and backend code are unchanged. The two existing adapters now retain optional variant-specific extra prices supplied by the API; the new category panel consumes that metadata.

Changed source files:

| File | Change |
| --- | --- |
| `src/app/categories/[categoryKey]/CategoryListingClient.tsx` | Replaces the old category grid with the new browser and resets pagination when category/location changes. |
| `src/components/home/ExploreCategories.tsx` | Opens the category route, retaining the home history entry and scroll position. |
| `src/components/category/CategoryBrowser.tsx` | Full-screen presentation, diagonal image transitions, navigation, cart controls, conflict confirmation, feedback, and accessibility. |
| `src/components/category/CategoryBrowser.module.css` | Styles scoped to the category experience, responsive layout, safe areas, and reduced motion. |
| `src/components/category/CategoryCustomize.tsx` | Existing Sheet-based mobile/desktop customisation, required variant selection, extras, quantities, actual totals, editing, and cached option loading. |
| `src/components/category/categoryCart.ts` | Uses existing cart actions with guards against incompatible extras and stale edits. |
| `src/components/category/useBrowseItems.ts` | Uses the existing category service, query cache keys, page size, and pagination metadata. |
| `src/types/menu.ts` | Adds optional API-supplied variant prices to the add-on model. |
| `src/utils/apiAdapters.ts` | Retains and normalizes variant-specific extra prices. |
| `src/utils/categoryAdapter.ts` | Retains the same metadata from category responses. |
| `scripts/verify-category.mjs` | Browser verification and screenshot capture using live products and controlled edge-case responses. |

Verification completed:

- Production build and TypeScript pass.
- Changed-file lint passes. Full-app lint has zero errors and two pre-existing unused-import warnings in `CheckoutPage.tsx` and `ProfileMenu.tsx`.
- All six existing tests pass.
- All 21 browser checks pass with no runtime errors; see [checks.json](checks.json).
- Browser checks cover preview destinations, required selections, variant-specific extra prices, cancel, duplicate submission protection, editing, identical-selection merging, incompatible-selection rejection, separate variants, merchant conflicts, quantity removal, cached option loading, pagination boundaries, retry, empty/unavailable states, swipe, reduced motion, and keyboard focus.
- Back restores the tested home scroll position; Forward retains the category route and cart; direct category URLs have a safe home fallback.
- One category API request was observed across navigation within its loaded page, customisation, and Back/Forward. Subsequent pagination and missing option details each fetched only once in their focused checks.
- Layouts were checked at 320 × 568, 390 × 844, and 1440 × 1000. The small layout keeps quantity controls above the cart summary without horizontal overflow.
- Home screenshots have equal dimensions and zero changed non-image pixels. The comparison excludes asynchronously loaded partner image rectangles and the development indicator; see [home-comparison.json](home-comparison.json).
- `git diff --check` passes. No deployment or publication was performed.

Screenshots:

| State | Mobile | Desktop |
| --- | --- | --- |
| Category | [390 × 844](category-mobile.png) | [1440 × 1000](category-desktop.png) |
| Customisation | [390 × 844](customisation-mobile.png) | [1440 × 1000](customisation-desktop.png) |
| Added | [390 × 844](added-mobile.png) | [1440 × 1000](added-desktop.png) |

[Small mobile added state](added-small-mobile.png) uses real product data with controlled pagination metadata. The other category/customisation/added screenshots use live API responses. [Home before](home-before.png) and [home after](home-after.png) are also included.

Limits of the existing systems:

- No category mockups were attached in this session, so the implementation follows the supplied layout requirements.
- The existing option model supports one variant plus optional extras; it has no required add-on-group constraints to validate. Required variants and available extra quantities are validated.
- The existing cart keys lines by product and variant. Different variants remain separate; incompatible extras for the same variant are explicitly blocked with guidance to edit the existing selection. No second cart or new merging rule was introduced.
- The summary displays the existing item subtotal. Final fees and taxes remain in the existing cart/checkout flow.
- Verification used Chrome with desktop and mobile viewport emulation. Physical-device Safari testing was not performed.

To repeat browser verification, run the app locally and execute `node scripts/verify-category.mjs` with Playwright available. If Playwright is installed outside this repository, set `PLAYWRIGHT_MODULE` to the file URL of its `index.mjs`. `CATEGORY_TEST_URL` optionally overrides `http://localhost:3000`. The script reads public menu data and modifies only isolated browser-local test carts; it does not submit orders. No application dependency was added.
