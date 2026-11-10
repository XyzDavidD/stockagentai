# Color and Style Details

## Contents

- Tonality and brightness
- Borders and surfaces
- Controls, icons, and radii
- Gradients and blending

## Tonality and brightness

- Choose a tonal direction for neutrals: warm, cool, or deliberately neutral. Keep whites, grays, blacks, borders, shadows, and muted text in that family.
- Do not combine cool default grays with warm branded surfaces by accident.
- Compare perceived brightness, not only numeric lightness. Saturated hues can appear brighter or darker than their values imply.
- Build semantic roles such as background, surface, raised surface, primary text, secondary text, border, accent, danger, and success. Verify their relationships in context.
- Design dark mode independently enough to preserve hierarchy; simple inversion rarely works.

## Borders and surfaces

- Prefer subtle translucent borders or context-aware separators when a fixed opaque stroke looks muddy across changing backgrounds.
- Use a border, tonal contrast, or shadow according to the separation needed; stacking all three often produces noise.
- Keep edge contrast high enough to communicate control boundaries but low enough to avoid outlining every object.
- Evaluate borders beside shadows and on every actual parent surface.
- Use layered shadows when needed: a tight low-opacity contact shadow plus a broader ambient shadow usually reads more naturally than one heavy blur.

## Controls, icons, and radii

- Keep control styling consistent across idle, hover, focus, pressed, disabled, and selected states.
- Match icon stroke weight, corner character, optical size, and fill style. Do not mix unrelated icon families casually.
- Size icons by perceived mass. A nominally equal square icon and circular icon may need different dimensions.
- Use a small, intentional radius scale. Inner radii should relate to outer radii and inset distance.
- Avoid excessive rounded cards and pills. Use pills for compact labels, statuses, filters, or controls whose semantics benefit from the shape.
- Make focus indication distinct from decorative borders and visible on varied backgrounds.

## Gradients and blending

- Use gradients to model light, depth, emphasis, or brand atmosphere—not to decorate every surface.
- Introduce intermediate stops or eased interpolation when a two-stop gradient shows a harsh midpoint or banding.
- Keep hue travel tonally coherent; interpolate through a deliberate color space when tooling permits.
- Use blend modes only when the underlying content is controlled and legibility remains predictable.
- Check gradients on low-quality displays and dark mode. Add subtle noise only when banding is a real problem and the medium supports it.
