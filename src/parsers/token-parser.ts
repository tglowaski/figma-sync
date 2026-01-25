/**
 * Token Parser
 *
 * Parses CSS custom properties and design tokens from source files.
 * Supports multiple token formats:
 * - CSS custom properties (globals.css)
 * - Style Dictionary JSON format
 */

import { parseCssColor, RGB } from '../utils/figma-helpers';
import { parseStyleDictionaryTokens } from './style-dictionary-parser';
import type { TokenFormat } from '../config/framework-presets';

// ============================================
// TYPES
// ============================================

export interface ColorToken {
  name: string;
  value: string;
  rgb: RGB;
  description?: string;
}

export interface ColorTokens {
  light: Record<string, ColorToken>;
  dark: Record<string, ColorToken>;
}

export interface SpacingToken {
  name: string;
  value: number;
}

export interface RadiusToken {
  name: string;
  value: number;
}

export interface FontSizeToken {
  name: string;
  size: number;
  lineHeight: number;
}

export interface ParsedTokens {
  colors: ColorTokens;
  spacing: SpacingToken[];
  radius: RadiusToken[];
  fontSize: FontSizeToken[];
  componentSizes: Record<string, number>;
}

// ============================================
// CSS PARSING
// ============================================

/**
 * Parse CSS custom properties from globals.css content
 */
export function parseCssTokens(cssContent: string): ParsedTokens {
  const result: ParsedTokens = {
    colors: { light: {}, dark: {} },
    spacing: [],
    radius: [],
    fontSize: [],
    componentSizes: {}
  };

  // Extract :root section for light mode
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    parseColorVariables(rootMatch[1], result.colors.light);
    parseRadiusVariables(rootMatch[1], result.radius);
  }

  // Extract .dark section for dark mode
  const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);
  if (darkMatch) {
    parseColorVariables(darkMatch[1], result.colors.dark);
  }

  return result;
}

/**
 * Parse color variables from a CSS block
 */
function parseColorVariables(cssBlock: string, target: Record<string, ColorToken>): void {
  // Match --variable-name: value
  const varPattern = /--([\w-]+):\s*([^;]+);/g;
  let match;

  while ((match = varPattern.exec(cssBlock)) !== null) {
    const name = match[1];
    const value = match[2].trim();

    // Skip non-color variables
    if (name === 'radius') continue;

    // Parse the color value
    const rgb = parseCssColor(value);
    if (rgb) {
      target[name] = {
        name: name,
        value: value,
        rgb: rgb
      };
    }
  }
}

/**
 * Parse radius variables from a CSS block
 */
function parseRadiusVariables(cssBlock: string, target: RadiusToken[]): void {
  // Match --radius: value or --radius-*: value
  const radiusPattern = /--radius(?:-([\w-]+))?:\s*([^;]+);/g;
  let match;

  while ((match = radiusPattern.exec(cssBlock)) !== null) {
    const suffix = match[1] || 'base';
    const value = match[2].trim();

    // Parse rem/px values
    let numValue = 0;
    if (value.includes('rem')) {
      numValue = parseFloat(value) * 16; // Convert rem to px
    } else if (value.includes('px')) {
      numValue = parseFloat(value);
    } else if (value.includes('calc')) {
      // Handle calc(var(--radius) - 4px) etc
      // For now, use base value of 10px and adjust
      const calcMatch = value.match(/calc\(var\(--radius\)\s*([+-])\s*(\d+)px\)/);
      if (calcMatch) {
        const baseRadius = 10; // Default from globals.css
        const operator = calcMatch[1];
        const adjustment = parseInt(calcMatch[2]);
        numValue = operator === '+' ? baseRadius + adjustment : baseRadius - adjustment;
      }
    } else {
      numValue = parseFloat(value) || 0;
    }

    target.push({
      name: suffix,
      value: numValue
    });
  }
}

// ============================================
// PREDEFINED TOKEN VALUES
// ============================================

/**
 * Get default spacing scale
 */
export function getDefaultSpacing(): SpacingToken[] {
  return [
    { name: '0', value: 0 },
    { name: '0.5', value: 2 },
    { name: '1', value: 4 },
    { name: '1.5', value: 6 },
    { name: '2', value: 8 },
    { name: '2.5', value: 10 },
    { name: '3', value: 12 },
    { name: '3.5', value: 14 },
    { name: '4', value: 16 },
    { name: '5', value: 20 },
    { name: '6', value: 24 },
    { name: '7', value: 28 },
    { name: '8', value: 32 },
    { name: '9', value: 36 },
    { name: '10', value: 40 },
    { name: '12', value: 48 },
    { name: '14', value: 56 },
    { name: '16', value: 64 },
    { name: '20', value: 80 },
    { name: '24', value: 96 }
  ];
}

/**
 * Get default border radius scale
 */
export function getDefaultBorderRadius(): RadiusToken[] {
  return [
    { name: 'none', value: 0 },
    { name: 'sm', value: 6 },
    { name: 'md', value: 8 },
    { name: 'base', value: 10 },
    { name: 'lg', value: 10 },
    { name: 'xl', value: 14 },
    { name: '2xl', value: 16 },
    { name: 'full', value: 9999 }
  ];
}

/**
 * Get default font size scale
 */
export function getDefaultFontSizes(): FontSizeToken[] {
  return [
    { name: 'xs', size: 12, lineHeight: 16 },
    { name: 'sm', size: 14, lineHeight: 20 },
    { name: 'base', size: 16, lineHeight: 24 },
    { name: 'lg', size: 18, lineHeight: 28 },
    { name: 'xl', size: 20, lineHeight: 28 },
    { name: '2xl', size: 24, lineHeight: 32 },
    { name: '3xl', size: 30, lineHeight: 36 },
    { name: '4xl', size: 36, lineHeight: 40 }
  ];
}

/**
 * Get default component sizes
 */
export function getDefaultComponentSizes(): Record<string, number> {
  return {
    buttonSm: 32,
    buttonDefault: 36,
    buttonLg: 40,
    buttonIcon: 36,
    inputHeight: 36,
    avatarSm: 32,
    avatarDefault: 40,
    avatarLg: 64,
    avatarXl: 80,
    navHeight: 64,
    badgeHeight: 20,
    tabsHeight: 40
  };
}

// ============================================
// TOKEN CONVERSION
// ============================================

/**
 * Convert parsed tokens to Figma-ready format with light/dark mode colors
 */
export function prepareTokensForFigma(tokens: ParsedTokens): {
  lightColors: Record<string, { hex: string; rgb: RGB; desc?: string }>;
  darkColors: Record<string, { hex: string; rgb: RGB }>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  fontSize: Record<string, { size: number; lineHeight: number }>;
  componentSizes: Record<string, number>;
} {
  // Convert light colors
  const lightColors: Record<string, { hex: string; rgb: RGB; desc?: string }> = {};
  for (const [name, token] of Object.entries(tokens.colors.light)) {
    lightColors[name] = {
      hex: rgbToHex(token.rgb),
      rgb: token.rgb,
      desc: getColorDescription(name)
    };
  }

  // Convert dark colors
  const darkColors: Record<string, { hex: string; rgb: RGB }> = {};
  for (const [name, token] of Object.entries(tokens.colors.dark)) {
    darkColors[name] = {
      hex: rgbToHex(token.rgb),
      rgb: token.rgb
    };
  }

  // Convert spacing to object
  const spacing: Record<string, number> = {};
  for (const token of tokens.spacing) {
    spacing[token.name] = token.value;
  }

  // Convert radius to object
  const radius: Record<string, number> = {};
  for (const token of tokens.radius) {
    radius[token.name] = token.value;
  }

  // Convert font sizes to object
  const fontSize: Record<string, { size: number; lineHeight: number }> = {};
  for (const token of tokens.fontSize) {
    fontSize[token.name] = { size: token.size, lineHeight: token.lineHeight };
  }

  return {
    lightColors,
    darkColors,
    spacing,
    radius,
    fontSize,
    componentSizes: tokens.componentSizes
  };
}

/**
 * Convert RGB (0-1) to hex string
 */
function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(rgb.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(rgb.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Get description for color token
 */
function getColorDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'background': 'Main background',
    'foreground': 'Main text color',
    'card': 'Card background',
    'card-foreground': 'Card text',
    'popover': 'Popover background',
    'popover-foreground': 'Popover text',
    'primary': 'Primary buttons/actions',
    'primary-foreground': 'Text on primary',
    'secondary': 'Secondary actions',
    'secondary-foreground': 'Text on secondary',
    'muted': 'Muted backgrounds',
    'muted-foreground': 'Muted/secondary text',
    'accent': 'Hover states',
    'accent-foreground': 'Accent text',
    'destructive': 'Error/delete actions',
    'border': 'Border color',
    'input': 'Input border',
    'ring': 'Focus ring',
    'chart-1': 'Chart color 1',
    'chart-2': 'Chart color 2',
    'chart-3': 'Chart color 3',
    'chart-4': 'Chart color 4',
    'chart-5': 'Chart color 5',
    'sidebar': 'Sidebar background',
    'sidebar-foreground': 'Sidebar text',
    'sidebar-primary': 'Sidebar primary',
    'sidebar-primary-foreground': 'Sidebar primary text',
    'sidebar-accent': 'Sidebar hover',
    'sidebar-accent-foreground': 'Sidebar hover text',
    'sidebar-border': 'Sidebar border',
    'sidebar-ring': 'Sidebar focus ring'
  };
  return descriptions[name] || '';
}

// ============================================
// FORMAT DETECTION
// ============================================

/**
 * Detect the token format from content
 *
 * @param content Token file content
 * @param filePath Optional file path for extension-based detection
 * @returns Detected token format
 */
export function detectTokenFormat(content: string, filePath?: string): TokenFormat {
  // Check file extension first
  if (filePath) {
    if (filePath.endsWith('.json')) {
      return 'style-dictionary';
    }
    if (filePath.endsWith('.css') || filePath.endsWith('.scss') || filePath.endsWith('.sass')) {
      return 'css';
    }
  }

  // Try to detect from content
  const trimmed = content.trim();

  // JSON detection
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(content);
      return 'style-dictionary';
    } catch {
      // Not valid JSON, fall through
    }
  }

  // CSS detection (has CSS custom property patterns)
  if (/--[\w-]+\s*:\s*[^;]+;/.test(content) || /:root\s*\{/.test(content)) {
    return 'css';
  }

  // Default to CSS for backward compatibility
  return 'css';
}

// ============================================
// FULL TOKEN EXTRACTION
// ============================================

/**
 * Extract all tokens from content and merge with defaults
 *
 * @param content Token file content
 * @param format Token format (auto-detected if not provided)
 * @param filePath Optional file path for format detection
 * @returns Parsed tokens
 */
export function extractAllTokens(
  content: string,
  format?: TokenFormat,
  filePath?: string
): ParsedTokens {
  // Detect format if not provided
  const tokenFormat = format || detectTokenFormat(content, filePath);

  // Parse based on format
  let parsed: ParsedTokens;

  if (tokenFormat === 'style-dictionary') {
    parsed = parseStyleDictionaryTokens(content);
  } else {
    parsed = parseCssTokens(content);
  }

  // Add default spacing if not found
  if (parsed.spacing.length === 0) {
    parsed.spacing = getDefaultSpacing();
  }

  // Add default radius if not found
  if (parsed.radius.length === 0) {
    parsed.radius = getDefaultBorderRadius();
  }

  // Add default font sizes
  if (parsed.fontSize.length === 0) {
    parsed.fontSize = getDefaultFontSizes();
  }

  // Add component sizes
  parsed.componentSizes = getDefaultComponentSizes();

  return parsed;
}

/**
 * Parse tokens from content (legacy function for backward compatibility)
 *
 * @param cssContent Token file content (CSS or JSON)
 * @returns Parsed tokens
 * @deprecated Use extractAllTokens with format parameter instead
 */
export function parseTokens(cssContent: string): ParsedTokens {
  return extractAllTokens(cssContent);
}
