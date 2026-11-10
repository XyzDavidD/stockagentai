# Interface Typography

## Contents

- Foundations
- Rhythm and scale
- Rendering and themes
- Numbers and tables
- Setting and fitting text
- OpenType features

## Foundations

- Choose type for the product's voice and reading conditions, then use as few families and weights as the hierarchy requires.
- Keep paragraph measure roughly within a comfortable reading range; shorten it for dense or small text and allow flexibility for data-heavy UI.
- Set leading from actual typeface metrics, size, width, and content. Smaller or wider text usually needs more leading; large display text can use less.
- Test real glyphs. Cap height, x-height, punctuation, and numeral shapes matter more than the nominal font size.

## Rhythm and scale

- Use a restrained type scale with explicit roles. Avoid many adjacent sizes that are hard to distinguish.
- Coordinate font size, line height, and surrounding space to create vertical rhythm.
- Make hierarchy through a combination of size, weight, color, spacing, and position; do not make every level bold.
- Align text to useful baselines inside components. Do not force a global baseline grid where it harms component fit.

## Rendering and themes

- Prefer platform-native rendering defaults unless there is a measured reason to change smoothing.
- Inspect light text on dark backgrounds; it often appears heavier or brighter and may require a lighter weight or softer color.
- Verify fallback fonts, font loading, and layout shift.
- Avoid very thin weights for small text or low-quality displays.

## Numbers and tables

- Use tabular figures for columns, timers, prices, counters, and values that update in place.
- Use proportional or old-style figures in prose when supported and appropriate to the voice.
- Right-align comparable numeric columns and align decimals when comparison is central.
- Use slashed zero where ambiguity with capital O is consequential, such as identifiers or code.
- Apply true fractions, superscripts, subscripts, and small caps through font features when available rather than shrinking ordinary glyphs.

## Setting and fitting text

- Adjust tracking sparingly. Large uppercase labels often need added spacing; body text usually does not.
- Balance display headlines intentionally, but do not hard-code line breaks that collapse under localization or responsive layout.
- Use proper punctuation and typographic characters when the content pipeline supports them.
- Consider hanging punctuation for editorial display text, not ordinary controls.
- Truncate only when the hidden content can be recovered or is nonessential. Prefer wrapping for critical labels and values.
- For fluid type, clamp between deliberate minimum and maximum sizes and verify the intermediate widths.
- Use text-box trimming or metric-aware alignment only with safe fallback behavior.

## OpenType features

Enable features deliberately and verify font support. Useful features include tabular or old-style figures, fractions, case-sensitive punctuation, stylistic sets, character variants, and disambiguating glyphs. Never depend on a feature for meaning unless fallbacks remain unambiguous.
