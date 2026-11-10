---
name: interface-craftsmanship
description: Design, implement, review, or refine polished digital interfaces with rigorous visual judgment. Use for web, mobile, or desktop UI work involving layout and alignment, typography, color, borders, iconography, controls, materiality, motion, interpolation, compositing, masks, state machines, loading behavior, perceived performance, or a general request to make an interface feel cohesive, resolved, premium, or less generic.
---

# Interface Craftsmanship

Treat interface quality as a system of related decisions. Preserve the product's intent and conventions while resolving the details that make it feel coherent.

## Work in this order

1. Inspect the existing interface, design system, platform, and implementation constraints. Reuse established tokens and component patterns unless they cause the problem.
2. Identify the job, hierarchy, primary action, content density, and required states. Do not polish an unclear structure.
3. Fix macro layout and alignment before typography, color, decoration, and motion.
4. Refine the smallest set of details that materially improves the result. Avoid adding visual effects merely to signal design effort.
5. Implement complete behavior, including empty, loading, error, success, disabled, focus, hover, pressed, and reduced-motion states where relevant.
6. Verify at realistic viewport sizes, with long content, keyboard navigation, and both light and dark appearances when supported.

## Select references

Read only the references relevant to the task:

- Layout, alignment, navigation, buttons, containers, lists, and forms: [alignment-layout.md](references/alignment-layout.md)
- Color tone, perceived brightness, borders, fills, strokes, radii, icons, and materiality: [color-style.md](references/color-style.md)
- Measure, leading, scales, rhythm, rendering, figures, wrapping, punctuation, and OpenType: [typography.md](references/typography.md)
- Animation, interpolation, clamping, easing, waves, pointer response, and dynamic headers: [motion-dynamics.md](references/motion-dynamics.md)
- Paint order, isolation, opacity, transparency, shadows, backdrop filters, and masks: [compositing-masks.md](references/compositing-masks.md)
- State machines, optimistic UI, loading, and perceived performance: [states-performance.md](references/states-performance.md)

When creating or substantially redesigning an interface, read all six. When reviewing, load the references implicated by observed problems.

## Make design decisions

- Prefer one clear organizing idea over a collection of fashionable effects.
- Use consistency as the default and contrast selectively to express hierarchy or state.
- Distinguish mathematical correctness from optical correctness. Adjust for perceived balance when shapes, icons, type, or negative space make equal numbers look unequal.
- Use tokens or shared primitives for repeated values. Avoid arbitrary one-off values unless an optical correction genuinely requires one.
- Respect platform conventions and accessibility. Craft should improve comprehension, not compete with it.
- Keep ornament subordinate to content. Remove effects that muddy edges, weaken hierarchy, or slow interaction.
- Do not replace a functioning product identity with a generic house style.

## Review by impact

Report or fix issues in this priority order:

1. Interaction blockers, illegible content, accessibility failures, broken states, and misleading feedback.
2. Hierarchy, information architecture, responsive behavior, and major alignment errors.
3. Typography, spacing rhythm, color relationships, controls, and component consistency.
4. Compositing artifacts, optical corrections, micro-interactions, and decorative polish.

For each issue, name the observed symptom, explain the perceptual or behavioral cause, and propose a concrete change. Avoid vague feedback such as "make it cleaner."

## Definition of done

Confirm that:

- Primary content and action are obvious without explanation.
- Repeated elements share alignment, spacing, styling, and behavior.
- Text remains readable with realistic and extreme content.
- Interactive elements expose focus, hover, pressed, disabled, loading, success, and error behavior as applicable.
- Motion communicates continuity or causality, remains interruptible, and honors reduced motion.
- Layers, transparency, masks, and shadows render cleanly on the actual backgrounds.
- The interface works with keyboard navigation and adequate contrast and target sizes.
- The result feels intentional at both the system level and the detail level.
