# Web & Frontend Development Rules

Whenever designing, building, or modifying websites, landing pages, dashboards, UI components, or frontend applications in this workspace, the agent **MUST ALWAYS** integrate and adhere to the installed design skills and workflows:

---

## 1. Mandatory Skills Workflow

Every website/frontend task must follow this pipeline:

### Step 1: Research & Art Direction (`ui-ux-pro-max` + `design-taste-frontend`)
- **No Generic AI Slop**: Strictly avoid default templates (e.g., standard centered 3-line headline with an eyebrow tag, generic 3-card icon grid, uniform gray borders, and purple-to-pink gradient accents).
- **Run Design System Search**:
  Use `python .agents/skills/ui-ux-pro-max/scripts/search.py "<industry/product>" --design-system` to extract tailored:
  - 1-of-79 UI visual style recommendations (e.g., Swiss Style, Bento Grid, Neumorphism, Flat Minimal, Cyberpunk, etc.)
  - 1-of-192 Industry-tailored color palettes (primary, secondary, accent, surfaces, text contrast >= 4.5:1)
  - Curated Google Fonts typography pairings
- **Art Direction & Blueprint**:
  Reference `design-taste-frontend` (`scripts/draw.mjs`) to select deliberate layout compositions, hero structures, and high-fidelity content concepts.

### Step 2: Brand & Design System Benchmark (`awesome-design-md`)
- If the user specifies or asks to benchmark against industry standards (e.g., Stripe, Linear, Apple, Vercel, Supabase, Notion, Framer, Resend, Raycast):
  - Consult the corresponding specification in `.agents/skills/awesome-design-md/design-md/<brand>/DESIGN.md`.
  - Reuse official semantic tokens, typographic hierarchy, elevation, and component specs.

### Step 3: Implementation Quality & Craft Floor (`impeccable`)
- **Identify Surface Mode**:
  - `Persuade` (Landing pages, marketing, pricing): Bold point of view, high visual impact, compelling CTAs.
  - `Operate` (Dashboards, tools, settings, portals): Scanability, density, consistent controls, crisp feedback, keyboard focus.
  - `Read` (Docs, blogs, changelogs): Reading rhythm, typography legibility, table/code presentation.
  - `Experience` (Portfolios, showcases, galleries): Interface recedes, artifacts and motion lead.
- **Enforce Craft Floor**:
  - `cursor-pointer` on all interactive elements.
  - Clear, visible `:focus-visible` states for keyboard accessibility.
  - Responsive reflow tested across mobile (375px), tablet (768px), and desktop (1024px+).
  - Respect `prefers-reduced-motion`.
  - No emojis as substitute for icons; use SVGs (Lucide, Heroicons).
  - Handle loading, empty, and error edge states.

### Step 4: Verification & Audit (`web-design-guidelines` + `playwright`)
- Audit UI code against Web Interface Guidelines (`web-design-guidelines`).
- Use the `playwright` MCP server or browser tools to inspect live rendering, verify contrast, layout shifts, and visual appeal before finalizing.

---

## 2. Quick Command Reference

| Action | Command / Tool |
|---|---|
| Search Design System / Palettes | `python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system` |
| Search Brand Tokens (Stripe, Linear, etc.) | `node .agents/skills/awesome-design-md/scripts/search.js "<brand>"` |
| Anti-Slop Direction & Blueprint | `node .agents/skills/design-taste-frontend/scripts/draw.mjs --sector <sector>` |
| UX Critique & Heuristics | Reference `.agents/skills/impeccable/reference/critique.md` |
| UI Polish & Craft Check | Reference `.agents/skills/impeccable/reference/craft-floor.md` |
| Web Interface Guidelines Audit | Reference `.agents/skills/web-design-guidelines/SKILL.md` |
