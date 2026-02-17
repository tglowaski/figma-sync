/**
 * SLDS Token Parser
 *
 * Parses Salesforce Lightning Design System CSS custom properties
 * into the existing ParsedTokens interface for Figma variable generation.
 */

import { parseCssColor, hexToRgb, RGB } from '../utils/figma-helpers';
import {
  ParsedTokens,
  ColorToken,
  SpacingToken,
  RadiusToken,
  FontSizeToken
} from './token-parser';

// ============================================
// SLDS COLOR MAPPING
// ============================================

/**
 * Mapping of SLDS CSS custom property names to semantic color palette names.
 * Used to normalize SLDS tokens into the same structure as React/CSS tokens.
 */
const SLDS_COLOR_MAP: Record<string, { semanticName: string; description: string }> = {
  // Brand / Primary
  'slds-g-color-brand-base-60': { semanticName: 'primary', description: 'Primary brand color' },
  'slds-g-color-brand-base-50': { semanticName: 'primary-foreground', description: 'Text on primary' },
  // Background
  'slds-g-color-neutral-base-100': { semanticName: 'background', description: 'Main background' },
  'slds-g-color-background': { semanticName: 'background', description: 'Main background' },
  // Foreground
  'slds-g-color-neutral-base-10': { semanticName: 'foreground', description: 'Main text color' },
  // Card
  'slds-g-color-surface-1': { semanticName: 'card', description: 'Card background' },
  'slds-g-color-on-surface-1': { semanticName: 'card-foreground', description: 'Card text' },
  // Muted
  'slds-g-color-neutral-base-95': { semanticName: 'muted', description: 'Muted backgrounds' },
  'slds-g-color-neutral-base-60': { semanticName: 'muted-foreground', description: 'Muted text' },
  // Border
  'slds-g-color-border-base-1': { semanticName: 'border', description: 'Border color' },
  'slds-g-color-border-base-2': { semanticName: 'input', description: 'Input border' },
  // Destructive / Error
  'slds-g-color-error-base-40': { semanticName: 'destructive', description: 'Error/delete actions' },
  'slds-g-color-error-base': { semanticName: 'destructive', description: 'Error/delete actions' },
  // Success
  'slds-g-color-success-base-40': { semanticName: 'accent', description: 'Success/accent color' },
  // Warning
  'slds-g-color-warning-base-40': { semanticName: 'chart-4', description: 'Warning color' },
  // Focus ring
  'slds-g-color-brand-base-40': { semanticName: 'ring', description: 'Focus ring color' },
};

/**
 * Hardcoded SLDS default color values (hex) as fallback
 * when CSS variables cannot be parsed from the SLDS CSS source.
 */
const SLDS_DEFAULT_COLORS: Record<string, { hex: string; description: string }> = {
  'primary': { hex: '#0176D3', description: 'Primary brand color (Salesforce Blue)' },
  'primary-foreground': { hex: '#FFFFFF', description: 'Text on primary' },
  'background': { hex: '#FFFFFF', description: 'Main background' },
  'foreground': { hex: '#181818', description: 'Main text color' },
  'card': { hex: '#FFFFFF', description: 'Card background' },
  'card-foreground': { hex: '#181818', description: 'Card text' },
  'secondary': { hex: '#747474', description: 'Secondary actions' },
  'secondary-foreground': { hex: '#FFFFFF', description: 'Text on secondary' },
  'muted': { hex: '#F3F3F3', description: 'Muted backgrounds' },
  'muted-foreground': { hex: '#747474', description: 'Muted text' },
  'accent': { hex: '#2E844A', description: 'Success/accent color' },
  'accent-foreground': { hex: '#FFFFFF', description: 'Text on accent' },
  'destructive': { hex: '#EA001E', description: 'Error/delete actions' },
  'destructive-foreground': { hex: '#FFFFFF', description: 'Text on destructive' },
  'border': { hex: '#C9C9C9', description: 'Border color' },
  'input': { hex: '#C9C9C9', description: 'Input border' },
  'ring': { hex: '#0176D3', description: 'Focus ring color' },
  'popover': { hex: '#FFFFFF', description: 'Popover background' },
  'popover-foreground': { hex: '#181818', description: 'Popover text' },
  'chart-1': { hex: '#0176D3', description: 'Chart color 1 (Brand)' },
  'chart-2': { hex: '#2E844A', description: 'Chart color 2 (Success)' },
  'chart-3': { hex: '#EA001E', description: 'Chart color 3 (Error)' },
  'chart-4': { hex: '#FE9339', description: 'Chart color 4 (Warning)' },
  'chart-5': { hex: '#BA01FF', description: 'Chart color 5 (Purple)' },
  'sidebar': { hex: '#032D60', description: 'Sidebar background (Nav dark)' },
  'sidebar-foreground': { hex: '#FFFFFF', description: 'Sidebar text' },
  'sidebar-primary': { hex: '#1B96FF', description: 'Sidebar primary' },
  'sidebar-primary-foreground': { hex: '#FFFFFF', description: 'Sidebar primary text' },
  'sidebar-accent': { hex: '#014486', description: 'Sidebar hover' },
  'sidebar-accent-foreground': { hex: '#FFFFFF', description: 'Sidebar hover text' },
  'sidebar-border': { hex: '#014486', description: 'Sidebar border' },
  'sidebar-ring': { hex: '#1B96FF', description: 'Sidebar focus ring' },
};

// ============================================
// SLDS CSS PARSING
// ============================================

/**
 * Parse SLDS CSS custom properties from the SLDS stylesheet content
 */
export function parseSldsCssTokens(cssContent: string): ParsedTokens {
  const result: ParsedTokens = {
    colors: { light: {}, dark: {} },
    spacing: [],
    radius: [],
    fontSize: [],
    componentSizes: {}
  };

  if (!cssContent || cssContent.trim() === '') {
    return result;
  }

  // Extract :root block(s) - SLDS uses :root for custom properties
  const rootBlocks: string[] = [];
  const rootRegex = /:root\s*\{([^}]+)\}/g;
  let rootMatch;
  while ((rootMatch = rootRegex.exec(cssContent)) !== null) {
    rootBlocks.push(rootMatch[1]);
  }

  // Also check for :host blocks (used in LWC)
  const hostRegex = /:host\s*\{([^}]+)\}/g;
  let hostMatch;
  while ((hostMatch = hostRegex.exec(cssContent)) !== null) {
    rootBlocks.push(hostMatch[1]);
  }

  const allVars = rootBlocks.join('\n');

  // Parse SLDS color variables
  parseSldsColorVariables(allVars, result.colors.light);

  // Parse spacing variables
  parseSldsSpacingVariables(allVars, result.spacing);

  // Parse radius variables
  parseSldsRadiusVariables(allVars, result.radius);

  return result;
}

/**
 * Parse SLDS color variables from CSS content
 */
function parseSldsColorVariables(cssBlock: string, target: Record<string, ColorToken>): void {
  const varPattern = /--([\w-]+):\s*([^;]+);/g;
  let match;

  while ((match = varPattern.exec(cssBlock)) !== null) {
    const name = match[1];
    const value = match[2].trim();

    // Only process color-related SLDS variables
    if (!isSldsColorVariable(name)) continue;

    // Check if this maps to a semantic color name
    const mapping = SLDS_COLOR_MAP[name];
    if (mapping) {
      const rgb = parseCssColor(value);
      if (rgb) {
        target[mapping.semanticName] = {
          name: mapping.semanticName,
          value: value,
          rgb: rgb,
          description: mapping.description
        };
      }
    }
  }
}

/**
 * Check if a CSS variable name is an SLDS color variable
 */
function isSldsColorVariable(name: string): boolean {
  return name.startsWith('slds-g-color-') ||
    name.startsWith('lwc-color') ||
    name.startsWith('slds-c-') && name.includes('color');
}

/**
 * Parse SLDS spacing variables
 */
function parseSldsSpacingVariables(cssBlock: string, target: SpacingToken[]): void {
  const varPattern = /--slds-g-spacing-([\w-]+):\s*([^;]+);/g;
  let match;

  while ((match = varPattern.exec(cssBlock)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    const numValue = parseRemOrPx(value);
    if (numValue !== null) {
      target.push({ name, value: numValue });
    }
  }
}

/**
 * Parse SLDS border radius variables
 */
function parseSldsRadiusVariables(cssBlock: string, target: RadiusToken[]): void {
  const varPattern = /--slds-g-radius-border-([\w-]+):\s*([^;]+);/g;
  let match;

  while ((match = varPattern.exec(cssBlock)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    const numValue = parseRemOrPx(value);
    if (numValue !== null) {
      target.push({ name, value: numValue });
    }
  }
}

/**
 * Parse a rem or px value to pixels
 */
function parseRemOrPx(value: string): number | null {
  if (value.includes('rem')) {
    return parseFloat(value) * 16;
  } else if (value.includes('px')) {
    return parseFloat(value);
  } else if (/^[\d.]+$/.test(value.trim())) {
    return parseFloat(value);
  }
  return null;
}

// ============================================
// SLDS DEFAULT TOKEN VALUES
// ============================================

/**
 * Get SLDS default spacing scale
 */
export function getSldsDefaultSpacing(): SpacingToken[] {
  return [
    { name: 'none', value: 0 },
    { name: 'xxx-small', value: 2 },
    { name: 'xx-small', value: 4 },
    { name: 'x-small', value: 8 },
    { name: 'small', value: 12 },
    { name: 'medium', value: 16 },
    { name: 'large', value: 20 },
    { name: 'x-large', value: 24 },
    { name: 'xx-large', value: 32 },
    { name: 'xxx-large', value: 48 }
  ];
}

/**
 * Get SLDS default border radius scale
 */
export function getSldsDefaultBorderRadius(): RadiusToken[] {
  return [
    { name: 'none', value: 0 },
    { name: '1', value: 2 },
    { name: '2', value: 4 },
    { name: '3', value: 6 },
    { name: '4', value: 8 },
    { name: 'circle', value: 9999 }
  ];
}

/**
 * Get SLDS default font size scale (Salesforce typography)
 */
export function getSldsDefaultFontSizes(): FontSizeToken[] {
  return [
    { name: 'x-small', size: 10, lineHeight: 14 },
    { name: 'small', size: 12, lineHeight: 16 },
    { name: 'medium', size: 14, lineHeight: 20 },
    { name: 'large', size: 16, lineHeight: 22 },
    { name: 'x-large', size: 20, lineHeight: 28 },
    { name: 'xx-large', size: 24, lineHeight: 32 },
    { name: 'heading-small', size: 16, lineHeight: 22 },
    { name: 'heading-medium', size: 20, lineHeight: 28 },
    { name: 'heading-large', size: 24, lineHeight: 32 }
  ];
}

/**
 * Get SLDS component sizes
 */
export function getSldsComponentSizes(): Record<string, number> {
  return {
    buttonSm: 28,
    buttonDefault: 32,
    buttonLg: 40,
    buttonIcon: 32,
    inputHeight: 32,
    avatarSm: 24,
    avatarDefault: 32,
    avatarLg: 48,
    avatarXl: 64,
    navHeight: 48,
    badgeHeight: 20,
    tabsHeight: 44,
    modalWidth: 640,
    cardMinHeight: 120,
    spinnerSm: 24,
    spinnerMd: 48,
    spinnerLg: 80
  };
}

// ============================================
// FULL SLDS TOKEN EXTRACTION
// ============================================

/**
 * Extract all SLDS tokens from CSS content and merge with defaults.
 * This is the main entry point, analogous to extractAllTokens() for React.
 */
export function extractAllSldsTokens(cssContent: string): ParsedTokens {
  const parsed = parseSldsCssTokens(cssContent);

  // Fill in default colors for any missing semantic colors
  for (const [semanticName, config] of Object.entries(SLDS_DEFAULT_COLORS)) {
    if (!parsed.colors.light[semanticName]) {
      const rgb = hexToRgb(config.hex);
      if (rgb) {
        parsed.colors.light[semanticName] = {
          name: semanticName,
          value: config.hex,
          rgb: rgb,
          description: config.description
        };
      }
    }
  }

  // Generate dark mode colors from SLDS dark theme defaults
  // SLDS uses a different approach to dark mode, so we generate sensible defaults
  for (const [name, token] of Object.entries(parsed.colors.light)) {
    if (!parsed.colors.dark[name]) {
      parsed.colors.dark[name] = generateSldsDarkColor(name, token);
    }
  }

  // Add default spacing if not found
  if (parsed.spacing.length === 0) {
    parsed.spacing = getSldsDefaultSpacing();
  }

  // Add default radius if not found
  if (parsed.radius.length === 0) {
    parsed.radius = getSldsDefaultBorderRadius();
  }

  // Add default font sizes
  if (parsed.fontSize.length === 0) {
    parsed.fontSize = getSldsDefaultFontSizes();
  }

  // Add component sizes
  parsed.componentSizes = getSldsComponentSizes();

  return parsed;
}

/**
 * Generate a dark mode version of an SLDS color token.
 * Uses Salesforce's dark theme color mappings.
 */
function generateSldsDarkColor(name: string, lightToken: ColorToken): ColorToken {
  // SLDS dark theme color overrides
  const darkOverrides: Record<string, string> = {
    'background': '#16181C',
    'foreground': '#E5E5E5',
    'card': '#1C1F25',
    'card-foreground': '#E5E5E5',
    'primary': '#1B96FF',
    'primary-foreground': '#FFFFFF',
    'secondary': '#9E9E9E',
    'secondary-foreground': '#FFFFFF',
    'muted': '#2A2D32',
    'muted-foreground': '#9E9E9E',
    'accent': '#45C65A',
    'accent-foreground': '#FFFFFF',
    'destructive': '#FE5C4C',
    'destructive-foreground': '#FFFFFF',
    'border': '#3A3D42',
    'input': '#3A3D42',
    'ring': '#1B96FF',
    'popover': '#1C1F25',
    'popover-foreground': '#E5E5E5',
    'sidebar': '#0B1D36',
    'sidebar-foreground': '#E5E5E5',
    'sidebar-primary': '#1B96FF',
    'sidebar-primary-foreground': '#FFFFFF',
    'sidebar-accent': '#1A3A5C',
    'sidebar-accent-foreground': '#E5E5E5',
    'sidebar-border': '#1A3A5C',
    'sidebar-ring': '#1B96FF',
    'chart-1': '#1B96FF',
    'chart-2': '#45C65A',
    'chart-3': '#FE5C4C',
    'chart-4': '#FE9339',
    'chart-5': '#D17CFF',
  };

  const darkHex = darkOverrides[name];
  if (darkHex) {
    const rgb = hexToRgb(darkHex);
    if (rgb) {
      return {
        name: name,
        value: darkHex,
        rgb: rgb,
        description: lightToken.description
      };
    }
  }

  // Fallback: return light token as-is
  return { ...lightToken };
}
