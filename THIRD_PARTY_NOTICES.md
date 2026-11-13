# Third-party metadata and font notices

## FACE REFERENCE

Author: あぎ. Source: https://ai-portrait-gallery.pages.dev/ . Retrieved 2026-11-13. Original image index: https://ai-portrait-gallery.pages.dev/data/images.js . The website labels its fictional AI portraits CC0 1.0 and requests avoiding redistribution of image data. This project stores public metadata and links only, with locally authored Chinese hairstyle labels. No image bytes are redistributed.

## Open Pose & Costume / AI Library costume bindings

Sources:
- https://github.com/hongye007/open-pose-costume (source costume metadata only; not custom assets or translations)
- https://github.com/opensegra/ai-library (costume IDs, categories and original-source mappings)
- Original creators' sites: https://ai-costume-gallery.pages.dev/ and https://ai-costume-anime-gallery.pages.dev/ , by ギア (https://x.com/giaaibusi).

Snapshots, pinned commit IDs and stored-input SHA-256 values: data/library-manifest.json. The 1,407 realistic items share an upstream catalog across the two repositories and are stored once, with both source bindings. An additional 1,320 anime records yield 2,727 unique outfit metadata records. Clothing metadata is limited to IDs, categories, factual garment/color keywords, and source URLs; Chinese category names and search aliases are authored locally. No source code, third-party translations, custom assets, thumbnails or original images are copied.

Original costume sites permit individual references for creating works including commercial work and prohibit bulk image downloads and redistribution/republication/resale of image data. This project makes no claim that the upstream projects' code licenses license their images. Selecting a link opens an individual reference on its source site; this app does not request those images automatically.

## Fashionpedia ontology

Fashionpedia Consortium, Jia, Menglin; Shi, Mengyun; Sirotenko, Mikhail; Cui, Yin; Cardie, Claire; Hariharan, Bharath; Adam, Hartwig; Belongie, Serge (2020), “Fashionpedia: Ontology, Segmentation, and an Attribute Localization Dataset,” ECCV.

Source project: https://github.com/cvdfoundation/fashionpedia
Official API metadata: https://github.com/KMnP/fashionpedia-api/blob/master/data/demo/category_attributes_descriptions.json
Terms: https://fashionpedia.github.io/home/data_license.html
License for annotations and ontology: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/ .

This project extracts 46 category/part names and 294 attribute names. It adds Chinese category labels for UI use; original English names and identifiers are retained. No Fashionpedia photographs, segmentation masks, or software are redistributed. Changes: local packaging and optional Chinese category labels/search aliases. The license is not extended to source photographs.

## Display font

Noto Sans SC, Copyright 2014–2021 Adobe. Licensed under the SIL Open Font License 1.1, included at assets/fonts/OFL.txt. A display-only subset was obtained through Google Fonts; exact provenance is in assets/fonts/SOURCE.txt. Controls and body text use platform fonts. User-entered names with characters outside the subset fall back to installed Chinese fonts.

## On-demand reference display (2026-11-13)

The app now renders individual upstream portrait and costume thumbnails in paginated galleries (six per page). Only images near the current viewport in the active gallery are requested, using `referrerpolicy="no-referrer"`. Original-size images are fetched only when the user opens a specific preview. Selected references may appear as upstream thumbnails in the generated profile. These are direct browser requests; no image files, proxy/cache, archive or bulk-download feature is added to this repository. Failure/retry and original-source links remain available. All content still follows the original source's terms.
