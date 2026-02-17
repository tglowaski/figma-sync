/**
 * SLDS Base Components Catalog
 *
 * Predefined component definitions for Salesforce Lightning base components.
 * Only returns definitions for components actually referenced by custom LWC/Aura components.
 * Analogous to getPredefinedComponents() in component-parser.ts.
 */

import { ParsedComponent, ComponentVariant, ComponentCategory } from './component-parser';

// ============================================
// SLDS BASE COMPONENT DEFINITIONS
// ============================================

/**
 * Full catalog of SLDS base component definitions
 */
const SLDS_BASE_CATALOG: Record<string, ParsedComponent> = {
  'lightning-button': {
    name: 'Lightning Button',
    filePath: 'lightning/button',
    variants: [
      {
        name: 'variant',
        options: ['neutral', 'brand', 'destructive', 'inverse', 'success'],
        defaultValue: 'neutral'
      },
      {
        name: 'size',
        options: ['small', 'medium'],
        defaultValue: 'medium'
      }
    ],
    hasAsChild: false,
    category: 'form-controls',
    props: ['label', 'variant', 'disabled', 'icon-name', 'icon-position']
  },

  'lightning-button-icon': {
    name: 'Lightning Button Icon',
    filePath: 'lightning/buttonIcon',
    variants: [
      {
        name: 'variant',
        options: ['bare', 'container', 'brand', 'border', 'border-filled'],
        defaultValue: 'border'
      },
      {
        name: 'size',
        options: ['xx-small', 'x-small', 'small', 'medium', 'large'],
        defaultValue: 'medium'
      }
    ],
    hasAsChild: false,
    category: 'form-controls',
    props: ['icon-name', 'variant', 'size', 'alternative-text', 'disabled']
  },

  'lightning-input': {
    name: 'Lightning Input',
    filePath: 'lightning/input',
    variants: [
      {
        name: 'type',
        options: ['text', 'number', 'email', 'password', 'search', 'tel', 'checkbox', 'toggle'],
        defaultValue: 'text'
      },
      {
        name: 'variant',
        options: ['standard', 'label-hidden', 'label-inline', 'label-stacked'],
        defaultValue: 'standard'
      }
    ],
    hasAsChild: false,
    category: 'form-controls',
    props: ['label', 'type', 'value', 'placeholder', 'required', 'disabled', 'read-only']
  },

  'lightning-card': {
    name: 'Lightning Card',
    filePath: 'lightning/card',
    variants: [
      {
        name: 'variant',
        options: ['base', 'narrow'],
        defaultValue: 'base'
      }
    ],
    hasAsChild: false,
    category: 'data-display',
    props: ['title', 'icon-name', 'variant']
  },

  'lightning-badge': {
    name: 'Lightning Badge',
    filePath: 'lightning/badge',
    variants: [
      {
        name: 'variant',
        options: ['default', 'inverse', 'lightest', 'success', 'warning', 'error'],
        defaultValue: 'default'
      }
    ],
    hasAsChild: false,
    category: 'data-display',
    props: ['label', 'icon-name', 'icon-position']
  },

  'lightning-icon': {
    name: 'Lightning Icon',
    filePath: 'lightning/icon',
    variants: [
      {
        name: 'size',
        options: ['xx-small', 'x-small', 'small', 'medium', 'large'],
        defaultValue: 'medium'
      },
      {
        name: 'variant',
        options: ['default', 'inverse', 'warning', 'error', 'success'],
        defaultValue: 'default'
      }
    ],
    hasAsChild: false,
    category: 'data-display',
    props: ['icon-name', 'size', 'variant', 'alternative-text']
  },

  'lightning-datatable': {
    name: 'Lightning Datatable',
    filePath: 'lightning/datatable',
    variants: [
      {
        name: 'density',
        options: ['comfy', 'compact'],
        defaultValue: 'comfy'
      }
    ],
    hasAsChild: false,
    category: 'data-display',
    props: ['data', 'columns', 'key-field', 'sorted-by', 'sorted-direction', 'hide-checkbox-column']
  },

  'lightning-combobox': {
    name: 'Lightning Combobox',
    filePath: 'lightning/combobox',
    variants: [
      {
        name: 'variant',
        options: ['standard', 'label-hidden', 'label-inline', 'label-stacked'],
        defaultValue: 'standard'
      }
    ],
    hasAsChild: false,
    category: 'form-controls',
    props: ['label', 'placeholder', 'options', 'value', 'required', 'disabled']
  },

  'lightning-tabset': {
    name: 'Lightning Tabset',
    filePath: 'lightning/tabset',
    variants: [
      {
        name: 'variant',
        options: ['default', 'scoped', 'vertical'],
        defaultValue: 'default'
      }
    ],
    hasAsChild: false,
    category: 'navigation',
    props: ['active-tab-value', 'variant']
  },

  'lightning-modal': {
    name: 'Lightning Modal',
    filePath: 'lightning/modal',
    variants: [
      {
        name: 'size',
        options: ['small', 'medium', 'large', 'full'],
        defaultValue: 'medium'
      }
    ],
    hasAsChild: false,
    category: 'overlay',
    props: ['header', 'size']
  },

  'lightning-spinner': {
    name: 'Lightning Spinner',
    filePath: 'lightning/spinner',
    variants: [
      {
        name: 'size',
        options: ['small', 'medium', 'large'],
        defaultValue: 'medium'
      },
      {
        name: 'variant',
        options: ['base', 'brand', 'inverse'],
        defaultValue: 'base'
      }
    ],
    hasAsChild: false,
    category: 'feedback',
    props: ['size', 'variant', 'alternative-text']
  },

  'lightning-progress-bar': {
    name: 'Lightning Progress Bar',
    filePath: 'lightning/progressBar',
    variants: [
      {
        name: 'size',
        options: ['small', 'medium', 'large'],
        defaultValue: 'medium'
      },
      {
        name: 'variant',
        options: ['base', 'circular'],
        defaultValue: 'base'
      }
    ],
    hasAsChild: false,
    category: 'feedback',
    props: ['value', 'size', 'variant']
  },

  'lightning-accordion': {
    name: 'Lightning Accordion',
    filePath: 'lightning/accordion',
    variants: [
      {
        name: 'variant',
        options: ['default', 'multiple'],
        defaultValue: 'default'
      }
    ],
    hasAsChild: false,
    category: 'layout',
    props: ['active-section-name', 'allow-multiple-sections-open']
  },

  'lightning-textarea': {
    name: 'Lightning Textarea',
    filePath: 'lightning/textarea',
    variants: [
      {
        name: 'variant',
        options: ['standard', 'label-hidden'],
        defaultValue: 'standard'
      }
    ],
    hasAsChild: false,
    category: 'form-controls',
    props: ['label', 'value', 'placeholder', 'max-length', 'disabled', 'read-only']
  },

  'lightning-checkbox-group': {
    name: 'Lightning Checkbox Group',
    filePath: 'lightning/checkboxGroup',
    variants: [
      {
        name: 'variant',
        options: ['standard', 'label-hidden'],
        defaultValue: 'standard'
      }
    ],
    hasAsChild: false,
    category: 'form-controls',
    props: ['label', 'options', 'value', 'required', 'disabled']
  },

  'lightning-radio-group': {
    name: 'Lightning Radio Group',
    filePath: 'lightning/radioGroup',
    variants: [
      {
        name: 'variant',
        options: ['standard', 'label-hidden'],
        defaultValue: 'standard'
      }
    ],
    hasAsChild: false,
    category: 'form-controls',
    props: ['label', 'options', 'value', 'required', 'disabled']
  },

  'lightning-breadcrumbs': {
    name: 'Lightning Breadcrumbs',
    filePath: 'lightning/breadcrumbs',
    variants: [],
    hasAsChild: false,
    category: 'navigation',
    props: []
  },

  'lightning-tree': {
    name: 'Lightning Tree',
    filePath: 'lightning/tree',
    variants: [
      {
        name: 'variant',
        options: ['default', 'bare'],
        defaultValue: 'default'
      }
    ],
    hasAsChild: false,
    category: 'navigation',
    props: ['items', 'header', 'selected-item']
  }
};

// ============================================
// PUBLIC API
// ============================================

/**
 * Get SLDS base component definitions only for tags that are actually referenced
 * by custom LWC or Aura components.
 */
export function getReferencedBaseComponents(tagNames: string[]): ParsedComponent[] {
  const components: ParsedComponent[] = [];
  const seen = new Set<string>();

  for (const tag of tagNames) {
    // Normalize: lightning:button → lightning-button
    const normalized = tag.replace(/:/g, '-');
    if (SLDS_BASE_CATALOG[normalized] && !seen.has(normalized)) {
      seen.add(normalized);
      components.push(SLDS_BASE_CATALOG[normalized]);
    }
  }

  return components;
}

/**
 * Check if a tag name corresponds to an SLDS base component
 */
export function isSldsBaseComponent(tagName: string): boolean {
  const normalized = tagName.replace(/:/g, '-');
  return normalized in SLDS_BASE_CATALOG;
}

/**
 * Get all available SLDS base component names
 */
export function getAllBaseComponentNames(): string[] {
  return Object.keys(SLDS_BASE_CATALOG);
}
