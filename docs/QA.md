# QA record

## Passed

- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass with the live Supabase URL and publishable key configured.
- `npm run test:e2e` passes storefront navigation and mobile menu checks at 375px.
- Supabase migrations `init_easy_eyes`, `trigger_permissions`, `public_read_policies`, and `order_expiry_schedule` are applied to project `dwxjecxzpxhkdsvqlipu`. All 21 public tables have RLS enabled. The hourly Supabase Cron job is active; a direct function call returned zero expired orders.
- The optional seed created three draft demonstration products and four variants. None are published or shown to shoppers.
- Transactional SQL checks (rolled back after each run) confirmed auth signup creates a profile; a customer can update their name but cannot promote their role; a second customer cannot read the first customer's order. Unpaid checkout creates one order and one line, decrements stock, clears the bag, and remains idempotent; admin confirmation then cancellation restores stock; expiration restores stock. Anonymous users cannot read unlinked draft media but can read media linked to a published product.
- Live API smoke checks: catalog GET returns 200, missing product returns 404, unauthenticated product create returns 403, and a cross-origin contact POST returns 403.
- With the server-only secret configured, guest bag GET, add, quantity change, insufficient-stock rejection, server quote and item removal passed against Supabase. The temporary published QA product and variant were removed afterward. A valid contact POST returned 201 and its test message was removed.
- A live Playwright customer journey passed sign in, wishlist, add to bag, unpaid checkout, receipt and order history. The test user, product and order were cleaned up and their absence verified.
- A live Playwright admin journey passed draft product creation, variant stock creation, validated Storage upload and image attachment. Temporary admin, product and media records were removed and their absence verified. This found and fixed duplicate form label IDs in the variant editor.
- The Vercel deployment built successfully from GitHub and received the `easy-eyes-ecru.vercel.app` alias. Supabase Auth site URL and the two exact callback URLs were saved and verified in the dashboard.
- The latest protected deployment serves the home page, shop and catalog API with HTTP 200. The catalog API correctly returns no published products; `robots.txt` disallows crawling and page metadata says `noindex, nofollow`. Supabase Cron run history shows successful hourly executions.
- The Supabase security advisor no longer reports anonymous execution of privileged functions. It still reports signed-in access to three security-definer functions; these are intended for role checking, authenticated checkout, and admin status transitions. `contact_rate_limits` has no client RLS policy by design.
- Browser visual inspection at a desktop viewport: home structure inspected and an overlapping placeholder-art label removed.

## Pending live-flow checks

- Test contact rate limiting and account isolation over HTTP.
- Verify public signup, email confirmation, password recovery, addresses and reviews from the browser. Sign in, wishlist and unpaid order passed locally.
- Check last-unit concurrency, order status authorization, and Storage RLS using real user sessions. The transactional SQL checks cover the functions but not every HTTP path.
- Test at 320, 430, 768, 1024, and 1440px; keyboard-only and reduced-motion behavior; performance and SEO after final media is present.
- Repeat critical customer and admin flows on the protected Vercel deployment after the final Git push.

## Launch inputs

Approved Easy Eyes catalog photos and campaign video/poster, merchandise details and prices, support contact, and reviewed legal policies are still needed. The current vector artwork is a clearly labelled placeholder; the catalog has no published merchandise. The public site remains `noindex` until launch review.
