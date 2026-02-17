/**
 * LWC Parser
 *
 * Parses Lightning Web Component source data into ParsedComponent[] format.
 * Extracts @api properties as variants, SLDS classes, and base component references.
 */

import { ParsedComponent, ComponentVariant, ComponentCategory } from './component-parser';
import { LwcSourceData } from '../generated/lwc-components';
import { shouldIncludeLwcComponent } from '../rules/classification-rules';

// ============================================
// TYPES
// ============================================

/**
 * Variant-like property names that should be treated as variants
 * with enumerable options rather than free-form props
 */
const VARIANT_PROPERTY_NAMES = [
  'variant', 'size', 'type', 'severity', 'mode', 'density', 'layout', 'theme', 'status'
];

/**
 * Well-known variant option values for common @api property names
 */
const KNOWN_VARIANT_OPTIONS: Record<string, string[]> = {
  variant: ['default', 'brand', 'outline', 'destructive', 'inverse', 'success', 'neutral'],
  size: ['small', 'medium', 'large'],
  type: ['text', 'number', 'email', 'password'],
  severity: ['info', 'warning', 'error', 'success'],
  mode: ['view', 'edit', 'create'],
  density: ['comfy', 'compact'],
  layout: ['stacked', 'horizontal', 'inline'],
  theme: ['default', 'shade', 'inverse'],
  status: ['active', 'inactive', 'pending']
};

// ============================================
// MAIN PARSER FUNCTIONS
// ============================================

/**
 * Parse all LWC components from generated source data
 */
export function parseLwcComponents(lwcData: LwcSourceData[]): ParsedComponent[] {
  const components: ParsedComponent[] = [];

  for (const data of lwcData) {
    const component = parseLwcComponent(data);
    if (component) {
      components.push(component);
    }
  }

  return components;
}

/**
 * Parse a single LWC component from its source data
 */
export function parseLwcComponent(data: LwcSourceData): ParsedComponent | null {
  if (!shouldIncludeLwcComponent(data.name, data.jsContent)) {
    return null;
  }

  // Extract @api properties as variants
  const variants = extractApiProperties(data.jsContent);

  // Extract SLDS utility classes from template
  const sldsClasses = extractSldsClasses(data.htmlContent);

  // Extract base component references (lightning-*)
  const baseRefs = extractBaseComponentReferences(data.htmlContent);

  // Detect category based on name, classes, and base component refs
  const category = detectLwcCategory(data.name, sldsClasses, baseRefs);

  // Extract all @api property names as props
  const props = extractAllApiPropertyNames(data.jsContent);

  // Convert component name from camelCase to PascalCase for display
  const displayName = data.name.charAt(0).toUpperCase() + data.name.slice(1);

  return {
    name: displayName,
    filePath: `lwc/${data.name}/${data.name}.js`,
    variants,
    hasAsChild: false,
    category,
    props
  };
}

// ============================================
// @API PROPERTY EXTRACTION
// ============================================

/**
 * Extract @api properties from LWC JavaScript content.
 * Properties with variant-like names get enumerated options.
 */
export function extractApiProperties(jsContent: string): ComponentVariant[] {
  const variants: ComponentVariant[] = [];

  // Pattern 1: @api propertyName = 'defaultValue';
  const apiWithDefaultPattern = /@api\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = apiWithDefaultPattern.exec(jsContent)) !== null) {
    const propName = match[1];
    const defaultValue = match[2];

    if (isVariantProperty(propName)) {
      const options = inferVariantOptions(propName, defaultValue, jsContent);
      variants.push({
        name: propName,
        options,
        defaultValue
      });
    }
  }

  // Pattern 2: @api propertyName = false/true (boolean props)
  const apiBoolPattern = /@api\s+(\w+)\s*=\s*(true|false)/g;
  while ((match = apiBoolPattern.exec(jsContent)) !== null) {
    const propName = match[1];
    // Skip boolean props as they're not variant-like
  }

  // Pattern 3: @api propertyName; (no default - only include if variant-like)
  const apiNoDefaultPattern = /@api\s+(\w+)\s*;/g;
  while ((match = apiNoDefaultPattern.exec(jsContent)) !== null) {
    const propName = match[1];
    if (isVariantProperty(propName)) {
      const options = inferVariantOptions(propName, undefined, jsContent);
      if (options.length > 0) {
        variants.push({
          name: propName,
          options
        });
      }
    }
  }

  return variants;
}

/**
 * Check if a property name is a variant-like property
 */
function isVariantProperty(name: string): boolean {
  return VARIANT_PROPERTY_NAMES.includes(name.toLowerCase());
}

/**
 * Infer variant options from property name, default value, and conditional checks
 */
function inferVariantOptions(
  propName: string,
  defaultValue: string | undefined,
  jsContent: string
): string[] {
  const options = new Set<string>();

  // Add default value if present
  if (defaultValue) {
    options.add(defaultValue);
  }

  // Look for conditional checks: this.propName === 'value'
  const conditionalPattern = new RegExp(
    `this\\.${propName}\\s*===?\\s*['"]([^'"]+)['"]`,
    'g'
  );
  let match;
  while ((match = conditionalPattern.exec(jsContent)) !== null) {
    options.add(match[1]);
  }

  // Look for switch cases: case 'value':
  const switchPattern = new RegExp(
    `switch\\s*\\(\\s*this\\.${propName}\\s*\\)[^}]*`,
    's'
  );
  const switchMatch = jsContent.match(switchPattern);
  if (switchMatch) {
    const casePattern = /case\s+['"]([^'"]+)['"]/g;
    let caseMatch;
    while ((caseMatch = casePattern.exec(switchMatch[0])) !== null) {
      options.add(caseMatch[1]);
    }
  }

  // Fallback to known options if we couldn't infer any
  if (options.size === 0 || (options.size === 1 && defaultValue)) {
    const known = KNOWN_VARIANT_OPTIONS[propName.toLowerCase()];
    if (known) {
      known.forEach(v => options.add(v));
    }
  }

  return [...options];
}

/**
 * Extract all @api property names (not just variant-like ones)
 */
function extractAllApiPropertyNames(jsContent: string): string[] {
  const props: string[] = [];
  const apiPattern = /@api\s+(\w+)/g;
  let match;

  while ((match = apiPattern.exec(jsContent)) !== null) {
    props.push(match[1]);
  }

  return [...new Set(props)];
}

// ============================================
// SLDS CLASS EXTRACTION
// ============================================

/**
 * Extract SLDS utility class names from LWC HTML template
 */
export function extractSldsClasses(htmlContent: string): string[] {
  const classes = new Set<string>();

  // Match class="..." attributes
  const classPattern = /class\s*=\s*["']([^"']+)["']/g;
  let match;

  while ((match = classPattern.exec(htmlContent)) !== null) {
    const classString = match[1];
    // Extract individual slds-* classes
    const sldsParts = classString.split(/\s+/).filter(c => c.startsWith('slds-'));
    sldsParts.forEach(c => classes.add(c));
  }

  // Also match dynamic class bindings: class={expression}
  // These may contain slds classes in the JS content
  const dynamicClassPattern = /class\s*=\s*\{([^}]+)\}/g;
  while ((match = dynamicClassPattern.exec(htmlContent)) !== null) {
    // Dynamic classes are resolved at runtime, but we can extract
    // any literal slds-* strings from the binding expression
    const expr = match[1];
    const sldsLiterals = expr.match(/slds-[\w-]+/g);
    if (sldsLiterals) {
      sldsLiterals.forEach(c => classes.add(c));
    }
  }

  return [...classes];
}

// ============================================
// BASE COMPONENT REFERENCE EXTRACTION
// ============================================

/**
 * Extract lightning-* base component tag names from LWC HTML template
 */
export function extractBaseComponentReferences(htmlContent: string): string[] {
  const refs = new Set<string>();

  // Match <lightning-* tags
  const tagPattern = /<(lightning-[\w-]+)/g;
  let match;

  while ((match = tagPattern.exec(htmlContent)) !== null) {
    refs.add(match[1]);
  }

  return [...refs];
}

// ============================================
// CATEGORY DETECTION
// ============================================

/**
 * Detect the component category based on name, SLDS classes, and base component references
 */
export function detectLwcCategory(
  name: string,
  sldsClasses: string[],
  baseRefs: string[]
): ComponentCategory {
  const lowerName = name.toLowerCase();
  const classStr = sldsClasses.join(' ');

  // Form controls
  if (lowerName.includes('form') || lowerName.includes('input') || lowerName.includes('field') ||
      classStr.includes('slds-form') ||
      baseRefs.some(r => ['lightning-input', 'lightning-combobox', 'lightning-textarea',
        'lightning-checkbox-group', 'lightning-radio-group'].includes(r))) {
    return 'form-controls';
  }

  // Feedback
  if (lowerName.includes('alert') || lowerName.includes('toast') || lowerName.includes('notification') ||
      lowerName.includes('spinner') || lowerName.includes('progress') ||
      classStr.includes('slds-notify') || classStr.includes('slds-spinner') ||
      baseRefs.some(r => ['lightning-spinner', 'lightning-progress-bar'].includes(r))) {
    return 'feedback';
  }

  // Navigation
  if (lowerName.includes('nav') || lowerName.includes('tab') || lowerName.includes('breadcrumb') ||
      lowerName.includes('menu') ||
      classStr.includes('slds-tabs') || classStr.includes('slds-breadcrumb') ||
      baseRefs.some(r => ['lightning-tabset', 'lightning-breadcrumbs'].includes(r))) {
    return 'navigation';
  }

  // Data display
  if (lowerName.includes('table') || lowerName.includes('card') || lowerName.includes('badge') ||
      lowerName.includes('list') || lowerName.includes('tile') || lowerName.includes('data') ||
      classStr.includes('slds-table') || classStr.includes('slds-card') ||
      baseRefs.some(r => ['lightning-datatable', 'lightning-card', 'lightning-badge'].includes(r))) {
    return 'data-display';
  }

  // Layout
  if (lowerName.includes('layout') || lowerName.includes('grid') || lowerName.includes('container') ||
      lowerName.includes('section') || lowerName.includes('panel') ||
      classStr.includes('slds-grid') || classStr.includes('slds-box')) {
    return 'layout';
  }

  // Overlay
  if (lowerName.includes('modal') || lowerName.includes('dialog') || lowerName.includes('popover') ||
      baseRefs.some(r => ['lightning-modal'].includes(r))) {
    return 'overlay';
  }

  // Default to data-display for most LWC components
  return 'data-display';
}
