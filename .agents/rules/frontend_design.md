---
trigger: model_decision
description: Enforce design intelligence skills (ui-ux-pro-max, design-taste-frontend, impeccable, awesome-design-md, web-design-guidelines) on all web and frontend development tasks.
---

# Frontend Design & Development Rules

Whenever you design, create, update, or refactor any frontend page, website, component, stylesheet, or app UI:

1. **Activate Design Intelligence**:
   - Query `ui-ux-pro-max` search script for industry-specific palette, font pairing, and UI style.
   - Query `design-taste-frontend` for layout blueprints, preventing generic AI templates and slop.
   - Consult `awesome-design-md` whenever referencing modern brand benchmarks (Stripe, Linear, Apple, Vercel, Supabase, etc.).

2. **Follow Impeccable Craft Floor**:
   - Determine surface mode: `Persuade`, `Operate`, `Read`, or `Experience`.
   - Never use placeholder emojis for icons; use clean SVGs (Lucide/Heroicons).
   - Ensure WCAG AA contrast (minimum 4.5:1 for body text).
   - Explicit `:focus-visible` rings on all interactive elements.
   - Full responsiveness across 375px, 768px, and 1280px+ viewports.
   - Graceful states: loading, empty state, and error feedback.

3. **Verify with Web Guidelines & Playwright**:
   - Audit code against `web-design-guidelines`.
   - Use `playwright` MCP tools or browser agent to inspect visual fidelity.
