# Figma Sync Agents

> Integration guide for agents that work with the Figma Sync skill.

## Available Agents

### `figma-design-system`

A specialized agent for Figma Sync plugin configuration, design token management, wireframe customization, and design system tasks.

**Location:** `.claude/agents/figma-design-system.md`

**When to Use:**
- Generating `project.config.json` for a new project
- Creating custom section renderers
- Debugging token extraction issues
- Adding new wireframe pages or states
- Syncing design tokens between code and Figma

**Capabilities:**
- Analyzes project structure (Next.js App Router or Pages Router)
- Detects tokens from CSS variables or Tailwind config
- Identifies component variants from cva() definitions
- Maps pages to wireframe configurations
- Validates configuration against schema

---

## Agent Workflow

The `figma-design-system` agent follows this primary workflow:

```
1. Analyze project structure
   ├── Detect framework (Next.js App Router / Pages Router)
   ├── Find token sources (globals.css, tailwind.config.ts)
   ├── Locate component directories
   └── Identify page patterns

2. Detect tokens, components, pages
   ├── Parse CSS variables for colors, spacing, radius
   ├── Extract cva() variants from UI components
   └── Map app/**/page.tsx to wireframe configs

3. Generate/update configuration
   ├── Create project.config.json
   └── Update src/main.ts USER_CONFIG

4. Validate against schema
   └── Ensure required fields present and valid

5. Suggest optimizations
   └── Recommend missing sections or patterns
```

---

## Invoking the Agent

### Via Task Tool

```javascript
// In Claude Code conversation
Task({
  subagent_type: "figma-design-system",
  prompt: "Generate a Figma Sync config for this Next.js project",
  description: "Generate figma config"
})
```

### Via Agent Definition

The agent is defined in `.claude/agents/figma-design-system.md` with:

```yaml
---
name: figma-design-system
description: Use this agent for Figma Sync plugin configuration...
model: sonnet
color: purple
---
```

---

## Tool Usage

The `figma-design-system` agent has access to:

### Figma MCP Tools
- `mcp__figma-desktop__get_design_context` - Get Figma design context
- `mcp__figma-desktop__get_variable_defs` - Get Figma variables
- `mcp__figma-desktop__get_screenshot` - Capture Figma screenshots
- `mcp__figma-desktop__get_metadata` - Get Figma node metadata

### Codebase Analysis Tools
- `Glob` - Find files by pattern
- `Grep` - Search code content
- `Read` - Read file contents

### Reference Tools
- References `figma-sync` skill for configuration knowledge

---

## Example Usage

### Generate Config for New Project

```
User: Generate a Figma Sync config for my project

Agent workflow:
1. Glob("**/globals.css") → Find token source
2. Glob("components/ui/**/*.tsx") → Find UI components
3. Glob("app/**/page.tsx") → Find pages
4. Read files to extract tokens and variants
5. Generate project.config.json
6. Output validation checklist
```

### Add Custom Section Renderer

```
User: Create a custom section renderer for a Kanban board

Agent workflow:
1. Read src/generators/section-renderers.ts → Understand registry
2. Analyze existing renderers for patterns
3. Generate new registerRenderer() call
4. Add to page configuration example
5. Document in rules/section-renderers.md
```

### Debug Token Detection

```
User: My colors aren't being imported correctly

Agent workflow:
1. Read app/globals.css → Check token format
2. Verify :root and .dark sections exist
3. Check color format (oklch, hsl, rgb, hex)
4. Test with parseCssColor() logic
5. Suggest fixes for malformed tokens
```

---

## Agent Output Standards

When the agent generates output, it follows these standards:

### Configuration Output
- Always output valid JSON
- Include all required fields
- Use consistent naming conventions
- Preserve existing project naming patterns

### Validation Checklist
After generating config, agent provides:

```
Configuration Validation:
✓ name - Project name defined
✓ prefix - Variable prefix defined
✓ branding.logoText - Logo text defined
✓ navItems - Navigation items configured
✓ pages - Page configurations present
```

### File References
When suggesting changes, include specific file paths and line numbers:

```
Update src/main.ts:22
  - Old: name: 'MyApp'
  + New: name: 'DealApp'
```

---

## Critical Rules

The agent follows these critical rules:

1. **Never guess token values** - Always extract from actual source files
2. **Validate configs before suggesting** - Use schema validation
3. **Preserve existing naming conventions** - Match project patterns
4. **Support both router types** - App Router and Pages Router
5. **Reference specific files** - Always include file paths

---

## Related Files

- `.claude/agents/figma-design-system.md` - Agent definition
- `src/config/schema.ts` - Configuration schema
- `src/parsers/token-parser.ts` - Token parsing logic
- `src/parsers/component-parser.ts` - Component detection
- `src/parsers/page-parser.ts` - Page detection
- `src/generators/section-renderers.ts` - Section renderer registry
