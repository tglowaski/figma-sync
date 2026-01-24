# Config Generation Rules

> Step-by-step workflow for generating Figma Sync configuration.

## Overview

This guide walks through the process of analyzing a project and generating a complete `project.config.json` configuration file for the Figma Sync plugin.

---

## Step 1: Detect Project Structure

### Identify Framework

```bash
# Check for Next.js App Router
glob "app/**/page.tsx"           # Found → App Router
glob "pages/**/*.tsx"            # Found → Pages Router

# Check for package.json
grep "next" package.json         # Confirm Next.js
```

### Identify Token Sources

| Priority | File Pattern | Description |
|----------|--------------|-------------|
| 1 | `app/globals.css` | App Router global styles |
| 2 | `styles/globals.css` | Pages Router global styles |
| 3 | `src/styles/globals.css` | Alternate location |
| 4 | `tailwind.config.ts` | Tailwind theme extensions |
| 5 | `tailwind.config.js` | Tailwind JS config |

### Identify Component Directory

| Priority | Pattern | Description |
|----------|---------|-------------|
| 1 | `components/ui/` | shadcn/ui standard |
| 2 | `src/components/ui/` | With src directory |
| 3 | `components/` | Generic components |
| 4 | `src/components/` | With src directory |

### Identify Pages Directory

| Router Type | Pattern |
|-------------|---------|
| App Router | `app/**/page.tsx` |
| Pages Router | `pages/**/*.tsx` |

---

## Step 2: Extract Project Metadata

### From package.json

```json
{
  "name": "my-project",           // → config.name
  "description": "Project desc"   // → config.branding.description
}
```

### From Existing Config Files

Check for existing branding in:
- `next.config.js` - Site name
- `app/layout.tsx` - Title metadata
- `public/manifest.json` - App name

---

## Step 3: Analyze Token Sources

### Parse CSS Variables

```typescript
// Look for :root block
const rootMatch = css.match(/:root\s*\{([^}]+)\}/);

// Extract variables
const varPattern = /--([\w-]+):\s*([^;]+);/g;
```

### Categorize Tokens

| Pattern | Category |
|---------|----------|
| `--background`, `--foreground`, `--primary` | Semantic colors |
| `--chart-1`, `--chart-2` | Chart colors |
| `--sidebar-*` | Sidebar colors |
| `--radius` | Border radius |

### Check for Dark Mode

```typescript
// Look for .dark block
const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
```

---

## Step 4: Analyze Components

### Scan UI Components

```typescript
// Find all UI component files
glob("components/ui/**/*.tsx")
glob("!**/*.test.tsx")
glob("!**/index.ts")
```

### Extract Variants

For each component with cva():

```typescript
// Find cva definition
const cvaMatch = content.match(/cva\s*\([\s\S]*?variants:\s*\{([\s\S]*?)\}/);

// Extract variant names and options
// variant: { default: "...", outline: "...", ghost: "..." }
```

### Build Component List

```json
{
  "components": {
    "include": ["components/ui/**/*.tsx"],
    "exclude": ["**/*.test.tsx", "**/index.ts"],
    "variantDetection": true,
    "preserveNaming": true
  }
}
```

---

## Step 5: Analyze Pages

### Scan Page Files

```typescript
// App Router
glob("app/**/page.tsx")
glob("!app/api/**")
glob("!**/loading.tsx")
glob("!**/error.tsx")
```

### Detect Page States

For each page, check for:

| State | Pattern |
|-------|---------|
| Tabs | `<TabsContent value="...">` |
| Loading | `if (loading)` returns |
| Auth | `if (!user)` returns |
| Empty | `if (items.length === 0)` |
| Wizard | `const STEPS = [...]` |

### Build Page Configurations

```json
{
  "wireframes": {
    "include": ["app/**/page.tsx"],
    "exclude": ["app/api/**"],
    "stateDetection": {
      "tabs": true,
      "loading": true,
      "auth": true,
      "empty": true
    }
  }
}
```

---

## Step 6: Generate Configuration

### Template

```json
{
  "name": "{detected_name}",
  "description": "{detected_description}",

  "sources": {
    "tokens": "{token_file_path}",
    "tailwind": "{tailwind_config_path}",
    "components": "{component_directory}",
    "pages": "{pages_directory}"
  },

  "variables": {
    "colorMode": ["light", "dark"],
    "prefix": "{project_name}",
    "collections": {
      "colors": true,
      "spacing": true,
      "radius": true,
      "typography": true,
      "components": true
    }
  },

  "components": {
    "include": ["{component_pattern}"],
    "exclude": ["**/*.test.tsx", "**/index.ts"],
    "variantDetection": true,
    "preserveNaming": true
  },

  "wireframes": {
    "include": ["{page_pattern}"],
    "exclude": ["{exclude_patterns}"],
    "frameWidth": 1440,
    "frameHeight": 900,
    "includeNavigation": true,
    "stateDetection": {
      "tabs": "{detected_tabs}",
      "loading": "{detected_loading}",
      "auth": "{detected_auth}",
      "empty": "{detected_empty}",
      "error": false
    },
    "namingPattern": "{category} / {page} / {state}"
  }
}
```

---

## Step 7: Validation Checklist

After generating configuration, validate:

### Required Fields
- [ ] `name` - Non-empty string
- [ ] `prefix` - Non-empty string, valid identifier
- [ ] `branding.logoText` - Non-empty string

### Optional but Recommended
- [ ] `navItems` - At least one navigation item
- [ ] `pages` - At least one page configuration

### Value Constraints
- [ ] `frameWidth` - Between 320 and 4096
- [ ] `frameHeight` - Between 320 and 4096
- [ ] `spacing` - Positive number
- [ ] `columns` - Positive integer

---

## Common Patterns

### Next.js App Router (shadcn/ui)

```json
{
  "name": "MyApp",
  "sources": {
    "tokens": "app/globals.css",
    "tailwind": "tailwind.config.ts",
    "components": "components/",
    "pages": "app/"
  },
  "components": {
    "include": ["components/ui/**/*.tsx"]
  },
  "wireframes": {
    "include": ["app/**/page.tsx"],
    "exclude": ["app/api/**"]
  }
}
```

### Next.js Pages Router

```json
{
  "name": "MyApp",
  "sources": {
    "tokens": "styles/globals.css",
    "tailwind": "tailwind.config.js",
    "components": "components/",
    "pages": "pages/"
  },
  "wireframes": {
    "include": ["pages/**/*.tsx"],
    "exclude": ["pages/api/**", "pages/_*.tsx"]
  }
}
```

### With src Directory

```json
{
  "sources": {
    "tokens": "src/styles/globals.css",
    "components": "src/components/",
    "pages": "src/app/"
  }
}
```

---

## Example Generated Config

For DealApp (real estate investment platform):

```json
{
  "name": "DealApp",
  "description": "Real Estate Investment Analytics Platform",

  "sources": {
    "tokens": "app/globals.css",
    "tailwind": "tailwind.config.ts",
    "components": "components/",
    "pages": "app/"
  },

  "variables": {
    "colorMode": ["light", "dark"],
    "prefix": "DealApp",
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
    },
    "namingPattern": "{category} / {page} / {state}"
  },

  "branding": {
    "logoText": "DealApp",
    "tagline": "Real Estate Investment Analytics"
  },

  "navItems": [
    { "label": "Dashboard", "path": "/dashboard" },
    { "label": "Waterfall", "path": "/waterfall" },
    { "label": "Projects", "path": "/projects" },
    { "label": "Settings", "path": "/settings" }
  ]
}
```
