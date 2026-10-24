# Assets

Place approved Easy Eyes campaign media under `public/assets/campaign/` and static brand files under `public/assets/brand/`. Product media is uploaded to the private Supabase `catalog` bucket through the admin interface, then attached to products with an alt description and view order. Campaign images/video use the private `campaigns` bucket and are linked from campaign records. Supported images: JPEG, PNG, WebP, AVIF, up to 10 MB. Campaign MP4 may be up to 50 MB.

Update `src/config/brand-assets.ts` for static local fallback roles. The current SVG is an illustration slot. Supply a hero poster even when supplying video. Keep eyewear fully within product image crops, maintain view consistency, and use descriptive alt text. The hero video is muted, loops and plays inline; reduced-motion users see a poster. Replace demonstration content before launch.
