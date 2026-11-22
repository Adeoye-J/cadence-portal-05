# 0005: Styling and icons

**Status:** Accepted.

**Context.** The Stitch exports load Tailwind from a CDN and icons from Material Symbols. The brief requires a compiled Tailwind build with one set of tokens, and lucide-react as the icon set.

**Decision.**
- Tailwind CSS v4 with the CSS-first `@theme` block in `styles/globals.css`. Tokens are defined once and generate utilities. Dark mode is a `.dark` class.
- Components use `class-variance-authority` for variants and `tailwind-merge` through `lib/cn.ts`.
- Icons come only from lucide-react, through the semantic map in `lib/icons.ts`. Pages never import lucide directly.
- No component library is used as-is. Accessible primitives (Radix UI or React Aria) are wrapped in our own components when a primitive is first needed, such as dialogs and menus.

**Consequences.** Renaming a token or an icon is a one-file change. A Material Symbol name in the code is a review failure, not a style choice. The lucide export names are unverified until the first install (docs/icon-map.md).
