# Figma Sync Skill

> Configuration generation and reference documentation for the Figma Sync plugin.

## Overview

Figma Sync is a Figma plugin framework that automatically imports Next.js/React codebases into Figma with design tokens, components, and wireframes. This skill helps you:

- **Generate** `project.config.json` by analyzing your codebase
- **Understand** the configuration schema and options
- **Create** custom section renderers for wireframes
- **Troubleshoot** token parsing and component detection issues

### When to Use This Skill

- Generating initial plugin configuration for a new project
- Adding new pages or sections to wireframe generation
- Creating custom section renderers for domain-specific UI
- Understanding token extraction and color format conversion
- Debugging why certain tokens, components, or pages aren't being detected

---

## Quick Start

### 1. Analyze Your Project

```
Project structure to analyze:
- app/globals.css (or tailwind.config.ts) → Design tokens
- components/ui/**/*.tsx → Component variants
- app/**/page.tsx → Page wireframes
```

### 2. Generate Configuration

Create `project.config.json` in the plugin root:

```json
{
  "name": "MyApp",
  "description": "Brief description of your app",

  "sources": {
    "tokens": "app/globals.css",
    "tailwind": "tailwind.config.ts",
    "components": "components/",
    "pages": "app/"
  },

  "variables": {
    "colorMode": ["light", "dark"],
    "prefix": "MyApp",
    "collections": {
      "colors": true,
      "spacing": true,
      "radius": true,
      "typography": true,
      "components": true
    }
  },

  "components": {
    "include": ["components/ui/**/*.tsx"],
    "exclude": ["**/*.test.tsx", "**/index.ts"],
    "variantDetection": true,
    "preserveNaming": true
  },

  "wireframes": {
    "include": ["app/**/page.tsx"],
    "exclude": ["app/api/**", "app/**/loading.tsx", "app/**/error.tsx"],
    "frameWidth": 1440,
    "frameHeight": 900,
    "includeNavigation": true,
    "stateDetection": {
      "tabs": true,
      "loading": true,
      "auth": true,
      "empty": true,
      "error": false
    }
  }
}
```

### 3. Embed Configuration in Plugin

Update `src/main.ts` with your project-specific config:

```typescript
const USER_CONFIG: Partial<PluginConfig> = {
  name: 'MyApp',
  prefix: 'MyApp',
  branding: {
    logoText: 'MyApp',
    tagline: 'Your app description',
  },
  navItems: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Settings', path: '/settings' }
  ]
};
```

---

## Configuration Schema Reference

### Core Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Project name (used in UI and documentation) |
| `prefix` | string | Yes | Variable prefix for Figma collections |
| `frameWidth` | number | No | Wireframe width (default: 1440) |
| `frameHeight` | number | No | Wireframe height (default: 900) |
| `spacing` | number | No | Grid spacing between frames (default: 100) |
| `columns` | number | No | Grid columns (default: 3) |

### Branding Configuration

```typescript
interface BrandingConfig {
  logoText: string;      // Text displayed next to logo icon
  tagline?: string;      // Optional tagline for marketing pages
  description?: string;  // Optional description for metadata
}
```

### Navigation Items

```typescript
interface NavItem {
  label: string;   // Display label
  path?: string;   // Optional route path
}
```

### Page Configuration

```typescript
interface PageConfig {
  name: string;                    // Display name (e.g., "Auth / Login")
  type: PageType;                  // Page type determines generation logic
  state?: string | null;           // Optional state variant
  contentSections?: ContentSection[]; // Sections to render
  hasNavigation?: boolean;         // Show nav bar (default: true)
}

type PageType =
  | 'auth'          // Centered auth forms (login, signup)
  | 'dashboard'     // Metrics + tables + charts
  | 'loading'       // Centered spinner
  | 'auth-prompt'   // Sign in required state
  | 'org-prompt'    // Organization selection state
  | 'empty'         // Empty state with CTA
  | 'config'        // Configuration/settings page
  | 'wizard'        // Multi-step wizard
  | 'settings'      // Settings page
  | 'profile'       // User profile page
  | 'generic';      // Generic page layout
```

### Content Sections

```typescript
interface ContentSection {
  type: string;                        // Section renderer type
  title?: string;                      // Optional title override
  subtitle?: string;                   // Optional subtitle
  properties?: Record<string, unknown>; // Section-specific config
}
```

---

## Detection Patterns

### Token Detection

CSS tokens are extracted from `:root` and `.dark` blocks:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  /* ... */
}
```

Supported color formats:
- **oklch**: `oklch(0.7 0.2 240)` - Modern perceptually uniform
- **hsl**: `hsl(220, 100%, 50%)` - Hue, saturation, lightness
- **rgb**: `rgb(255, 100, 50)` - Red, green, blue
- **hex**: `#FF6432` or `#F64` - Hexadecimal

### Component Detection

Components are detected from `components/ui/` files:

**Include criteria:**
- Located in `components/ui/`
- Has named export
- Uses `cva()` or className variants
- File < 500 lines
- No global state hooks

**Exclude criteria:**
- Test files (`.test.`, `.spec.`)
- Index files (`index.ts`, `index.tsx`)
- Uses `useAuth`, `useOrganization`, `useSession`

### Page Detection

Pages are detected from App Router structure:

**Include criteria:**
- Matches `app/**/page.tsx`

**Exclude criteria:**
- API routes (`app/api/**`)
- Loading files (`loading.tsx`)
- Error files (`error.tsx`)

### State Detection

States are automatically detected from page content:

| State | Detection Pattern |
|-------|------------------|
| Tabs | `<TabsContent value="...">` |
| Loading | `if (loading)` or `authLoading` |
| Auth | `if (!user)` or `if (!session)` |
| Empty | `if (items.length === 0)` |
| Error | `if (error)` or `<PageErrorState>` |
| Wizard | `const STEPS = [...]` |

---

## Default Configurations

### Standard Spacing Scale

```json
{
  "0": 0, "0.5": 2, "1": 4, "1.5": 6, "2": 8, "2.5": 10,
  "3": 12, "3.5": 14, "4": 16, "5": 20, "6": 24, "7": 28,
  "8": 32, "9": 36, "10": 40, "12": 48, "14": 56, "16": 64,
  "20": 80, "24": 96
}
```

### Standard Border Radius

```json
{
  "none": 0,
  "sm": 6,
  "md": 8,
  "base": 10,
  "lg": 10,
  "xl": 14,
  "2xl": 16,
  "full": 9999
}
```

### Standard Font Sizes

```json
{
  "xs": { "size": 12, "lineHeight": 16 },
  "sm": { "size": 14, "lineHeight": 20 },
  "base": { "size": 16, "lineHeight": 24 },
  "lg": { "size": 18, "lineHeight": 28 },
  "xl": { "size": 20, "lineHeight": 28 },
  "2xl": { "size": 24, "lineHeight": 32 },
  "3xl": { "size": 30, "lineHeight": 36 },
  "4xl": { "size": 36, "lineHeight": 40 }
}
```

### Standard Component Sizes

```json
{
  "buttonSm": 32,
  "buttonDefault": 36,
  "buttonLg": 40,
  "buttonIcon": 36,
  "inputHeight": 36,
  "avatarSm": 32,
  "avatarDefault": 40,
  "avatarLg": 64,
  "avatarXl": 80,
  "navHeight": 64,
  "badgeHeight": 20,
  "tabsHeight": 40
}
```

---

## Available Section Renderers

See `rules/section-renderers.md` for the complete list and usage examples.

### Core Sections

| Type | Description |
|------|-------------|
| `header` | Page title + subtitle |
| `header-with-action` | Header with action button |
| `back-header` | Header with back navigation |
| `tabs` | Tab list component |
| `table` | Generic data table |
| `form-card` | Card with form fields |
| `metrics` | Row of metric cards |
| `button-row` | Action buttons |

### State Sections

| Type | Description |
|------|-------------|
| `loading-spinner` | Centered loading state |
| `empty-state` | Empty state with CTA |
| `auth-prompt` | Sign in required prompt |
| `org-prompt` | Organization selection prompt |

### Wizard Sections

| Type | Description |
|------|-------------|
| `wizard-progress` | Step progress indicator |
| `wizard-navigation` | Back/Skip/Continue buttons |
| `preview-summary` | Preview summary card |

---

## Troubleshooting

### Tokens Not Detected

1. Ensure CSS file uses `:root` selector
2. Check color format is supported (oklch, hsl, rgb, hex)
3. Verify CSS custom property syntax (`--name: value;`)
4. Check for parsing errors in Figma console

### Components Not Detected

1. Verify file is in `components/ui/` directory
2. Check for named export
3. Ensure file < 500 lines
4. Check for global state hook usage

### Pages Not Detected

1. Verify file matches `app/**/page.tsx` pattern
2. Check if excluded by API route or loading/error patterns
3. Ensure page has expected structure

### States Not Detected

1. Check for exact pattern match in code
2. Verify conditional return structure
3. Check TabsContent value attribute format

---

## Related Rules

- `rules/config-generation.md` - Step-by-step config generation
- `rules/token-detection.md` - Token parsing details
- `rules/component-detection.md` - Component parsing details
- `rules/page-detection.md` - Page and state detection
- `rules/section-renderers.md` - Available section renderers
- `rules/token-formats.md` - Supported token formats
