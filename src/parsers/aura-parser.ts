/**
 * Aura Parser
 *
 * Parses Aura component (.cmp) source data into ParsedComponent[] format.
 * Extracts <aura:attribute> as variants, SLDS classes, and base component references.
 */

import { ParsedComponent, ComponentVariant, ComponentCategory } from './component-parser';
import { AuraSourceData } from '../generated/aura-components';
import { shouldIncludeAuraComponent } from '../rules/classification-rules';

// ============================================
// TYPES
// ============================================

/**
 * Aura attribute types that may contain variant-like values
 */
const VARIANT_ATTRIBUTE_TYPES = ['String'];

/**
 * Attribute names that should be treated as variants
 */
const VARIANT_ATTRIBUTE_NAMES = [
  'variant', 'size', 'type', 'severity', 'mode', 'density', 'layout', 'theme', 'status'
];

/**
 * Well-known variant option values for common attribute names
 */
const KNOWN_AURA_VARIANT_OPTIONS: Record<string, string[]> = {
  variant: ['default', 'brand', 'outline', 'destructive', 'inverse', 'neutral'],
  size: ['small', 'medium', 'large'],
  type: ['text', 'number', 'email'],
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
 * Parse all Aura components from generated source data
 */
export function parseAuraComponents(auraData: AuraSourceData[]): ParsedComponent[] {
  const components: ParsedComponent[] = [];

  for (const data of auraData) {
    const component = parseAuraComponent(data);
    if (component) {
      components.push(component);
    }
  }

  return components;
}

/**
 * Parse a single Aura component from its source data
 */
export function parseAuraComponent(data: AuraSourceData): ParsedComponent | null {
  if (!shouldIncludeAuraComponent(data.name, data.cmpContent)) {
    return null;
  }

  // Extract aura:attribute as variants
  const variants = extractAuraAttributes(data.cmpContent);

  // Extract SLDS utility classes
  const sldsClasses = extractAuraSldsClasses(data.cmpContent);

  // Extract base component references (lightning:*)
  const baseRefs = extractAuraBaseComponentReferences(data.cmpContent);

  // Detect category
  const category = detectAuraCategory(data.name, sldsClasses, baseRefs);

  // Extract all attribute names as props
  const props = extractAllAuraAttributeNames(data.cmpContent);

  return {
    name: data.name,
    filePath: `aura/${data.name}/${data.name}.cmp`,
    variants,
    hasAsChild: false,
    category,
    props
  };
}

// ============================================
// AURA ATTRIBUTE EXTRACTION
// ============================================

/**
 * Extract <aura:attribute> definitions from .cmp content.
 * String-typed attributes with variant-like names become ComponentVariants.
 */
export function extractAuraAttributes(cmpContent: string): ComponentVariant[] {
  const variants: ComponentVariant[] = [];

  // Match <aura:attribute name="..." type="..." default="..." />
  const attrPattern = /<aura:attribute\s+([^>]*?)\/?\s*>/g;
  let match;

  while ((match = attrPattern.exec(cmpContent)) !== null) {
    const attrString = match[1];

    // Extract individual attribute properties
    const name = extractXmlAttr(attrString, 'name');
    const type = extractXmlAttr(attrString, 'type');
    const defaultValue = extractXmlAttr(attrString, 'default');

    if (!name || !type) continue;

    // Only process String-typed attributes that are variant-like
    if (!VARIANT_ATTRIBUTE_TYPES.includes(type)) continue;
    if (!isVariantAttribute(name)) continue;

    const options = inferAuraVariantOptions(name, defaultValue, cmpContent);
    if (options.length > 0) {
      variants.push({
        name,
        options,
        defaultValue: defaultValue || undefined
      });
    }
  }

  return variants;
}

/**
 * Extract an XML attribute value from an attribute string
 */
function extractXmlAttr(attrString: string, attrName: string): string | null {
  const pattern = new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`);
  const match = attrString.match(pattern);
  return match ? match[1] : null;
}

/**
 * Check if an attribute name is variant-like
 */
function isVariantAttribute(name: string): boolean {
  return VARIANT_ATTRIBUTE_NAMES.includes(name.toLowerCase());
}

/**
 * Infer variant options from attribute name, default, and component content
 */
function inferAuraVariantOptions(
  attrName: string,
  defaultValue: string | null,
  cmpContent: string
): string[] {
  const options = new Set<string>();

  // Add default value
  if (defaultValue) {
    options.add(defaultValue);
  }

  // Look for Aura expression comparisons: v.attrName == 'value' or v.attrName === 'value'
  const comparisonPattern = new RegExp(
    `v\\.${attrName}\\s*={1,3}\\s*['"]([^'"]+)['"]`,
    'g'
  );
  let match;
  while ((match = comparisonPattern.exec(cmpContent)) !== null) {
    options.add(match[1]);
  }

  // Look for dynamic class expressions: 'slds-theme_' + v.attrName
  const concatPattern = new RegExp(
    `['"][^'"]*['"]\\s*\\+\\s*v\\.${attrName}`,
    'g'
  );
  // These indicate the attribute value is used as a class suffix,
  // suggesting the values are known SLDS modifiers

  // Fallback to known options
  if (options.size <= 1) {
    const known = KNOWN_AURA_VARIANT_OPTIONS[attrName.toLowerCase()];
    if (known) {
      known.forEach(v => options.add(v));
    }
  }

  return [...options];
}

/**
 * Extract all aura:attribute names as props
 */
function extractAllAuraAttributeNames(cmpContent: string): string[] {
  const props: string[] = [];
  const attrPattern = /<aura:attribute\s+[^>]*name\s*=\s*["']([^"']+)["'][^>]*\/?>/g;
  let match;

  while ((match = attrPattern.exec(cmpContent)) !== null) {
    props.push(match[1]);
  }

  return [...new Set(props)];
}

// ============================================
// SLDS CLASS EXTRACTION
// ============================================

/**
 * Extract SLDS utility classes from Aura .cmp content
 */
export function extractAuraSldsClasses(cmpContent: string): string[] {
  const classes = new Set<string>();

  // Match class="..." attributes
  const classPattern = /class\s*=\s*["']([^"']+)["']/g;
  let match;

  while ((match = classPattern.exec(cmpContent)) !== null) {
    const classString = match[1];
    const sldsParts = classString.split(/\s+/).filter(c => c.startsWith('slds-'));
    sldsParts.forEach(c => classes.add(c));
  }

  // Match dynamic Aura expressions with SLDS classes
  // e.g., class="{!'slds-notify slds-theme_' + v.severity}"
  const dynamicClassPattern = /class\s*=\s*"\{!([^}]+)\}"/g;
  while ((match = dynamicClassPattern.exec(cmpContent)) !== null) {
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
 * Extract lightning:* base component tag names from Aura .cmp content.
 * Normalizes lightning:button → lightning-button for consistency with LWC.
 */
export function extractAuraBaseComponentReferences(cmpContent: string): string[] {
  const refs = new Set<string>();

  // Match <lightning:* tags (Aura uses colon separator)
  const tagPattern = /<(lightning:\w+)/g;
  let match;

  while ((match = tagPattern.exec(cmpContent)) !== null) {
    // Normalize to LWC-style: lightning:button → lightning-button
    const normalized = match[1].replace(/:/g, '-');
    refs.add(normalized);
  }

  return [...refs];
}

// ============================================
// CATEGORY DETECTION
// ============================================

/**
 * Detect the component category for an Aura component
 */
function detectAuraCategory(
  name: string,
  sldsClasses: string[],
  baseRefs: string[]
): ComponentCategory {
  const lowerName = name.toLowerCase();
  const classStr = sldsClasses.join(' ');

  // Form controls
  if (lowerName.includes('form') || lowerName.includes('input') || lowerName.includes('field') ||
      classStr.includes('slds-form') ||
      baseRefs.some(r => ['lightning-input', 'lightning-combobox', 'lightning-textarea'].includes(r))) {
    return 'form-controls';
  }

  // Feedback
  if (lowerName.includes('alert') || lowerName.includes('toast') || lowerName.includes('notification') ||
      lowerName.includes('spinner') || lowerName.includes('progress') ||
      classStr.includes('slds-notify')) {
    return 'feedback';
  }

  // Navigation
  if (lowerName.includes('nav') || lowerName.includes('tab') || lowerName.includes('breadcrumb') ||
      lowerName.includes('menu') ||
      classStr.includes('slds-tabs')) {
    return 'navigation';
  }

  // Data display
  if (lowerName.includes('table') || lowerName.includes('card') || lowerName.includes('badge') ||
      lowerName.includes('list') || lowerName.includes('tile') || lowerName.includes('data') ||
      classStr.includes('slds-table') || classStr.includes('slds-card')) {
    return 'data-display';
  }

  // Layout
  if (lowerName.includes('layout') || lowerName.includes('grid') || lowerName.includes('container') ||
      lowerName.includes('section') || lowerName.includes('panel') ||
      classStr.includes('slds-grid')) {
    return 'layout';
  }

  // Overlay
  if (lowerName.includes('modal') || lowerName.includes('dialog') || lowerName.includes('popover')) {
    return 'overlay';
  }

  // Default to data-display
  return 'data-display';
}
