# Compositing and Masks

## Contents

- Paint order
- Isolation and opacity
- Transparency and filters
- Shadows and cross-fades
- Masks

## Paint order

Model the interface as ordered layers: backgrounds, content, borders, effects, overlays, focus rings, and transient UI. When an artifact appears, inspect which layer paints first, which establishes a stacking context, and which clips descendants.

- Keep elevation order predictable and use a documented z-index scale where needed.
- Avoid arbitrary large z-index values; fix the stacking context or ownership problem.
- Ensure focus rings, menus, tooltips, and dialogs are not accidentally clipped.

## Isolation and opacity

- Use isolation when blend modes or overlapping layers must not interact with content outside a component.
- Applying opacity to a group composites its children together before fading. This differs from assigning translucent colors to each child.
- Choose group opacity when the component should fade as one object; choose per-layer alpha when overlaps should remain visible.
- Do not simulate disabled states with group opacity if it makes text contrast inadequate or changes nested imagery incorrectly.

## Transparency and filters

- Overlapping translucent shapes accumulate density. Decide whether that is intended.
- Backdrop filters depend on content behind the element and can be costly. Pair blur with a tint and border so the surface remains legible when blur is unavailable.
- Check translucent surfaces over the brightest, darkest, and busiest permitted backgrounds.
- Create a new compositing layer only when it solves an actual rendering or performance problem.

## Shadows and cross-fades

- Build believable elevation with restrained, layered shadows rather than one dark halo.
- Ensure shadows are not clipped by parent overflow unless the clipping is intentional.
- Cross-fading transparent images can reveal both images and create a ghosted midpoint. Composite onto controlled backgrounds or use masks/paired opacity when necessary.
- Distinguish graphics from images: reconstruct simple vector-like graphics when responsive control matters; preserve raster imagery when texture and detail matter.

## Masks

A mask hides portions of content without deleting or cropping the source.

- Use a geometric clip for crisp shape boundaries.
- Use an alpha mask for gradients, soft edges, texture, or luminance-driven reveals.
- Mask edge fades instead of covering content with a background-colored overlay when the background may change.
- Use masks for shape reveals and text reveals when the hidden content should remain intact.
- Remember that masks affect compositing and hit testing differently across platforms; verify actual behavior.
- Keep accessible content independent of visual masking. Do not hide semantic information only visually.
