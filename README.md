# SOC122 Corpus

The reading room for **SOC122: Introduction to the Social Sciences** at Seneca Polytechnic.

A student-facing source library: search and filter the course readings, move through the course by week, drill into one source, hold up to three readings side by side, and synthesize comparisons through the stationary compare picker. The current data set has 22 readings and 231 pair-synthesis cards.

It is a **companion to Blackboard**, not a replacement. Official records, discussion, grades, and submission live in Blackboard. The public app has no accounts, no grading, no student-to-student interaction, no analytics, no PDFs, and no reproduced reading text. Free readings link out to OpenStax or open-access pages; copyrighted or library readings are not linked here and are reached through the Blackboard weekly Readings folders or the Seneca Library.

Every Indigenous reading is authored by an Indigenous scholar (a compulsory course rule, applied 2026-06-24).

## Run it
Static site, no build step, no framework. Open `index.html` in a browser, or serve the folder and visit it:

```bash
python3 -m http.server 8200
```

The local preview target is `http://localhost:8200`. IBM Plex (Sans and Mono) is self-hosted from `./fonts/` (OFL 1.1, license in `fonts/OFL.txt`); the site loads no Google Fonts.

## Editing content
All readings are in `data/corpus-data.js` (one `window.SOC122` object).
- Each record: `id, eye, type, access, title, authors, year, themes[], origin, len, diff, week, abstract, coreIdea, related[]`, plus `url` or `doi`.
- `eye`: `'western'` or `'indigenous'` (the Two-Eyed Seeing pairing side). Every `indigenous` reading must be Indigenous-authored.
- `access`: `'openstax' | 'open' | 'verified' | 'library'`. Only `openstax` and `open` get a public "Open the reading" link; `verified` (copyrighted, held for Blackboard course reserves) and `library` (licensed, via the Seneca Library) render as "Find this on Blackboard" with no public link, for copyright.
- `related[]` drives "Read alongside" and should pair each Western reading with its Indigenous counterpart.
- `syntheses` holds every reading pair as a sorted key. Do not use week numbers in synthesis copy, and never use em or en dashes anywhere.

## Source boundary
The corpus uses local SOC122 source records and the Zotero collection. Do not place PDFs, screenshots, copied article text, or licensed readings in `_app`. Reading PDFs live outside the public site in `projects/_config/research/sources/SOC122/pdfs/` and are posted only to Blackboard.

## Current status
Forge and Codex co-ratified the Indigenous-led rebuild on 2026-06-24 for `index.html`, `app.js`, and `data/corpus-data.js`, and the site is deployed to GitHub Pages.

Current app hashes:
- `index.html`: `13826c1c46d4119e334b60ffc5e2c7373d3dec9233d3f41118122655889e1d65`
- `app.js`: `8559f1c6ed1c440b7f1c5c10ae90491d0a0bfd473061f5db138cb13846858b85`
- `data/corpus-data.js`: `ca9f6351c0f296ae8aa06c38a8aac79da4ee5f49d2f89bfdfafd0972630537c4`

## Design source
Recreated from `../_design/_extracted/design_handoff_soc122_corpus/` (the high-fidelity prototype). The `.dc.html` prototype runtime was not ported; this is a vanilla rebuild in the BFS218 `_app` pattern.
