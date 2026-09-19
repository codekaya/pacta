# Brand — Pacta

_Status: active_

**The instrument.** Not a web page about a deposit — the deposit's own document.
A patient is being asked to send money abroad to a stranger; what earns that is
the register of a body that keeps records, not the landing page of a startup.

## What that means in practice

Four rules do most of the work. They are also what keeps the product from
drifting back into the generic editorial look it started as.

1. **Labels sit in a fixed column.** `.entry` in `globals.css` — an 8.5rem
   label gutter, value alongside. Never `justify-between`: elastic space
   between a label and its value is what makes a page read as a web layout
   rather than a filled-in form.
2. **Figures are tabular mono, not serif.** An amount is a quantity, not a
   headline. Serif appears in exactly one place per page: the name of the
   institution.
3. **Rules carry meaning.** `.rule-major` (3px double) is a section boundary;
   a single hairline is a row separator. One weight used everywhere is what
   flattens a document into a stack of cards.
4. **Density over air.** Fine print is genuinely small and runs on. Tight
   leading, small labels, packed rows. Generous whitespace reads as marketing.

## Palette

| Token | Value | Role |
|---|---|---|
| `paper` | `#F3EEE4` | Page |
| `panel` | `#EAE2D3` | Dense blocks — the endorsement panel, the preview |
| `ink` | `#1A1612` | Text, the header band, primary action |
| `muted` | `#534C43` | Secondary text (AA on paper) |
| `faint` | `#8B8175` | Fine print, ordinals, tertiary marks — never load-bearing |
| `rule` | `#CBC0AE` | Hairlines and double rules |
| `oxblood` | `#6B2D28` | The row in force, the `◀ now` marker, refusals |
| `forest` | `#2C4A38` | Held, released — the seal |

No gradients. No cool gray. No shadows, no rounded corners anywhere.

## Type

- **IBM Plex Mono** carries the document: labels, every figure, references,
  the schedule, the fine print.
- **Public Sans** for the few plain sentences. It is a typeface drawn for
  government forms, which is the right register.
- **Newsreader** once per page, for the institution's name.

Uppercase labels are tracked at `0.04em`, not `0.16em`. Wide-tracked uppercase
is the tell of a generated page; a real document sets its labels tight.

## Furniture

- **Header band** (`Band`) — ink, full bleed: what the document is, its
  reference, which network.
- **Seal** (`Seal`) — a square bordered mark. Held and released are forest;
  a cancellation is oxblood.
- **Colophon** (`Colophon`) — closes the sheet. A document ends; it does not
  stop.
- **Ordinals** — schedule and register rows are numbered `01 02 03`, with a
  vertical rule between the number and the row.

## Voice

English. Dry, specific, contractual. The vocabulary is the instrument's:
*undertaking, principal, maturity, redemption, beneficiary, issued*. Dates and
amounts, never slogans.
