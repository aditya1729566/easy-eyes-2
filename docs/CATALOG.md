# Collection archive

The supplied `easy-eyes-120-product-catalog.zip` contains 120 fictional frame concepts in four collections: Objects of Light (28), After Dark (24), New Perspectives (22), and Optical Studies (46). The source has draft status and zero stock for every entry. `data/catalog-demo.json` preserves those entries. Their sample names, prices and specifications have not been verified as real merchandise.

The user supplied [shravya11/eyeglasses-dataset](https://huggingface.co/datasets/shravya11/eyeglasses-dataset) for **glasses images only**. `scripts/fetch-catalog-reference-images.mjs` selects 120 unique product-only front photographs from a pinned dataset revision (96 sunglasses and 24 optical), writes them to `public/assets/catalog-reference/`, and records exact source URLs in `data/catalog-reference-manifest.json`. The dataset is listed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). These are visual references, not product matches to the concepts. Both collection pages say so. Model portraits and their gallery remain separate.

Run the importer with a local `.env.local` containing the Supabase URL and server secret:

```sh
node --env-file=.env.local scripts/import-catalog-demo.mjs --prepare
```

`--prepare` creates or updates four hidden collections, 120 draft products, 120 inactive variants with zero stock, product reference image rows and collection memberships. It refuses to replace unrelated rows sharing those slugs. Existing public product listings and checkout cannot sell these entries. The collection pages read these specific drafts on the server using the catalog source marker; no server key reaches the browser. Set `CATALOG_STUDIES_PREVIEW=1` locally to preview hidden collections.

After the site code and image assets are deployed and verified, publish just the four collections:

```sh
node --env-file=.env.local scripts/import-catalog-demo.mjs --publish
```

The archive then appears at `/collections`. It provides type, shape and text filters plus pagination. It has no product or purchase links. Replace reference photos with approved images of the actual named frames, verify prices and specifications, and explicitly publish product records before treating any entry as merchandise.
