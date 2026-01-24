/**
 * Component Parser
 *
 * Parses React components to extract variant information and structure
 */

import {
  shouldIncludeComponent,
  extractComponentName,
  extractCvaVariants
} from '../rules/classification-rules';

// ============================================
// TYPES
// ============================================

export interface ComponentVariant {
  name: string;
  options: string[];
  defaultValue?: string;
}

export interface ParsedComponent {
  name: string;
  filePath: string;
  variants: ComponentVariant[];
  hasAsChild: boolean;
  category: ComponentCategory;
  props: string[];
}

export type ComponentCategory =
  | 'form-controls'
  | 'feedback'
  | 'navigation'
  | 'data-display'
  | 'layout'
  | 'overlay'
  | 'typography';

// ============================================
// COMPONENT DETECTION
// ============================================

/**
 * Detect component category from file path and content
 */
function detectComponentCategory(filePath: string, content: string): ComponentCategory {
  const fileName = filePath.split('/').pop()?.replace('.tsx', '').toLowerCase() || '';

  // Form controls
  if (['button', 'input', 'textarea', 'select', 'checkbox', 'radio', 'switch', 'slider', 'form'].includes(fileName)) {
    return 'form-controls';
  }

  // Feedback
  if (['alert', 'dialog', 'toast', 'tooltip', 'popover', 'progress', 'skeleton'].includes(fileName)) {
    return 'feedback';
  }

  // Navigation
  if (['tabs', 'breadcrumb', 'dropdown-menu', 'navigation-menu', 'sidebar', 'pagination'].includes(fileName)) {
    return 'navigation';
  }

  // Data display
  if (['table', 'card', 'badge', 'avatar', 'calendar', 'chart'].includes(fileName)) {
    return 'data-display';
  }

  // Layout
  if (['separator', 'scroll-area', 'aspect-ratio', 'collapsible', 'resizable'].includes(fileName)) {
    return 'layout';
  }

  // Overlay
  if (['sheet', 'drawer', 'modal', 'command', 'context-menu'].includes(fileName)) {
    return 'overlay';
  }

  // Typography
  if (content.includes('prose') || fileName === 'typography') {
    return 'typography';
  }

  // Default to form controls for most UI components
  return 'form-controls';
}

/**
 * Extract props from component interface
 */
function extractProps(content: string): string[] {
  const props: string[] = [];

  // Match props interface: interface ButtonProps { ... }
  const interfaceMatch = content.match(/interface\s+\w+Props\s*(?:extends[^{]+)?\{([^}]+)\}/);
  if (interfaceMatch) {
    const propsBlock = interfaceMatch[1];
    const propPattern = /(\w+)\??:/g;
    let match;
    while ((match = propPattern.exec(propsBlock)) !== null) {
      props.push(match[1]);
    }
  }

  // Also check for VariantProps
  if (content.includes('VariantProps')) {
    props.push('variant', 'size');
  }

  return [...new Set(props)]; // Remove duplicates
}

/**
 * Extract default variant values
 */
function extractDefaultVariants(content: string): Record<string, string> {
  const defaults: Record<string, string> = {};

  const defaultMatch = content.match(/defaultVariants:\s*\{([^}]+)\}/);
  if (defaultMatch) {
    const defaultsBlock = defaultMatch[1];
    const defaultPattern = /(\w+):\s*["'](\w+)["']/g;
    let match;
    while ((match = defaultPattern.exec(defaultsBlock)) !== null) {
      defaults[match[1]] = match[2];
    }
  }

  return defaults;
}

/**
 * Parse a single component file
 */
export function parseComponent(filePath: string, content: string): ParsedComponent | null {
  // Check if component should be included
  if (!shouldIncludeComponent(filePath, content)) {
    return null;
  }

  // Extract component name
  const name = extractComponentName(content);
  if (!name) {
    return null;
  }

  // Extract variants from cva
  const variantsRaw = extractCvaVariants(content);
  const defaultVariants = extractDefaultVariants(content);

  // Convert to ComponentVariant format
  const variants: ComponentVariant[] = Object.entries(variantsRaw).map(([variantName, options]) => ({
    name: variantName,
    options: options,
    defaultValue: defaultVariants[variantName]
  }));

  // Check for asChild pattern (Radix)
  const hasAsChild = content.includes('asChild');

  // Detect category
  const category = detectComponentCategory(filePath, content);

  // Extract props
  const props = extractProps(content);

  return {
    name,
    filePath,
    variants,
    hasAsChild,
    category,
    props
  };
}

// ============================================
// VARIANT MATRIX GENERATION
// ============================================

export interface VariantCombination {
  componentName: string;
  variantName: string;
  values: Record<string, string>;
}

/**
 * Generate all variant combinations for a component
 */
export function generateVariantMatrix(component: ParsedComponent): VariantCombination[] {
  const combinations: VariantCombination[] = [];

  if (component.variants.length === 0) {
    // No variants - single component
    combinations.push({
      componentName: component.name,
      variantName: 'default',
      values: {}
    });
    return combinations;
  }

  // Generate cartesian product of all variant options
  const variantArrays = component.variants.map(v => v.options.map(o => ({ key: v.name, value: o })));

  function cartesian(arrays: Array<Array<{ key: string; value: string }>>): Array<Record<string, string>>[] {
    if (arrays.length === 0) return [[]];
    const [first, ...rest] = arrays;
    const restCombos = cartesian(rest);
    const result: Array<Record<string, string>>[] = [];
    for (const item of first) {
      for (const combo of restCombos) {
        result.push([{ [item.key]: item.value }, ...combo]);
      }
    }
    return result;
  }

  const combos = cartesian(variantArrays);

  for (const combo of combos) {
    const values: Record<string, string> = {};
    for (const item of combo) {
      Object.assign(values, item);
    }

    // Generate variant name like "variant=outline, size=lg"
    const variantName = Object.entries(values)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    combinations.push({
      componentName: component.name,
      variantName: variantName || 'default',
      values
    });
  }

  return combinations;
}

// ============================================
// PREDEFINED COMPONENT CONFIGS
// ============================================

/**
 * Get predefined component configurations for UI components
 * Used when parsing fails or for static generation
 */
export function getPredefinedComponents(): ParsedComponent[] {
  return [
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
    },
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
      hasAsChild: false,
      category: 'form-controls',
      props: ['className', 'type', 'placeholder']
    },
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
      hasAsChild: false,
      category: 'data-display',
      props: ['variant', 'className']
    },
    {
      name: 'Card',
      filePath: 'components/ui/card.tsx',
      variants: [],
      hasAsChild: false,
      category: 'data-display',
      props: ['className']
    },
    {
      name: 'Checkbox',
      filePath: 'components/ui/checkbox.tsx',
      variants: [
        {
          name: 'state',
          options: ['unchecked', 'checked', 'indeterminate'],
          defaultValue: 'unchecked'
        }
      ],
      hasAsChild: false,
      category: 'form-controls',
      props: ['checked', 'onCheckedChange', 'className']
    },
    {
      name: 'Switch',
      filePath: 'components/ui/switch.tsx',
      variants: [
        {
          name: 'state',
          options: ['off', 'on'],
          defaultValue: 'off'
        }
      ],
      hasAsChild: false,
      category: 'form-controls',
      props: ['checked', 'onCheckedChange', 'className']
    },
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
      hasAsChild: false,
      category: 'data-display',
      props: ['className', 'src', 'alt']
    },
    {
      name: 'Alert',
      filePath: 'components/ui/alert.tsx',
      variants: [
        {
          name: 'variant',
          options: ['default', 'destructive'],
          defaultValue: 'default'
        }
      ],
      hasAsChild: false,
      category: 'feedback',
      props: ['variant', 'className']
    },
    {
      name: 'Table',
      filePath: 'components/ui/table.tsx',
      variants: [],
      hasAsChild: false,
      category: 'data-display',
      props: ['className']
    },
    {
      name: 'Dialog',
      filePath: 'components/ui/dialog.tsx',
      variants: [],
      hasAsChild: false,
      category: 'overlay',
      props: ['open', 'onOpenChange']
    },
    {
      name: 'Select',
      filePath: 'components/ui/select.tsx',
      variants: [],
      hasAsChild: false,
      category: 'form-controls',
      props: ['value', 'onValueChange']
    },
    {
      name: 'Tabs',
      filePath: 'components/ui/tabs.tsx',
      variants: [],
      hasAsChild: false,
      category: 'navigation',
      props: ['value', 'onValueChange', 'defaultValue']
    },
    {
      name: 'Tooltip',
      filePath: 'components/ui/tooltip.tsx',
      variants: [],
      hasAsChild: false,
      category: 'feedback',
      props: []
    },
    {
      name: 'Progress',
      filePath: 'components/ui/progress.tsx',
      variants: [],
      hasAsChild: false,
      category: 'feedback',
      props: ['value', 'className']
    },
    {
      name: 'Skeleton',
      filePath: 'components/ui/skeleton.tsx',
      variants: [],
      hasAsChild: false,
      category: 'feedback',
      props: ['className']
    },
    {
      name: 'Separator',
      filePath: 'components/ui/separator.tsx',
      variants: [
        {
          name: 'orientation',
          options: ['horizontal', 'vertical'],
          defaultValue: 'horizontal'
        }
      ],
      hasAsChild: false,
      category: 'layout',
      props: ['orientation', 'className']
    }
  ];
}

// ============================================
// COMPONENT STYLE EXTRACTION
// ============================================

/**
 * Extract base classes from cva definition
 */
export function extractBaseClasses(content: string): string[] {
  const cvaMatch = content.match(/cva\s*\(\s*["'`]([\s\S]*?)["'`]/);
  if (!cvaMatch) return [];

  const baseClasses = cvaMatch[1].trim();
  return baseClasses.split(/\s+/).filter(Boolean);
}

/**
 * Extract variant classes for a specific variant combination
 */
export function extractVariantClasses(content: string, variant: string, value: string): string[] {
  const variantsMatch = content.match(new RegExp(`${variant}:\\s*\\{[^}]*${value}:\\s*["'\`]([^"'\`]+)["'\`]`));
  if (!variantsMatch) return [];

  return variantsMatch[1].trim().split(/\s+/).filter(Boolean);
}
