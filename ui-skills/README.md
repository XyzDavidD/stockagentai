# UI / Design Engineering Skills

A bundle of Claude Code (Agent Skills) focused on interface craft, design engineering, and web animation.

## Install

Drop the folders into your skills directory:

```bash
unzip ui-design-skills.zip
cp -R ui-skills/*/ ~/.claude/skills/
```

Then restart Claude Code. Each folder is a self-contained skill — you can copy only the ones you want.
Use them by name, e.g. `/interface-craft`, or just let Claude pick them up automatically when you're
working on UI.

To scope a skill to a single project instead of globally, put it in `<project>/.claude/skills/`.

## What's in here

| Skill | Author / source | What it does |
| --- | --- | --- |
| `emil-design-eng` | Emil Kowalski | Design-engineering philosophy: UI polish, component design, animation decisions, the invisible details. Trained taste over personal preference. |
| `web-animation-design` | Based on Emil Kowalski's [animations.dev](https://animations.dev) course | Easing, duration, spring physics, entrance/exit transitions, performance, `prefers-reduced-motion`. Includes `PRACTICAL-TIPS.md`. |
| `interface-craft` | Josh Puckett | Toolkit of three sub-skills — Storyboard Animation (readable animation DSL), DialKit (live control panels for tuning values), and Design Critique (systematic UI review). |
| `interface-craftsmanship` | — | Rigorous visual judgment for web/mobile/desktop UI. Reference docs on alignment & layout, typography, color, motion dynamics, compositing & masks, states & perceived performance. |
| `design-with-taste` | Benji Taylor / Family ([benji.org/family-values](https://benji.org/family-values)) | The "Family Values" philosophy: Simplicity, Fluidity, Delight. Anti-generic-UI guardrails. |
| `frontend-design` | Anthropic | Production-grade frontend interfaces that avoid the generic AI aesthetic. |
| `web-design-guidelines` | Vercel | Reviews UI code against the Web Interface Guidelines (accessibility, UX, best practices). |

## Notes

- These are text-only — no dependencies, nothing to build.
- `web-design-guidelines` fetches the latest guidelines from the web at runtime, so it needs network access.
- Skills overlap on purpose. `design-with-taste` and `frontend-design` are meant to run alongside the others.
