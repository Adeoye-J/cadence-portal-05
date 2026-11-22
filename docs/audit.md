# Audit: Stitch export, "Cadence Client Delivery Portal"

Source: `stitch_cadence_portal_design_system.zip`. Design system: `executive_precision/DESIGN.md`.

## Inventory

- 57 screen folders. 56 contain `code.html` and `screen.png`. One folder contains only `DESIGN.md`.
- 14 screens are desktop variants (folder suffix `_desktop`) of a mobile screen, for example `milestones` and `milestone_detail_desktop`. A pair is one route with two layouts, not two routes.
- Some folders are multi-state boards rather than single pages: `check_your_email_dual_states`, `payment_processing_confirmed_states`, `payment_processing_confirmed_desktop`. Each state becomes a state of one route, not a route of its own.
- 4 folders are transactional email canvases (`email_*`). They become React Email templates, not routes.
- Two audiences share one design language: the **client portal** (magic-link, mobile-first sign-off) and the **studio console** (desktop-first, 240px side navigation, 12-column grid).

Full route mapping: `docs/route-map.md`.

## Findings

| # | Area | Finding | Evidence | Resolution |
|---|---|---|---|---|
| 1 | Icons | Material Symbols Outlined used on 56 of 56 screens. The brief requires lucide-react. | 1,537 icon uses, 261 distinct names | Semantic icon map in `lib/icons.ts`. 82% of uses mapped. Remaining 135 names in `docs/icon-map.md`. |
| 2 | Build | Every screen loads Tailwind from `cdn.tailwindcss.com` with inline config. | 56 screens | Removed. Tokens compiled via Tailwind v4 CSS-first theme. |
| 3 | Fonts | Google Fonts loaded for Inter at 100 to 700, plus Material Symbols. | 180 references to `fonts.googleapis.com` | Inter self-hosted through `next/font` at weights 400, 500, 600 only. Material Symbols dropped. |
| 4 | Colour | Primary has two values in DESIGN.md: `primary: #004138` in the YAML and `Primary Accent: #0E5A4F` in the prose. Screens use both. | `#0e5a4f` 68 occurrences, `#004138` 61 occurrences | Canonical `#0E5A4F`. Resolved in `docs/design-decisions.md`. |
| 5 | Colour | Canvas is `#FAF9F5` in the screens and YAML but `#F7F6F2` in the spec prose. | `#faf9f5` 181 occurrences. `#f7f6f2` is not among the 40 most used colours. | Canonical `#F7F6F2` (the spec text is explicit). |
| 6 | Colour | Body text is `#1B1C1A` in screens and `#13181F` in the spec. | `#1b1c1a` 114 occurrences, `#13181f` 2 occurrences | Canonical `#13181F`. |
| 7 | Colour | Error is `#BA1A1A` (Material default) in screens, `#A3271C` in the spec. | `#ba1a1a` 56 uses | Canonical `#A3271C`. |
| 8 | Colour | Borders use `#E3E2DF` (112 occurrences) or `#BFC9C5` (66) from the Material outline palette, where the spec says `#E4E2DC`. | Counted across all screens | Canonical `#E4E2DC`. |
| 9 | Shape | `rounded-lg` appears 984 times. Its meaning changes with the Tailwind version. The spec says cards are 12px, buttons 10px, menus 8px, and pills full. | Spec and YAML disagree on what `lg` means (1rem in YAML, 12px in prose) | Named radius tokens: `rounded-card` (12px), `rounded-control` (10px), `rounded-menu` (8px), `rounded-full`. |
| 10 | Images | A portrait photograph of a named person (alt text "Close-up professional portrait of Marcus Vance"), hosted on `lh3.googleusercontent.com`. | 1 screen | **Removed.** DESIGN.md forbids people imagery. Not carried into the build. |
| 11 | Images | Logo is a Stitch-hosted image on `lh3.googleusercontent.com`, used 9 times. | 9 screens | Replaced by a text wordmark until the client supplies a vector logo. |
| 12 | Images | Two schematic illustrations on `lh3.googleusercontent.com`: a UI design-kit preview and a mobile checkout wireframe. | 2 screens | Allowed content type under DESIGN.md. Must be downloaded, optimised and served locally, or redrawn as vector. Not yet done. |
| 13 | Links | A Stitch share link (`delivery.forma.design/c/lumen-29af`) is shown as a copyable client link. | 2 screens | Removed. Real share links will come from the app. |
| 14 | Interactions | All exports are static HTML. Buttons, links and inputs have no behaviour. | Every screen | Every control is treated as unbuilt until wired. None is considered working. |
| 15 | Roles | Brief says admin, owner, reader. Screens say Owner, Admin, Member, Viewer. | `team_roles` and related screens | Canonical role names: `owner`, `admin`, `member`, `viewer`. See `docs/assumptions.md`. |
| 16 | Currency | Screens show both `$` (244) and `₦` (22). DESIGN.md says a project's currency is locked at the project root. | Payment and milestone screens | Currency is a project-level field. A project cannot mix USD and NGN milestones. |
| 17 | Sample data | Named sample clients, for example "Lumen Coffee Co.", "Acme Studio Ltd", and the email `admin@lumencoffee.com`. | Several screens | Used only as seed data for development. Never shipped in production components. |
| 18 | Dates | Screens show several date formats. DESIGN.md requires `DD MMM YYYY`. | Timestamps across screens | Single formatter in one module (not yet built). |
| 19 | Stitch clutter | Inline `onclick` clipboard scripts, generated class lists and absolute-position layout hacks. | Several screens | Not carried over. Rebuilt as components. |

## Dead interactions

Every control in the export is inert. Before a screen is marked done, each button, link, toggle, input and menu must either work end to end or be removed from the UI. Any unavoidable placeholder goes under "Known limitations" in the README.

## Missing routes

The screens cover most of the product. The gaps are listed in `docs/route-map.md` under **derived**: 404 and global error pages, account profile, data export and deletion, terms, privacy, cookies, help and contact. Forgot-password and password-reset are excluded because sign-in uses magic links (no passwords exist to reset).
