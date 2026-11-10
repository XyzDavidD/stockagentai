# Motion and Dynamic Values

## Contents

- Motion principles
- Transitions and sequencing
- Interpolation
- Waves
- Accessibility and performance

## Motion principles

- Animate to communicate continuity, causality, hierarchy, or state. Treat delight as a selective secondary purpose.
- Keep transitions interruptible and responsive to new input.
- Preserve spatial relationships: an element that moves between states should appear to travel from its source to destination.
- Prefer transform and opacity for routine motion, but choose correctness over blanket performance folklore.
- Use semantic motion consistently: the same kind of event should produce the same kind of movement.

## Transitions and sequencing

- Chain related elements with a small stagger when sequence clarifies structure. Avoid large cascades that delay access.
- Make replacement transitions fast, especially in frequently used controls.
- Use arcs when an object moves between positions and a straight line feels mechanical or intersects content.
- Tune entrance, exit, and shared-element timing separately; exits often need to finish faster.
- Preserve dimensions during status changes where layout movement would distract.

## Interpolation

To map input `x` from `[a, b]` into output `[c, d]`:

1. Normalize: `t = (x - a) / (b - a)`.
2. Clamp `t` to `[0, 1]` unless extrapolation is intentional.
3. Apply easing to `t` when a linear relationship feels mechanical.
4. Interpolate: `y = c + (d - c) * t`.

Use this for scroll-linked headers, pointer reactivity, color transitions, parallax, progress, and elastic boundaries. Clamp visual properties that become illegible or unstable outside a safe range. Avoid mapping noisy input directly; smooth it when necessary without making interaction lag.

For rubber banding, reduce apparent movement beyond the boundary rather than stopping abruptly. On release, return with a well-damped spring.

## Waves

A periodic function such as `sin(2πt)` produces a smooth repeating value. Control:

- amplitude for magnitude;
- frequency for cycles per interval;
- phase for offset between elements;
- vertical offset for the center value;
- waveform for character.

Use waves for subtle ambient motion, procedural graphics, oscillating properties, or phase-shifted motion across a collection. Combine a small number of waves for organic variation. Keep amplitude low in functional UI, avoid synchronized motion everywhere, and pause offscreen or background animation.

## Accessibility and performance

- Honor `prefers-reduced-motion` or the platform equivalent by removing travel, parallax, oscillation, and nonessential loops; use immediate changes or short fades.
- Never make essential information available only during animation.
- Test rapid repeated input, mid-transition reversal, backgrounding, and slow devices.
- Avoid continuously updating layout or expensive filters without measurement.
