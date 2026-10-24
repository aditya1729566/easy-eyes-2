# REST API

Responses use `{ "data": ... }` on success or `{ "error": { "message": "..." } }` on failure. Invalid Zod input returns 422. Cookie-authenticated writes require a same-origin request. Supabase Auth handles signup, login, recovery and logout; passwords are never sent to a custom Easy Eyes API.

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| `/api/products` | GET, POST | Public, admin write | Paginated catalog; create |
| `/api/products/[id]` | GET, PATCH, DELETE | Public, admin write | Product, edit, archive |
| `/api/products/[id]/reviews` | GET, POST | Public, user write | Approved reviews, submit pending review |
| `/api/collections` | GET, POST | Public, admin write | Collection index and create |
| `/api/collections/[slug]` | GET, PATCH, DELETE | Public, admin write | Collection details and visibility |
| `/api/cart` | GET, DELETE | Guest/user | Read or empty bag |
| `/api/cart/items` | POST | Guest/user | Add variant |
| `/api/cart/items/[id]` | PATCH, DELETE | Guest/user | Change/remove item |
| `/api/cart/merge` | POST | User | Merge guest bag after login |
| `/api/checkout/quote` | GET | Guest/user | Server-calculated bag subtotal and configured shipping |
| `/api/orders` | GET, POST | User | Own orders; atomic unpaid request |
| `/api/orders/[id]` | GET | Owner/admin | Detail |
| `/api/orders/[id]/status` | PATCH | Admin | Valid status transition |
| `/api/users/me` | GET, PATCH | User | Safe profile fields |
| `/api/addresses` | GET, POST | User | Address book |
| `/api/addresses/[id]` | PATCH, DELETE | Owner | Change/remove address |
| `/api/wishlist` | GET, POST, DELETE | User | Saved frames |
| `/api/contact` | POST | Public | Persist contact message |
| `/api/media/[bucket]/[...path]` | GET | Published/admin | Private media delivery |
| `/api/admin/variants` | POST | Admin | Add SKU |
| `/api/admin/variants/[id]` | PATCH | Admin | Edit SKU and stock |
| `/api/admin/products/[id]/images` | POST | Admin | Attach uploaded media |
| `/api/admin/collections/[id]/products` | POST, DELETE | Admin | Assign products |
| `/api/admin/campaigns` | POST | Admin | Create editorial campaign |
| `/api/admin/campaigns/[id]` | PATCH | Admin | Edit campaign |
| `/api/admin/reviews/[id]` | PATCH | Admin | Moderate review |
| `/api/admin/media` | POST | Admin | Validated Storage upload |
| `/api/admin/expire` | GET | Cron bearer secret | Release expired holds |

Example order submission:

```json
{"address":{"name":"Example Customer","phone":"9999999999","line_1":"Example Road","city":"Bengaluru","state":"Karnataka","postal_code":"560001","country":"IN"},"email":"customer@example.com","note":"","idempotency_key":"a7dd56a1-a51d-4133-b36b-dfa03092a55f"}
```

The server ignores client-supplied prices and creates an immutable order snapshot. Stock conflicts return 409. Payment status is always `not_collected`.
