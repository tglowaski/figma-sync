# Token Detection Rules

> How to find and parse design tokens from project source files.

## Token Sources

### Primary: CSS Custom Properties

Location priority:
1. `app/globals.css` (App Router)
2. `styles/globals.css` (Pages Router)
3. `src/styles/globals.css` (With src)

### Secondary: Tailwind Config

Location priority:
1. `tailwind.config.ts`
2. `tailwind.config.js`

---

## CSS Variable Parsing

### Light Mode Tokens

Extract from `:root` selector:

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... */
}
```

### Dark Mode Tokens

Extract from `.dark` selector:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  /* ... */
}
```

### Parsing Logic

```typescript
// Match :root block
const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);

// Match .dark block
const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);

// Extract variables from block
const varPattern = /--([\w-]+):\s*([^;]+);/g;
let match;
while ((match = varPattern.exec(block)) !== null) {
  const name = match[1];   // e.g., "primary"
  const value = match[2];  // e.g., "oklch(0.205 0 0)"
}
```

---

## Color Format Support

### oklch (Recommended)

Modern perceptually uniform color space:

```css
--primary: oklch(0.205 0 0);
--primary: oklch(0.7 0.2 240);      /* with hue */
--primary: oklch(0.7 0.2 240 / 50%); /* with alpha */
```

Parsing:
```typescript
const oklchMatch = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\)/);
if (oklchMatch) {
  const [, l, c, h, a] = oklchMatch;
  // Convert to RGB for Figma
}
```

### hsl

Hue, saturation, lightness:

```css
--primary: hsl(220, 100%, 50%);
--primary: hsl(220 100% 50%);        /* space-separated */
--primary: hsl(220 100% 50% / 50%);  /* with alpha */
```

### rgb

Red, green, blue (0-255):

```css
--primary: rgb(255, 100, 50);
--primary: rgb(255 100 50);          /* space-separated */
--primary: rgb(255 100 50 / 50%);    /* with alpha */
```

### hex

Hexadecimal:

```css
--primary: #FF6432;    /* 6-digit */
--primary: #F64;       /* 3-digit shorthand */
--primary: #FF643280;  /* 8-digit with alpha */
```

---

## Semantic Color Mapping

### Standard shadcn/ui Colors

| Token | Description | Light | Dark |
|-------|-------------|-------|------|
| `--background` | Main background | Light | Dark |
| `--foreground` | Main text | Dark | Light |
| `--card` | Card background | Light | Slightly lighter |
| `--card-foreground` | Card text | Dark | Light |
| `--popover` | Popover background | Light | Dark |
| `--popover-foreground` | Popover text | Dark | Light |
| `--primary` | Primary actions | Brand color | Adjusted |
| `--primary-foreground` | Text on primary | Contrast | Contrast |
| `--secondary` | Secondary actions | Muted | Adjusted |
| `--secondary-foreground` | Text on secondary | Dark | Light |
| `--muted` | Muted backgrounds | Light gray | Dark gray |
| `--muted-foreground` | Muted text | Gray | Light gray |
| `--accent` | Hover states | Light | Dark |
| `--accent-foreground` | Accent text | Dark | Light |
| `--destructive` | Error/delete | Red | Adjusted red |
| `--border` | Borders | Light gray | Dark with alpha |
| `--input` | Input borders | Light gray | Dark with alpha |
| `--ring` | Focus rings | Gray | Gray |

### Chart Colors

```css
--chart-1: oklch(0.646 0.222 41.116);   /* Orange */
--chart-2: oklch(0.6 0.118 184.704);    /* Teal */
--chart-3: oklch(0.398 0.07 227.392);   /* Blue */
--chart-4: oklch(0.828 0.189 84.429);   /* Yellow */
--chart-5: oklch(0.769 0.188 70.08);    /* Gold */
```

### Sidebar Colors

```css
--sidebar: oklch(0.985 0 0);
--sidebar-foreground: oklch(0.145 0 0);
--sidebar-primary: oklch(0.205 0 0);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.97 0 0);
--sidebar-accent-foreground: oklch(0.205 0 0);
--sidebar-border: oklch(0.922 0 0);
--sidebar-ring: oklch(0.708 0 0);
```

---

## Spacing Extraction

### From Tailwind Config

```typescript
// tailwind.config.ts
theme: {
  extend: {
    spacing: {
      '18': '4.5rem',
      '22': '5.5rem',
    }
  }
}
```

### Default Scale (if not overridden)

```json
{
  "0": 0, "0.5": 2, "1": 4, "1.5": 6, "2": 8, "2.5": 10,
  "3": 12, "3.5": 14, "4": 16, "5": 20, "6": 24, "7": 28,
  "8": 32, "9": 36, "10": 40, "12": 48, "14": 56, "16": 64,
  "20": 80, "24": 96
}
```

---

## Border Radius Extraction

### From CSS Variables

```css
:root {
  --radius: 0.625rem;  /* Base radius = 10px */
}
```

### Calculated Values

Many projects use calc() for radius variants:

```css
/* In component styles */
border-radius: calc(var(--radius) - 2px);   /* sm = 8px */
border-radius: calc(var(--radius) - 4px);   /* xs = 6px */
border-radius: var(--radius);               /* base = 10px */
border-radius: calc(var(--radius) + 4px);   /* lg = 14px */
```

### Default Scale

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

---

## Typography Extraction

### From Tailwind Config

```typescript
theme: {
  extend: {
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      // ...
    }
  }
}
```

### Default Scale

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

---

## Troubleshooting

### Tokens Not Detected

1. **Check selector format**
   - Must be `:root { }` not `html { }` or `body { }`
   - Dark mode must be `.dark { }` not `[data-theme="dark"]`

2. **Check variable syntax**
   - Must include `--` prefix
   - Must end with semicolon
   - No spaces in variable name

3. **Check color format**
   - Ensure format is supported (oklch, hsl, rgb, hex)
   - Check for valid values (no typos)

### Colors Look Wrong

1. **Check color space conversion**
   - oklch to RGB conversion may have slight differences
   - Verify source values are correct

2. **Check alpha handling**
   - Alpha values should be between 0-1 or 0%-100%
   - Figma uses 0-1 for alpha

### Missing Dark Mode

1. **Check for .dark selector**
   - Must be exactly `.dark`
   - Not nested inside media query

2. **Check variable override**
   - Dark mode should redefine same variables
   - Names must match exactly
