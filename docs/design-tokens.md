# Design tokens

Defined once in `styles/globals.css` under Tailwind v4's `@theme`. Utilities are generated from the names, so `bg-primary`, `text-ink-muted` and `rounded-card` are the only way to reach these values. Do not hard-code hex values in components.

## Colour

| Token | Utility examples | Light | Dark |
|---|---|---|---|
| `--color-canvas` | `bg-canvas` | `#F7F6F2` | `#0F1216` |
| `--color-surface` | `bg-surface` | `#FFFFFF` | `#161B22` |
| `--color-border` | `border-border` | `#E4E2DC` | `#262C36` |
| `--color-ink` | `text-ink` | `#13181F` | `#F1F3F5` |
| `--color-ink-muted` | `text-ink-muted` | `#5B6370` | `#9CA3AF` |
| `--color-overlay` | `bg-overlay` | `rgb(19 24 31 / 0.4)` | `rgb(0 0 0 / 0.7)` |
| `--color-primary` | `bg-primary`, `text-primary` | `#0E5A4F` | `#198172` |
| `--color-primary-hover` | `hover:bg-primary-hover` | `#0A4740` | `#1F9C8A` |
| `--color-primary-active` | `active:bg-primary-active` | `#073530` | `#177565` (derived) |
| `--color-waiting` (+ `-subtle`, `-border`) | `text-waiting bg-waiting-subtle` | `#8A5300` / `#FFF4E0` / `#FFF4E0` | `#FFB347` / `#2B1D00` / `#593A00` |
| `--color-done` (+ `-subtle`, `-border`) | `text-done bg-done-subtle` | `#1F6B45` / `#E8F5EE` / `#E8F5EE` | `#4ADE80` / `#0B291A` / `#165634` |
| `--color-danger` (+ `-subtle`, `-border`) | `text-danger bg-danger-subtle` | `#A3271C` / `#FDECEA` / `#FDECEA` | `#F87171` / `#330F0D` / `#661D1A` |

## Radius

| Token | Utility | Value | Used for |
|---|---|---|---|
| `--radius-card` | `rounded-card` | 12px | cards, panels, sign-off containers |
| `--radius-control` | `rounded-control` | 10px | buttons, inputs, selects |
| `--radius-menu` | `rounded-menu` | 8px | dropdowns, context panels |
| (built-in) | `rounded-full` | 9999px | chips, badges, stepper nodes |

## Shadow

| Token | Utility | Value |
|---|---|---|
| `--shadow-float` | `shadow-float` | `0 1px 2px rgb(0 0 0 / 0.03), 0 4px 12px rgb(0 0 0 / 0.04)`. For floating bars, modals and sheets only. Cards use a 1px border, not a shadow. |

## Type

Font family: Inter, via `--font-sans`. Weights 400, 500, 600.

| Token | Utility | Size / line height | Weight | Tracking |
|---|---|---|---|---|
| headline-xl | `text-headline-xl` | 36px / 44px | 600 | -0.02em |
| headline-lg | `text-headline-lg` | 28px / 36px | 600 | -0.02em |
| headline-md | `text-headline-md` | 20px / 28px | 600 | -0.015em |
| headline-sm | `text-headline-sm` | 16px / 24px | 600 | -0.01em |
| body-lg | `text-body-lg` | 16px / 24px | 400 | 0 |
| body-sm | `text-body-sm` | 14px / 20px | 400 | 0 |
| label-md | `text-label-md` | 12px / 16px | 600 | 0.02em |
| label-sm | `text-label-sm` | 11px / 14px | 500 | 0.04em |

Use `font-medium` (500) on top of body tokens for emphasis. Mobile headline sizes are `text-headline-lg sm:text-headline-xl` and `text-headline-md` with a `sm:` override where the spec calls for it.

Use `.tnum` (tabular figures) on every amount, timestamp, date, percentage and step number.

## Spacing

Tailwind's default scale is 4px per unit, which matches the spec's 4/8/12/16/20/24/32/48 grid. Spec names map as follows: `space-xs` = `1`, `space-sm` = `2`, `space-md` = `4`, `space-lg` = `6`, `space-xl` = `8`. Gutter and margin: 16px on phone, 24px on tablet, 32px on desktop (`px-4 sm:px-6 lg:px-8`).

## Focus

`:focus-visible` uses a 2px `--color-primary` outline with a 2px offset (base layer in `globals.css`). Inputs will add a 3px halo `rgb(14 90 79 / 0.15)` when they are built.

## Motion

`prefers-reduced-motion` collapses animation and transition durations (base layer). The spinner is `motion-safe:animate-spin`.
