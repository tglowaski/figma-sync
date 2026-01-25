/**
 * Style Dictionary Parser
 *
 * Parses Style Dictionary JSON format tokens and converts them
 * to the plugin's internal ParsedTokens format.
 *
 * Style Dictionary is a build system for creating cross-platform
 * design tokens. It uses a JSON format with nested token structures.
 *
 * @see https://amzn.github.io/style-dictionary/
 */

import { parseCssColor, RGB } from '../utils/figma-helpers';
import type {
  ParsedTokens,
  ColorToken,
  SpacingToken,
  RadiusToken,
  FontSizeToken
} from './token-parser';

/**
 * Style Dictionary token value structure
 */
interface SDTokenValue {
  value: string | number;
  type?: string;
  description?: string;
  $value?: string | number;  // DTCG format
  $type?: string;            // DTCG format
  $description?: string;     // DTCG format
}

/**
 * Style Dictionary token group
 */
type SDTokenGroup = {
  [key: string]: SDTokenValue | SDTokenGroup;
};

/**
 * Style Dictionary root structure
 */
interface StyleDictionaryTokens {
  color?: SDTokenGroup;
  colors?: SDTokenGroup;
  spacing?: SDTokenGroup;
  space?: SDTokenGroup;
  borderRadius?: SDTokenGroup;
  radii?: SDTokenGroup;
  radius?: SDTokenGroup;
  fontSize?: SDTokenGroup;
  fontSizes?: SDTokenGroup;
  typography?: SDTokenGroup;
  [key: string]: SDTokenGroup | undefined;
}

/**
 * Parsed token with path information
 */
interface FlattenedToken {
  path: string[];
  name: string;
  value: string | number;
  type?: string;
  description?: string;
}

/**
 * Parse Style Dictionary JSON format tokens
 *
 * @param jsonContent JSON string content
 * @returns Parsed tokens in plugin format
 */
export function parseStyleDictionaryTokens(jsonContent: string): ParsedTokens {
  const result: ParsedTokens = {
    colors: { light: {}, dark: {} },
    spacing: [],
    radius: [],
    fontSize: [],
    componentSizes: {}
  };

  let tokens: StyleDictionaryTokens;
  try {
    tokens = JSON.parse(jsonContent);
  } catch (e) {
    console.warn('Failed to parse Style Dictionary JSON:', e);
    return result;
  }

  // Parse colors
  const colorTokens = tokens.color || tokens.colors;
  if (colorTokens) {
    parseSDColors(colorTokens, result.colors, []);
  }

  // Parse spacing
  const spacingTokens = tokens.spacing || tokens.space;
  if (spacingTokens) {
    result.spacing = parseSDSpacing(spacingTokens, []);
  }

  // Parse border radius
  const radiusTokens = tokens.borderRadius || tokens.radii || tokens.radius;
  if (radiusTokens) {
    result.radius = parseSDRadius(radiusTokens, []);
  }

  // Parse font sizes
  const fontTokens = tokens.fontSize || tokens.fontSizes || tokens.typography;
  if (fontTokens) {
    result.fontSize = parseSDFontSizes(fontTokens, []);
  }

  return result;
}

/**
 * Parse color tokens from Style Dictionary format
 */
function parseSDColors(
  group: SDTokenGroup,
  colors: { light: Record<string, ColorToken>; dark: Record<string, ColorToken> },
  path: string[]
): void {
  for (const [key, value] of Object.entries(group)) {
    const currentPath = [...path, key];

    if (isTokenValue(value)) {
      const tokenValue = getTokenValue(value);
      const tokenName = currentPath.join('-');

      // Check if this is a dark mode token
      const isDark = currentPath.some(p =>
        p.toLowerCase() === 'dark' ||
        p.toLowerCase().includes('dark-mode')
      );

      const rgb = parseCssColor(String(tokenValue));
      if (rgb) {
        const token: ColorToken = {
          name: tokenName,
          value: String(tokenValue),
          rgb,
          description: getTokenDescription(value)
        };

        // Remove 'dark' from name for dark mode tokens
        const cleanName = isDark
          ? tokenName.replace(/-?dark-?/gi, '-').replace(/^-|-$/g, '')
          : tokenName;

        if (isDark) {
          colors.dark[cleanName] = token;
        } else {
          colors.light[cleanName] = token;
        }
      }
    } else {
      // Recurse into nested group
      parseSDColors(value as SDTokenGroup, colors, currentPath);
    }
  }
}

/**
 * Parse spacing tokens from Style Dictionary format
 */
function parseSDSpacing(group: SDTokenGroup, path: string[]): SpacingToken[] {
  const tokens: SpacingToken[] = [];

  for (const [key, value] of Object.entries(group)) {
    const currentPath = [...path, key];

    if (isTokenValue(value)) {
      const tokenValue = getTokenValue(value);
      const numValue = parseNumericValue(tokenValue);

      tokens.push({
        name: currentPath.join('-'),
        value: numValue
      });
    } else {
      // Recurse into nested group
      tokens.push(...parseSDSpacing(value as SDTokenGroup, currentPath));
    }
  }

  return tokens;
}

/**
 * Parse radius tokens from Style Dictionary format
 */
function parseSDRadius(group: SDTokenGroup, path: string[]): RadiusToken[] {
  const tokens: RadiusToken[] = [];

  for (const [key, value] of Object.entries(group)) {
    const currentPath = [...path, key];

    if (isTokenValue(value)) {
      const tokenValue = getTokenValue(value);
      const numValue = parseNumericValue(tokenValue);

      tokens.push({
        name: currentPath.join('-'),
        value: numValue
      });
    } else {
      // Recurse into nested group
      tokens.push(...parseSDRadius(value as SDTokenGroup, currentPath));
    }
  }

  return tokens;
}

/**
 * Parse font size tokens from Style Dictionary format
 */
function parseSDFontSizes(group: SDTokenGroup, path: string[]): FontSizeToken[] {
  const tokens: FontSizeToken[] = [];

  for (const [key, value] of Object.entries(group)) {
    const currentPath = [...path, key];

    if (isTokenValue(value)) {
      const tokenValue = getTokenValue(value);
      const numValue = parseNumericValue(tokenValue);

      // Default line height to 1.5x font size
      tokens.push({
        name: currentPath.join('-'),
        size: numValue,
        lineHeight: Math.round(numValue * 1.5)
      });
    } else {
      // Check for typography tokens with size and lineHeight
      const typographyValue = value as Record<string, SDTokenValue | SDTokenGroup>;
      if (typographyValue.fontSize || typographyValue.size) {
        const sizeToken = typographyValue.fontSize || typographyValue.size;
        const lineHeightToken = typographyValue.lineHeight;

        if (isTokenValue(sizeToken)) {
          const size = parseNumericValue(getTokenValue(sizeToken));
          const lineHeight = lineHeightToken && isTokenValue(lineHeightToken)
            ? parseNumericValue(getTokenValue(lineHeightToken))
            : Math.round(size * 1.5);

          tokens.push({
            name: currentPath.join('-'),
            size,
            lineHeight
          });
        }
      } else {
        // Recurse into nested group
        tokens.push(...parseSDFontSizes(value as SDTokenGroup, currentPath));
      }
    }
  }

  return tokens;
}

/**
 * Check if value is a token value (has value or $value property)
 */
function isTokenValue(value: SDTokenValue | SDTokenGroup): value is SDTokenValue {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return 'value' in value || '$value' in value;
}

/**
 * Get the actual value from a token (handles both SD and DTCG formats)
 */
function getTokenValue(token: SDTokenValue): string | number {
  return token.$value ?? token.value;
}

/**
 * Get description from a token
 */
function getTokenDescription(token: SDTokenValue): string | undefined {
  return token.$description ?? token.description;
}

/**
 * Parse a value to a number (handles rem, px, and plain numbers)
 */
function parseNumericValue(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }

  const str = String(value).trim().toLowerCase();

  // Handle rem values
  if (str.endsWith('rem')) {
    return parseFloat(str) * 16;
  }

  // Handle em values
  if (str.endsWith('em')) {
    return parseFloat(str) * 16;
  }

  // Handle px values
  if (str.endsWith('px')) {
    return parseFloat(str);
  }

  // Handle percentage
  if (str.endsWith('%')) {
    return parseFloat(str);
  }

  // Plain number
  return parseFloat(str) || 0;
}

/**
 * Flatten nested Style Dictionary tokens to a flat structure
 */
export function flattenTokens(tokens: SDTokenGroup, basePath: string[] = []): FlattenedToken[] {
  const result: FlattenedToken[] = [];

  for (const [key, value] of Object.entries(tokens)) {
    const currentPath = [...basePath, key];

    if (isTokenValue(value)) {
      result.push({
        path: currentPath,
        name: currentPath.join('.'),
        value: getTokenValue(value),
        type: value.$type ?? value.type,
        description: getTokenDescription(value)
      });
    } else {
      result.push(...flattenTokens(value as SDTokenGroup, currentPath));
    }
  }

  return result;
}

/**
 * Convert Style Dictionary tokens to CSS custom properties
 */
export function styleDictionaryToCss(tokens: StyleDictionaryTokens): string {
  const lines: string[] = [':root {'];

  const flattened = flattenTokens(tokens as SDTokenGroup);

  for (const token of flattened) {
    const cssName = `--${token.path.join('-')}`;
    lines.push(`  ${cssName}: ${token.value};`);
  }

  lines.push('}');
  return lines.join('\n');
}
