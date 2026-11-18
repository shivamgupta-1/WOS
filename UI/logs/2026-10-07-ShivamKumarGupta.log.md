# Prompt History - 2026-10-07

## User request

Redesign the existing application as **OpsIntel - Unified Operations Intelligence Platform** using a feature-oriented React/TypeScript architecture. The requested product includes:

- A responsive shared shell with navigation, environment/business-unit/time controls, global search, and persisted light/dark theme.
- A health overview with six KPIs, a sortable/filterable/paginated virtual application table, sparklines, and active incidents.
- Application detail with operational actions, tabs, threshold-aware time-series charts, dependencies, and activity timeline.
- A five-step onboarding wizard with per-step Zod validation, data-source connection polling, configurable metrics/SLOs, alert ownership, and review.
- RTK Query server state, Redux UI draft state, lazy routes, strict TypeScript, keyboard/accessibility support, and responsive styling.

## Implementation notes

- Preserve the existing MSAL bootstrap, authentication slice, and legacy RTK Query API.
- Use fixture-backed RTK Query endpoints until an OpsIntel service is configured.
- The existing workspace uses React 19 and Tailwind 4; keep those package versions stable while implementing the requested application behavior.
- Initial `npm run build` fails in existing Storybook/component typings before OpsIntel changes.