# Alignment and Layout

## Contents

- Alignment methods
- Optical correction
- Common components
- Responsive verification

## Alignment methods

Choose an explicit alignment model for every group:

- **Edge:** Align shared left, right, top, or bottom edges. Use for cards, fields, text blocks, and repeated controls.
- **Axis:** Align centers on a horizontal or vertical axis. Use for balanced controls, icon buttons, and symmetrical groups.
- **Baseline:** Align text and text-adjacent controls by typographic baseline, not bounding-box center.
- **Mathematical:** Use equal coordinates, gaps, dimensions, or distribution when the shapes have comparable visual mass.
- **Optical:** Apply small compensation when geometry looks wrong despite equal values. Icons, asymmetric glyphs, rounded shapes, and play triangles commonly need it.

Do not mix alignment models accidentally. A group may use edge alignment at the container level and baseline alignment inside each row.

## Optical correction

- Judge visible mass and negative space rather than only frames.
- Center icons by their drawn shape, not an SVG view box containing uneven padding.
- Let rounded or pointed shapes extend slightly beyond a strict edge when necessary to appear aligned.
- Keep optical offsets local and documented; do not corrupt the global spacing scale.
- Compare at final size. Corrections made while zoomed in often fail in context.

## Common components

### Navigation

- Give the active destination a clear but stable treatment; avoid layout shifts between states.
- Align labels consistently and keep hit targets larger than their visible marks.
- Separate global navigation, local navigation, and actions through position and styling.

### Buttons

- Align mixed icon and text buttons by perceived center and text baseline.
- Keep label padding consistent across variants while allowing compact icon-only controls.
- Make the primary action visually dominant without making secondary actions look disabled.
- Preserve dimensions through loading states when possible.

### Containers

- Use a consistent content edge across headers, body sections, cards, and footers.
- Derive nested padding from a spacing system. Avoid nearly-equal gaps that look accidental.
- Let container boundaries earn their presence through grouping; do not box every region.

### Content lists

- Establish stable columns for thumbnails, titles, metadata, values, and actions.
- Align variable content to a predictable anchor.
- Make row density match the task: scanning benefits from rhythm; manipulation requires sufficient targets.

### Forms

- Prefer one strong alignment axis for labels and fields.
- Place help, validation, and error text where it does not cause confusing reflow.
- Group related fields with spacing before adding borders or panels.
- Keep control sizes and label relationships consistent; reserve exceptions for semantic need.

## Responsive verification

Test narrow, typical, and wide widths. Use realistic long labels, translated text, multiline values, validation messages, and empty content. Confirm that reflow preserves hierarchy rather than merely preventing overflow.
