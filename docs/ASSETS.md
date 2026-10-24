# Assets

The homepage now uses the supplied campaign media. Nine distinct original model portraits live in `public/assets/models/look-01.png` through `look-09.png`; one supplied portrait was an exact duplicate and is shown once. Transparent cutouts in `public/assets/models/cutout/` let the models share the gallery backdrop. `src/config/editorial-looks.ts` defines their order, alt text, and the displayed ₹25,000 price. The gallery price is editorial display only until corresponding product records and eyewear photos are supplied. Each look has an optional `frameImage` field ready for its matching glasses image.

The opening hero plays `public/assets/campaign/film-01.mp4`, `film-02.mp4`, and `film-03.mp4` in order, then repeats while visible. Visitors can select any film with the numbered controls or pause playback. Videos are muted and inline. People who prefer reduced motion see a still poster until they choose to play a film.

Product media is uploaded to the private Supabase `catalog` bucket through the admin interface, then attached to products with an alt description and view order. Campaign media managed in the admin uses the private `campaigns` bucket. `src/config/brand-assets.ts` holds local fallback assets.
