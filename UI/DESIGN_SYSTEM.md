# Wall of Stability design system

The interface uses a zinc neutral scale, a desaturated slate accent, and semantic colors for health states. Tokens are defined in `src/styles/tokens.css`; Tailwind utilities map to them through `tailwind.config.ts`.

## Color

| Scale | Values |
| --- | --- |
| Neutral 50–950 | `#fafafa`, `#f4f4f5`, `#e4e4e7`, `#d4d4d8`, `#a1a1aa`, `#71717a`, `#52525b`, `#3f3f46`, `#27272a`, `#18181b`, `#09090b` |
| Accent 50–950 | `#f4f7f8`, `#e6edf0`, `#cddbe0`, `#a9c1ca`, `#7e9eaa`, `#5c7e8d`, `#456575`, `#385361`, `#304650`, `#293b43`, `#17272e` |

Interactive fills use `--color-action` and `--color-action-hover`; text uses contrast-adjusted `--color-accent-text` tokens in each theme. `--color-accent-contrast` is the foreground for text or marks placed directly on accent fills (white in light mode, neutral 950 in dark mode).

Semantic tokens provide `bg`, `border`, and `text` variants: success/operational, warning/degraded, danger/outage, info/maintenance, and neutral/unknown. Dark mode replaces their surface and text values for contrast.

| State | Light bg / border / text | Dark bg / border / text |
| --- | --- | --- |
| Operational | `#f0fdf4` / `#86efac` / `#166534` | `#142d20` / `#24633e` / `#86efac` |
| Degraded | `#fffbeb` / `#fcd34d` / `#854d0e` | `#38290f` / `#78551a` / `#fcd34d` |
| Outage | `#fef2f2` / `#fca5a5` / `#991b1b` | `#3b1e22` / `#7c343b` / `#fca5a5` |
| Maintenance | `#eff6ff` / `#93c5fd` / `#1e40af` | `#1c2b42` / `#365b8c` / `#93c5fd` |
| Unknown | `#f4f4f5` / `#d4d4d8` / `#52525b` | `#27272a` / `#52525b` / `#e4e4e7` |

## Type and layout

- Sans: Inter with system fallbacks. Mono: platform monospace.
- Type sizes: 12, 13, 14, 16, 20, 24, and 30px. Body: 14px. Weights: 400, 500, and 600. Numeric content uses tabular figures.
- Spacing: `--space-0` to `--space-24`; 4px base, with larger steps at 48, 64, and 96px.
- Radius: `--radius-sm/md/lg` = 4/6/8px. Shadows: `--shadow-sm/md`, low-contrast; legacy aliases resolve to one of these levels.
- Control heights: 32, 36, and 40px. Motion: 140–180ms ease-out. Focus: 2px accent outline.
- Light and dark surfaces, text, borders, semantic states, and focus colors use CSS variables selected by `data-theme`.

Compatibility aliases remain for existing components during the staged UI migration; new UI should use the named tokens above. Legacy `full` and `xl` radius aliases resolve to 6px and 8px.
