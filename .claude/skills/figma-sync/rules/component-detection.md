# Component Detection Rules

> How to detect and parse UI components for Figma generation.

## Component Locations

### Standard Patterns

| Priority | Pattern | Description |
|----------|---------|-------------|
| 1 | `components/ui/*.tsx` | shadcn/ui standard |
| 2 | `components/ui/**/*.tsx` | Nested UI components |
| 3 | `src/components/ui/*.tsx` | With src directory |

### Include Criteria

Components are included if they:
- Located in `components/ui/` directory
- Have a named export (function or const)
- Use `cva()` or className variants (optional)
- File is < 500 lines
- No direct data fetching (no `useEffect` with API calls)

### Exclude Criteria

Components are excluded if they:
- Are test files (`.test.tsx`, `.spec.tsx`)
- Are index files (`index.ts`, `index.tsx`)
- Use global state hooks (`useAuth`, `useOrganization`, `useSession`)
- Have page-level layout logic
- Are > 500 lines

---

## Variant Detection

### cva() Pattern

Class Variance Authority is the standard for shadcn/ui:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Extraction Logic

```typescript
// Find cva definition
const cvaMatch = content.match(/cva\s*\([\s\S]*?variants:\s*\{([\s\S]*?)\}\s*(?:,|\})/);

if (cvaMatch) {
  const variantsBlock = cvaMatch[1];

  // Extract each variant category
  const variantPattern = /(\w+):\s*\{([^}]+)\}/g;
  let match;
  while ((match = variantPattern.exec(variantsBlock)) !== null) {
    const variantName = match[1];  // e.g., "variant" or "size"
    const variantOptions = match[2];

    // Extract option names
    const optionPattern = /(\w+):/g;
    // Options: ["default", "destructive", "outline", ...]
  }
}
```

### Default Variants

```typescript
// Find defaultVariants block
const defaultMatch = content.match(/defaultVariants:\s*\{([^}]+)\}/);

if (defaultMatch) {
  const defaultsBlock = defaultMatch[1];
  // Parse: variant: "default", size: "default"
}
```

---

## Component Categories

Components are categorized by file name and content:

### Form Controls
- `button.tsx`
- `input.tsx`
- `textarea.tsx`
- `select.tsx`
- `checkbox.tsx`
- `radio.tsx`
- `switch.tsx`
- `slider.tsx`
- `form.tsx`

### Feedback
- `alert.tsx`
- `dialog.tsx`
- `toast.tsx`
- `tooltip.tsx`
- `popover.tsx`
- `progress.tsx`
- `skeleton.tsx`

### Navigation
- `tabs.tsx`
- `breadcrumb.tsx`
- `dropdown-menu.tsx`
- `navigation-menu.tsx`
- `sidebar.tsx`
- `pagination.tsx`

### Data Display
- `table.tsx`
- `card.tsx`
- `badge.tsx`
- `avatar.tsx`
- `calendar.tsx`
- `chart.tsx`

### Layout
- `separator.tsx`
- `scroll-area.tsx`
- `aspect-ratio.tsx`
- `collapsible.tsx`
- `resizable.tsx`

### Overlay
- `sheet.tsx`
- `drawer.tsx`
- `modal.tsx`
- `command.tsx`
- `context-menu.tsx`

---

## Predefined Components

When parsing fails, these predefined configurations are used:

### Button

```typescript
{
  name: 'Button',
  filePath: 'components/ui/button.tsx',
  variants: [
    {
      name: 'variant',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      defaultValue: 'default'
    },
    {
      name: 'size',
      options: ['sm', 'default', 'lg', 'icon'],
      defaultValue: 'default'
    }
  ],
  hasAsChild: true,
  category: 'form-controls',
  props: ['variant', 'size', 'asChild', 'className']
}
```

### Input

```typescript
{
  name: 'Input',
  filePath: 'components/ui/input.tsx',
  variants: [
    {
      name: 'state',
      options: ['default', 'focus', 'error', 'disabled'],
      defaultValue: 'default'
    }
  ],
  category: 'form-controls',
  props: ['className', 'type', 'placeholder']
}
```

### Badge

```typescript
{
  name: 'Badge',
  filePath: 'components/ui/badge.tsx',
  variants: [
    {
      name: 'variant',
      options: ['default', 'secondary', 'destructive', 'outline'],
      defaultValue: 'default'
    }
  ],
  category: 'data-display'
}
```

### Avatar

```typescript
{
  name: 'Avatar',
  filePath: 'components/ui/avatar.tsx',
  variants: [
    {
      name: 'size',
      options: ['sm', 'default', 'lg', 'xl'],
      defaultValue: 'default'
    }
  ],
  category: 'data-display'
}
```

---

## Props Detection

### From Interface

```typescript
interface ButtonProps {
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  className?: string;
}
```

Extraction:
```typescript
const interfaceMatch = content.match(/interface\s+\w+Props\s*(?:extends[^{]+)?\{([^}]+)\}/);
if (interfaceMatch) {
  const propsBlock = interfaceMatch[1];
  const propPattern = /(\w+)\??:/g;
  // Extract: ["variant", "size", "asChild", "className"]
}
```

### From VariantProps

```typescript
type ButtonProps = VariantProps<typeof buttonVariants>
```

When `VariantProps` is detected, automatically include `variant` and `size` props.

---

## Variant Matrix Generation

For component with multiple variant dimensions:

```typescript
// Input: Button with variant (6) × size (4)
// Output: 24 combinations

const combinations = [
  { componentName: 'Button', variantName: 'variant=default, size=sm', values: { variant: 'default', size: 'sm' } },
  { componentName: 'Button', variantName: 'variant=default, size=default', values: { variant: 'default', size: 'default' } },
  // ... 22 more combinations
];
```

---

## Troubleshooting

### Component Not Detected

1. **Check file location**
   - Must be in `components/ui/` directory
   - Check path case sensitivity

2. **Check export**
   - Must have named export
   - Not default export only

3. **Check file size**
   - Must be < 500 lines
   - Consider splitting large components

### Variants Not Detected

1. **Check cva() format**
   - Must follow standard cva pattern
   - Variants object must be properly formatted

2. **Check variant names**
   - Must be valid JavaScript identifiers
   - No spaces or special characters

### Wrong Category

Component category is inferred from file name. If incorrect:
1. Rename file to match intended category
2. Or add to predefined components with correct category
