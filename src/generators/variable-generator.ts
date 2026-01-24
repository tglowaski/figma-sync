/**
 * Variable Generator
 *
 * Creates Figma variables, text styles, and effect styles from parsed tokens
 */

import { RGB } from '../utils/figma-helpers';
import {
  ParsedTokens,
  getDefaultSpacing,
  getDefaultBorderRadius,
  getDefaultFontSizes,
  getDefaultComponentSizes
} from '../parsers/token-parser';

// ============================================
// TYPES
// ============================================

export interface GeneratedVariables {
  colorCollection: VariableCollection;
  spacingCollection: VariableCollection;
  radiusCollection: VariableCollection;
  typographyCollection: VariableCollection;
  componentCollection: VariableCollection;
  textStyles: TextStyle[];
  effectStyles: EffectStyle[];
}

// ============================================
// VARIABLE COLLECTION GENERATORS
// ============================================

/**
 * Create color variable collection with light/dark modes
 */
export function createColorCollection(
  lightColors: Record<string, { hex: string; rgb: RGB; desc?: string }>,
  darkColors: Record<string, { hex: string; rgb: RGB }>,
  prefix: string = 'DealApp'
): VariableCollection {
  const collection = figma.variables.createVariableCollection(`${prefix} Colors`);
  const lightModeId = collection.modes[0].modeId;
  collection.renameMode(lightModeId, 'Light');
  const darkModeId = collection.addMode('Dark');

  for (const [name, lightData] of Object.entries(lightColors)) {
    const variable = figma.variables.createVariable(name, collection, 'COLOR');
    if (lightData.desc) {
      variable.description = lightData.desc;
    }
    variable.setValueForMode(lightModeId, lightData.rgb);

    // Use dark color if available, otherwise use light
    const darkData = darkColors[name];
    variable.setValueForMode(darkModeId, darkData ? darkData.rgb : lightData.rgb);
  }

  return collection;
}

/**
 * Create spacing variable collection
 */
export function createSpacingCollection(
  spacing: Record<string, number>,
  prefix: string = 'DealApp'
): VariableCollection {
  const collection = figma.variables.createVariableCollection(`${prefix} Spacing`);
  const modeId = collection.modes[0].modeId;

  for (const [name, value] of Object.entries(spacing)) {
    const variableName = `space${name.replace('.', '_')}`;
    const variable = figma.variables.createVariable(variableName, collection, 'FLOAT');
    variable.setValueForMode(modeId, value);
  }

  return collection;
}

/**
 * Create border radius variable collection
 */
export function createRadiusCollection(
  radius: Record<string, number>,
  prefix: string = 'DealApp'
): VariableCollection {
  const collection = figma.variables.createVariableCollection(`${prefix} Radius`);
  const modeId = collection.modes[0].modeId;

  for (const [name, value] of Object.entries(radius)) {
    const variableName = `radius${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const variable = figma.variables.createVariable(variableName, collection, 'FLOAT');
    variable.setValueForMode(modeId, value);
  }

  return collection;
}

/**
 * Create typography variable collection
 */
export function createTypographyCollection(
  fontSize: Record<string, { size: number; lineHeight: number }>,
  prefix: string = 'DealApp'
): VariableCollection {
  const collection = figma.variables.createVariableCollection(`${prefix} Typography`);
  const modeId = collection.modes[0].modeId;

  for (const [name, data] of Object.entries(fontSize)) {
    const sizeName = `fontSize${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const sizeVar = figma.variables.createVariable(sizeName, collection, 'FLOAT');
    sizeVar.setValueForMode(modeId, data.size);

    const lineHeightName = `lineHeight${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const lineHeightVar = figma.variables.createVariable(lineHeightName, collection, 'FLOAT');
    lineHeightVar.setValueForMode(modeId, data.lineHeight);
  }

  return collection;
}

/**
 * Create component sizes variable collection
 */
export function createComponentCollection(
  componentSizes: Record<string, number>,
  prefix: string = 'DealApp'
): VariableCollection {
  const collection = figma.variables.createVariableCollection(`${prefix} Components`);
  const modeId = collection.modes[0].modeId;

  for (const [name, value] of Object.entries(componentSizes)) {
    const variable = figma.variables.createVariable(name, collection, 'FLOAT');
    variable.setValueForMode(modeId, value);
  }

  return collection;
}

// ============================================
// TEXT STYLE GENERATORS
// ============================================

interface TextStyleConfig {
  name: string;
  size: number;
  weight: string;
  lineHeight: number;
}

/**
 * Create text styles
 */
export async function createTextStyles(prefix: string = 'DealApp'): Promise<TextStyle[]> {
  // Load required fonts
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' })
  ]);

  const styles: TextStyleConfig[] = [
    { name: `${prefix}/Heading/H1`, size: 36, weight: 'Bold', lineHeight: 40 },
    { name: `${prefix}/Heading/H2`, size: 30, weight: 'Semi Bold', lineHeight: 36 },
    { name: `${prefix}/Heading/H3`, size: 24, weight: 'Semi Bold', lineHeight: 32 },
    { name: `${prefix}/Heading/H4`, size: 20, weight: 'Semi Bold', lineHeight: 28 },
    { name: `${prefix}/Body/Large`, size: 18, weight: 'Regular', lineHeight: 28 },
    { name: `${prefix}/Body/Default`, size: 16, weight: 'Regular', lineHeight: 24 },
    { name: `${prefix}/Body/Small`, size: 14, weight: 'Regular', lineHeight: 20 },
    { name: `${prefix}/Body/XSmall`, size: 12, weight: 'Regular', lineHeight: 16 },
    { name: `${prefix}/Label/Large`, size: 16, weight: 'Medium', lineHeight: 24 },
    { name: `${prefix}/Label/Default`, size: 14, weight: 'Medium', lineHeight: 20 },
    { name: `${prefix}/Label/Small`, size: 12, weight: 'Medium', lineHeight: 16 }
  ];

  const createdStyles: TextStyle[] = [];

  for (const config of styles) {
    const textStyle = figma.createTextStyle();
    textStyle.name = config.name;
    textStyle.fontSize = config.size;
    textStyle.lineHeight = { value: config.lineHeight, unit: 'PIXELS' };
    textStyle.fontName = { family: 'Inter', style: config.weight };
    createdStyles.push(textStyle);
  }

  return createdStyles;
}

// ============================================
// EFFECT STYLE GENERATORS
// ============================================

interface ShadowConfig {
  name: string;
  color: { r: number; g: number; b: number; a: number };
  offset: { x: number; y: number };
  radius: number;
  spread: number;
}

/**
 * Create effect styles (shadows)
 */
export function createEffectStyles(prefix: string = 'DealApp'): EffectStyle[] {
  const shadows: ShadowConfig[] = [
    {
      name: `${prefix}/Shadow/XS`,
      color: { r: 0, g: 0, b: 0, a: 0.05 },
      offset: { x: 0, y: 1 },
      radius: 2,
      spread: 0
    },
    {
      name: `${prefix}/Shadow/SM`,
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0
    },
    {
      name: `${prefix}/Shadow/MD`,
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 4 },
      radius: 6,
      spread: -1
    },
    {
      name: `${prefix}/Shadow/LG`,
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 10 },
      radius: 15,
      spread: -3
    }
  ];

  const createdStyles: EffectStyle[] = [];

  for (const config of shadows) {
    const effectStyle = figma.createEffectStyle();
    effectStyle.name = config.name;
    effectStyle.effects = [{
      type: 'DROP_SHADOW',
      color: config.color,
      offset: config.offset,
      radius: config.radius,
      spread: config.spread,
      visible: true,
      blendMode: 'NORMAL'
    }];
    createdStyles.push(effectStyle);
  }

  return createdStyles;
}

// ============================================
// MAIN GENERATOR FUNCTION
// ============================================

/**
 * Generate all variables and styles from parsed tokens
 */
export async function generateAllVariables(
  tokens: ParsedTokens,
  prefix: string = 'DealApp'
): Promise<GeneratedVariables> {
  // Prepare color data
  const lightColors: Record<string, { hex: string; rgb: RGB; desc?: string }> = {};
  const darkColors: Record<string, { hex: string; rgb: RGB }> = {};

  for (const [name, token] of Object.entries(tokens.colors.light)) {
    lightColors[name] = {
      hex: rgbToHex(token.rgb),
      rgb: token.rgb,
      desc: getColorDescription(name)
    };
  }

  for (const [name, token] of Object.entries(tokens.colors.dark)) {
    darkColors[name] = {
      hex: rgbToHex(token.rgb),
      rgb: token.rgb
    };
  }

  // Create collections
  const colorCollection = createColorCollection(lightColors, darkColors, prefix);

  // Use defaults for spacing if not provided
  const spacingData = tokens.spacing.length > 0
    ? Object.fromEntries(tokens.spacing.map(s => [s.name, s.value]))
    : Object.fromEntries(getDefaultSpacing().map(s => [s.name, s.value]));
  const spacingCollection = createSpacingCollection(spacingData, prefix);

  // Use defaults for radius if not provided
  const radiusData = tokens.radius.length > 0
    ? Object.fromEntries(tokens.radius.map(r => [r.name, r.value]))
    : Object.fromEntries(getDefaultBorderRadius().map(r => [r.name, r.value]));
  const radiusCollection = createRadiusCollection(radiusData, prefix);

  // Use defaults for font sizes if not provided
  const fontSizeData = tokens.fontSize.length > 0
    ? Object.fromEntries(tokens.fontSize.map(f => [f.name, { size: f.size, lineHeight: f.lineHeight }]))
    : Object.fromEntries(getDefaultFontSizes().map(f => [f.name, { size: f.size, lineHeight: f.lineHeight }]));
  const typographyCollection = createTypographyCollection(fontSizeData, prefix);

  // Component sizes
  const componentSizes = Object.keys(tokens.componentSizes).length > 0
    ? tokens.componentSizes
    : getDefaultComponentSizes();
  const componentCollection = createComponentCollection(componentSizes, prefix);

  // Create text and effect styles
  const textStyles = await createTextStyles(prefix);
  const effectStyles = createEffectStyles(prefix);

  return {
    colorCollection,
    spacingCollection,
    radiusCollection,
    typographyCollection,
    componentCollection,
    textStyles,
    effectStyles
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(rgb.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(rgb.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

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
