# SOC122 Corpus

The reading room for **SOC122: Introduction to the Social Sciences** at Seneca Polytechnic.

A student-facing source library: search and filter the course readings, move through the course by week, drill into one source, hold up to three readings side by side, and synthesize comparisons through the stationary compare picker. The current data set has 22 readings and 231 pair-synthesis cards.

It is a **companion to Blackboard**, not a replacement. Official records, discussion, grades, and submission live in Blackboard. The public app has no accounts, no grading, no student-to-student interaction, no analytics, no PDFs, and no reproduced reading text. It links out to OpenStax, open-access pages, library-access records, or canonical DOI pages.

## Run it
Static site, no build step, no framework. Open `index.html` in a browser, or serve the folder and visit it:

```bash
python3 -m http.server 8200
```

The current local preview target is `http://localhost:8200`. IBM Plex currently loads from Google Fonts; self-hosting the font files remains a pre-deploy task.

## Editing content
All readings are in `data/corpus-data.js` (one `window.SOC122` object).
- Each record: `id, eye, type, access, title, authors, year, themes[], origin, len, diff, week, abstract, coreIdea, related[]`, plus `url` or `doi`.
- `eye`: `'western'` or `'indigenous'` (the Two-Eyed Seeing pairing side).
- `access`: `'openstax' | 'open' | 'verified' | 'pending'`. `pending` honors the Bartlett, Marshall & Marshall (2012) access hold: bibliographic data only, no invented pages or quotes, and "Open the reading" points to the canonical DOI.
- `themes` reference the 8 keys in `themes` (disciplines and foundations lead; Two-Eyed Seeing is the lens).
- `related[]` drives "Read alongside" and should pair each Western reading with its Indigenous counterpart.
- `syntheses` holds every reading pair as a sorted key. Do not use week numbers in synthesis copy.

## Source boundary
The corpus uses local SOC122 source records and Zotero mapping. The 5-reading RIS addendum is bibliographic only. Do not place PDFs, screenshots, copied article text, or locally licensed readings in `_app`. Local source files stay outside the public site.

## Current status
The enhanced site was co-ratified by Forge and Codex on 2026-06-23 for `index.html`, `app.js`, and `data/corpus-data.js`.

Current app hashes:
- `index.html`: `e0c0d5c1f75e061fe00b1d540b6e63b314e779c7c3da81398709c596eacda5c5`
- `app.js`: `56652d85c6c408f718ea8bc991a55bd883b81340c9e705eace0370a7f3cff713`
- `data/corpus-data.js`: `a24569d5a4a4e9d4585fad2b4080c3a287841c6f94afab74213b2e9ade2d51c4`

## Remaining work
- Pin exact OpenStax chapter titles/numbers against the weekly content.
- Self-host the IBM Plex fonts (currently Google Fonts) for offline and privacy.
- Deploy to the public `soc122-corpus` GitHub Pages repo (companion to Blackboard).
- Optional low-item sweep: dead Save/Type/Sort code cleanup, search-caret preservation, full mobile primary-nav menu, and two minor card-voice tweaks.

## Design source
Recreated from `../_design/_extracted/design_handoff_soc122_corpus/` (the high-fidelity prototype). The `.dc.html` prototype runtime was not ported; this is a vanilla rebuild in the BFS218 `_app` pattern.
