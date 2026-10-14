# Brand — Pacta

_Status: active_

Calm, clinical, trustworthy. The logo sets the language: a P built from a teal
circle and a mint leaf, on a soft sky-to-white field. Light surfaces, rounded
white cards, one teal family. The X banner (`images/pacta-x-banner.png`) is the
reference composition.

## Logo

- Source: `images/pacta-logo-teal.jpg` (1254 px).
- Vector: `web/components/Logo.tsx` (`PactaMark`, `Logo`). Favicon: `web/app/icon.svg`.
- Geometry, in source pixels:
  - Circle at (697, 540), r 183.
  - Leaf stem with its left edge at x 426, a top corner of r 90 and a bottom corner of r 181.
  - The stem's tip curves into the circle along an r 187 arc.
- Use the mark on light backgrounds. On the deep-teal CTA it may sit at 25% opacity as a watermark.

## Palette

| Token | Value | Role |
|---|---|---|
| `paper` | `#FFFFFF` | Cards, page |
| `canvas` | `#F6FBFC` | Alternate section background, tiles |
| `mist` | `#EAF7FA` | Active row, tracks, quiet fills |
| `sky` | `#C9EEF5` | Secondary text on `deep` |
| `foam` | `#B2F9E9` | Logo leaf top; pills |
| `mint` | `#5FE8D6` | Logo leaf; positive marks on `deep` |
| `aqua` | `#21BFCA` | Logo circle mid |
| `teal` | `#038C9C` | Italic accent in headlines, large text, focus |
| `held` | `#067A83` | Teal for small text (AA on white, 5.1:1) |
| `deep` | `#00455B` | Primary buttons, dark cards |
| `ink` | `#0B2F3A` | Text |
| `muted` | `#557380` | Secondary text (AA, 5.1:1) |
| `rule` | `#DCEAEE` | Hairlines, card rings |
| `alert` | `#B42318` | Errors only |

Hero and feature backgrounds use `.bg-aura` (`globals.css`): sky at the top
left, mint at the right, fading to white.

## Type

- Display: Newsreader (serif). Headlines carry one italic phrase in `teal`, as in the banner.
- UI: Public Sans.
- Labels: IBM Plex Mono, uppercase, tracked 0.2em, in `held`. One per section, no more.

## Shape

- Cards: `rounded-[28px]`, white, a soft teal-tinted shadow, and a 1px `deep/5` ring.
- Buttons: pill-shaped. Primary is `deep` with white text; secondary is white with a `rule` ring.
- Status pills: "Held" uses `foam` with `held` text; "Done" uses `deep`; "Waiting" uses `mist`.

## Voice

English. Short, plain, specific. Numbers instead of slogans. Say what is real
on testnet and what is not.
