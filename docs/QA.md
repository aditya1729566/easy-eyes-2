# QA record

## Passed

- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass with the live Supabase URL and publishable key configured.
- `npm run test:e2e` passes storefront navigation and mobile menu checks at 375px.
- Supabase migrations `init_easy_eyes`, `trigger_permissions`, and `public_read_policies` are applied to project `dwxjecxzpxhkdsvqlipu`. All 21 public tables have RLS enabled.
- The optional seed created three draft demonstration products and four variants. None are published or shown to shoppers.
- Transactional SQL checks (rolled back after each run) confirmed auth signup creates a profile; a customer can update their name but cannot promote their role; a second customer cannot read the first customer's order. Unpaid checkout creates one order and one line, decrements stock, clears the bag, and remains idempotent; admin confirmation then cancellation restores stock; expiration restores stock. Anonymous users cannot read unlinked draft media but can read media linked to a published product.
- Live API smoke checks: catalog GET returns 200, missing product returns 404, unauthenticated product create returns 403, and a cross-origin contact POST returns 403.
- With the server-only secret configured, guest bag GET, add, quantity change, insufficient-stock rejection, server quote and item removal passed against Supabase. The temporary published QA product and variant were removed afterward. A valid contact POST returned 201 and its test message was removed.
- The Supabase security advisor no longer reports anonymous execution of privileged functions. It still reports signed-in access to three security-definer functions; these are intended for role checking, authenticated checkout, and admin status transitions. `contact_rate_limits` has no client RLS policy by design.
- Browser visual inspection at a desktop viewport: home structure inspected and an overlapping placeholder-art label removed.

## Pending live-flow checks

- Test contact rate limiting, signed-in customer flows, account isolation over HTTP, and admin media upload.
- Configure Auth callbacks and verify signup, email confirmation, login, password recovery, addresses, wishlist, reviews, and unpaid order from the browser.
- Check last-unit concurrency, order status authorization, and Storage RLS using real user sessions. The transactional SQL checks cover the functions but not every HTTP path.
- Test at 320, 430, 768, 1024, and 1440px; keyboard-only and reduced-motion behavior; performance and SEO after final media is present.
- Connect Vercel, deploy, and repeat critical flows on the deployed URL.

## Launch inputs

Approved Easy Eyes catalog photos and campaign video/poster, merchandise details and prices, support contact, and reviewed legal policies are still needed. The current vector artwork is a clearly labelled placeholder; the catalog has no published merchandise. The public site remains `noindex` until launch review.
