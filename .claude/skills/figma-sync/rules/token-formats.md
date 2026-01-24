# Token Formats

> Supported design token formats and conversion details.

## Overview

Figma Sync supports multiple token source formats. This document covers how each format is parsed and converted for Figma.

---

## CSS Custom Properties (Primary)

The primary and recommended format for design tokens.

### Standard Format

```css
:root {
  /* Colors */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);

  /* Spacing (via Tailwind) */
  /* --spacing-* variables if defined */

  /* Border radius */
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
}
```

### Parsing Logic

```typescript
// Extract :root block
const rootMatch = css.match(/:root\s*\{([^}]+)\}/);

// Extract .dark block
const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);

// Parse variables
const varPattern = /--([\w-]+):\s*([^;]+);/g;
```

### Requirements

- Must use `:root` selector (not `html` or `body`)
- Dark mode must use `.dark` selector
- Variables must follow `--name: value;` syntax
- Values must be valid CSS color/size values

---

## Color Formats

### oklch (Recommended)

OKLCH is the modern, perceptually uniform color space. Best for design systems.

```css
--primary: oklch(0.7 0.2 240);           /* L C H */
--primary: oklch(0.7 0.2 240 / 50%);     /* with alpha */
--primary: oklch(70% 0.2 240);           /* L as percentage */
```

**Components:**
- L (Lightness): 0-1 or 0%-100%
- C (Chroma): 0-0.4 typically
- H (Hue): 0-360 degrees

**Conversion to RGB:**
```typescript
function oklchToRgb(l: number, c: number, h: number): RGB {
  // Convert OKLCH → OKLab → Linear sRGB → sRGB
  // Implementation uses standard color space transforms
}
```

### hsl

HSL is widely supported and human-readable.

```css
--primary: hsl(220, 100%, 50%);          /* comma-separated */
--primary: hsl(220 100% 50%);            /* space-separated */
--primary: hsl(220 100% 50% / 50%);      /* with alpha */
--primary: hsla(220, 100%, 50%, 0.5);    /* legacy alpha */
```

**Components:**
- H (Hue): 0-360 degrees
- S (Saturation): 0%-100%
- L (Lightness): 0%-100%

**Conversion to RGB:**
```typescript
function hslToRgb(h: number, s: number, l: number): RGB {
  // Standard HSL to RGB conversion
  s = s / 100;
  l = l / 100;
  // ... conversion algorithm
}
```

### rgb

Direct RGB values.

```css
--primary: rgb(255, 100, 50);            /* comma-separated */
--primary: rgb(255 100 50);              /* space-separated */
--primary: rgb(255 100 50 / 50%);        /* with alpha */
--primary: rgba(255, 100, 50, 0.5);      /* legacy alpha */
```

**Components:**
- R, G, B: 0-255 (converted to 0-1 for Figma)

**Conversion:**
```typescript
function rgbToFigma(r: number, g: number, b: number): RGB {
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255
  };
}
```

### hex

Hexadecimal color notation.

```css
--primary: #FF6432;                      /* 6-digit */
--primary: #F64;                         /* 3-digit shorthand */
--primary: #FF643280;                    /* 8-digit with alpha */
--primary: #F648;                        /* 4-digit with alpha */
```

**Conversion:**
```typescript
function hexToRgb(hex: string): RGB {
  // Expand shorthand if needed
  // Parse hex pairs to 0-255
  // Convert to 0-1 for Figma
}
```

---

## Tailwind Config Format

Tokens can also be extracted from Tailwind configuration.

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // Custom colors
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ...
          900: '#0c4a6e',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
    },
  },
} satisfies Config;
```

### Parsing Logic

```typescript
// Read tailwind.config.ts
const config = await import('./tailwind.config.ts');

// Extract theme extensions
const { colors, spacing, borderRadius, fontSize } = config.theme?.extend || {};

// Process each category
for (const [name, value] of Object.entries(colors || {})) {
  if (typeof value === 'string') {
    // Direct color value
  } else if (typeof value === 'object') {
    // Color scale (50, 100, ..., 900)
  }
}
```

### CSS Variable References

Many Tailwind configs reference CSS variables:

```typescript
colors: {
  primary: 'hsl(var(--primary))',
}
```

In this case, resolve the CSS variable from globals.css.

---

## Design Tokens JSON (Tokens Studio)

For projects using Tokens Studio or similar tools.

### Format

```json
{
  "colors": {
    "primary": {
      "value": "#3b82f6",
      "type": "color"
    },
    "secondary": {
      "value": "{colors.gray.500}",
      "type": "color"
    }
  },
  "spacing": {
    "xs": {
      "value": "4px",
      "type": "spacing"
    },
    "sm": {
      "value": "8px",
      "type": "spacing"
    }
  },
  "borderRadius": {
    "sm": {
      "value": "4px",
      "type": "borderRadius"
    }
  }
}
```

### Parsing

```typescript
interface TokenValue {
  value: string;
  type: string;
  description?: string;
}

function parseTokensJson(json: Record<string, any>): ParsedTokens {
  // Recursively walk token tree
  // Resolve references like {colors.gray.500}
  // Convert values to appropriate types
}
```

### Reference Resolution

```typescript
function resolveReference(ref: string, tokens: object): string {
  // Parse {category.name} format
  const path = ref.slice(1, -1).split('.');
  let value = tokens;
  for (const key of path) {
    value = value[key];
  }
  return value.value;
}
```

---

## CSS-in-JS Patterns

### styled-components Theme

```typescript
const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    foreground: '#0f172a',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
};
```

### Emotion Theme

```typescript
const theme = {
  colors: {
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
  },
};
```

### Parsing

```typescript
// Look for theme object export
const themeMatch = content.match(/(?:const|export)\s+theme\s*=\s*(\{[\s\S]*?\});/);

if (themeMatch) {
  // Parse JavaScript object literal
  // Handle nested structures
}
```

---

## Size Value Conversion

### rem to px

```typescript
function remToPx(rem: string): number {
  const value = parseFloat(rem);
  return value * 16; // Assuming 16px base
}

// "0.625rem" → 10
// "1.5rem" → 24
```

### em to px

```typescript
function emToPx(em: string, context: number = 16): number {
  const value = parseFloat(em);
  return value * context;
}
```

### Percentage

Percentages are context-dependent. For border-radius `100%` means circular.

### calc() Expressions

```typescript
function parseCalc(calc: string, baseRadius: number = 10): number {
  // Match calc(var(--radius) - 4px)
  const match = calc.match(/calc\(var\(--radius\)\s*([+-])\s*(\d+)px\)/);
  if (match) {
    const op = match[1];
    const offset = parseInt(match[2]);
    return op === '+' ? baseRadius + offset : baseRadius - offset;
  }
  return baseRadius;
}
```

---

## Output Format (Figma)

### Color (RGB 0-1)

Figma expects RGB values in 0-1 range:

```typescript
interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

// Example: Pure red
const red: RGB = { r: 1, g: 0, b: 0 };

// Example: #3b82f6
const blue: RGB = { r: 0.231, g: 0.51, b: 0.965 };
```

### Spacing (pixels)

Figma uses pixels for all dimensions:

```typescript
// 1rem = 16px
// 0.5rem = 8px
// 24px = 24px
```

### Typography

```typescript
interface Typography {
  fontSize: number;    // pixels
  lineHeight: number;  // pixels
  fontFamily: string;  // font name
  fontWeight: number;  // 100-900
}
```

---

## Validation

### Color Value Validation

```typescript
function isValidColor(value: string): boolean {
  // Check for supported formats
  return (
    /^oklch\(/.test(value) ||
    /^hsl[a]?\(/.test(value) ||
    /^rgb[a]?\(/.test(value) ||
    /^#[0-9a-fA-F]{3,8}$/.test(value)
  );
}
```

### Size Value Validation

```typescript
function isValidSize(value: string): boolean {
  return (
    /^\d+(\.\d+)?(px|rem|em|%)$/.test(value) ||
    /^calc\(/.test(value)
  );
}
```

---

## Migration Guides

### From HSL to OKLCH

OKLCH provides better perceptual uniformity:

```css
/* Before (HSL) */
--primary: hsl(217, 91%, 60%);

/* After (OKLCH) */
--primary: oklch(0.623 0.214 259.1);
```

Use a color converter tool to get equivalent values.

### From Hex to CSS Variables

```css
/* Before */
.button {
  background: #3b82f6;
  color: #ffffff;
}

/* After */
:root {
  --primary: #3b82f6;
  --primary-foreground: #ffffff;
}

.button {
  background: var(--primary);
  color: var(--primary-foreground);
}
```

### From Tokens Studio to CSS Variables

```json
// tokens.json
{
  "colors": {
    "primary": { "value": "#3b82f6" }
  }
}
```

```css
/* globals.css */
:root {
  --primary: #3b82f6;
}
```
