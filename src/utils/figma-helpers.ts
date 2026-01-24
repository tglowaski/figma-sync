/**
 * Figma Helpers
 *
 * Shared utility functions for Figma API operations
 */

// ============================================
// COLOR UTILITIES
// ============================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

/**
 * Convert hex color to RGB (0-1 range)
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}

/**
 * Convert OKLCH to RGB
 * OKLCH: oklch(L C H) where L is lightness (0-1), C is chroma, H is hue (degrees)
 */
export function oklchToRgb(oklch: string): RGB | null {
  const match = oklch.match(/oklch\s*\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/);
  if (!match) return null;

  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);
  const alpha = match[4] ? (match[4].includes('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

  // Convert OKLCH to OKLab
  const a = C * Math.cos(H * Math.PI / 180);
  const b = C * Math.sin(H * Math.PI / 180);

  // OKLab to linear sRGB matrix
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // Linear sRGB to sRGB
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  // Clamp to 0-1
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  bl = Math.max(0, Math.min(1, bl));

  return { r, g, b: bl };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: r + m,
    g: g + m,
    b: b + m
  };
}

/**
 * Parse any CSS color to RGB
 */
export function parseCssColor(color: string): RGB | null {
  // Handle oklch
  if (color.startsWith('oklch')) {
    return oklchToRgb(color);
  }

  // Handle hex
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]) / 255,
      g: parseInt(rgbMatch[2]) / 255,
      b: parseInt(rgbMatch[3]) / 255
    };
  }

  // Handle hsl/hsla
  const hslMatch = color.match(/hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/);
  if (hslMatch) {
    return hslToRgb(
      parseFloat(hslMatch[1]),
      parseFloat(hslMatch[2]),
      parseFloat(hslMatch[3])
    );
  }

  return null;
}

// ============================================
// FRAME CREATION UTILITIES
// ============================================

/**
 * Create an auto-layout frame
 */
export function createAutoLayoutFrame(
  name: string,
  direction: 'HORIZONTAL' | 'VERTICAL' = 'HORIZONTAL',
  padding: number = 0,
  gap: number = 0
): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = direction;
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.paddingLeft = padding;
  frame.paddingRight = padding;
  frame.paddingTop = padding;
  frame.paddingBottom = padding;
  frame.itemSpacing = gap;
  frame.fills = [];
  return frame;
}

/**
 * Create a rectangle with fill
 */
export function createRect(
  width: number,
  height: number,
  fill: RGB,
  cornerRadius: number = 0
): RectangleNode {
  const rect = figma.createRectangle();
  rect.resize(width, height);
  rect.fills = [{ type: 'SOLID', color: fill }];
  rect.cornerRadius = cornerRadius;
  return rect;
}

/**
 * Create a text node
 */
export async function createText(
  content: string,
  size: number = 14,
  weight: string = 'Regular',
  color: RGB = { r: 0.09, g: 0.09, b: 0.09 }
): Promise<TextNode> {
  const text = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: weight });
  text.characters = content;
  text.fontSize = size;
  text.fontName = { family: 'Inter', style: weight };
  text.fills = [{ type: 'SOLID', color }];
  return text;
}

/**
 * Create text node synchronously (fonts must be pre-loaded)
 */
export function createTextSync(
  content: string,
  size: number = 14,
  weight: string = 'Regular',
  color: RGB = { r: 0.09, g: 0.09, b: 0.09 }
): TextNode {
  const text = figma.createText();
  text.characters = content;
  text.fontSize = size;
  text.fontName = { family: 'Inter', style: weight };
  text.fills = [{ type: 'SOLID', color }];
  return text;
}

/**
 * Set stroke on a node
 */
export function setStroke(node: GeometryMixin, color: RGB, weight: number = 1): void {
  node.strokes = [{ type: 'SOLID', color }];
  node.strokeWeight = weight;
}

/**
 * Set shadow effect on a node
 */
export function setShadow(node: BlendMixin, type: 'xs' | 'sm' | 'md' | 'lg' = 'sm'): void {
  const shadows: Record<string, DropShadowEffect[]> = {
    xs: [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.05 },
      offset: { x: 0, y: 1 },
      radius: 2,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL'
    }],
    sm: [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL'
    }],
    md: [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 4 },
      radius: 6,
      spread: -1,
      visible: true,
      blendMode: 'NORMAL'
    }],
    lg: [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 10 },
      radius: 15,
      spread: -3,
      visible: true,
      blendMode: 'NORMAL'
    }]
  };
  node.effects = shadows[type] || shadows.sm;
}

// ============================================
// FRAME MANAGEMENT UTILITIES
// ============================================

/**
 * Find existing frame by name or create new one
 */
export function findOrCreateFrame(
  name: string,
  width: number = 1440,
  height: number = 900,
  backgroundColor: RGB = { r: 1, g: 1, b: 1 }
): { frame: FrameNode; isNew: boolean } {
  // Search for existing frame with this exact name
  const existingFrames = figma.currentPage.findAll(
    node => node.type === 'FRAME' && node.name === name
  ) as FrameNode[];

  if (existingFrames.length > 0) {
    const frame = existingFrames[0];
    // Clear children
    while (frame.children.length > 0) {
      frame.children[0].remove();
    }
    // Reset frame properties
    frame.resize(width, height);
    frame.fills = [{ type: 'SOLID', color: backgroundColor }];
    return { frame, isNew: false };
  }

  // Create new frame
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(width, height);
  frame.fills = [{ type: 'SOLID', color: backgroundColor }];
  return { frame, isNew: true };
}

/**
 * Position frames in a grid layout
 */
export function positionInGrid(
  frames: FrameNode[],
  frameWidth: number,
  frameHeight: number,
  spacing: number = 100,
  columns: number = 3
): void {
  frames.forEach((frame, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    frame.x = col * (frameWidth + spacing);
    frame.y = row * (frameHeight + spacing);
  });
}

// ============================================
// COMPONENT CREATION UTILITIES
// ============================================

/**
 * Create a button component
 */
export function createButton(
  label: string,
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' = 'default',
  colors: {
    primary: RGB;
    primaryForeground: RGB;
    destructive: RGB;
    background: RGB;
    foreground: RGB;
    secondary: RGB;
    secondaryForeground: RGB;
    border: RGB;
  }
): FrameNode {
  const variantConfigs = {
    default: { bg: colors.primary, fg: colors.primaryForeground },
    destructive: { bg: colors.destructive, fg: { r: 1, g: 1, b: 1 } },
    outline: { bg: colors.background, fg: colors.foreground, border: colors.border },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground },
    ghost: { bg: colors.background, fg: colors.foreground }
  };

  const config = variantConfigs[variant];

  const btn = createAutoLayoutFrame('Button', 'HORIZONTAL', 0, 8);
  btn.paddingLeft = 16;
  btn.paddingRight = 16;
  btn.paddingTop = 10;
  btn.paddingBottom = 10;
  btn.cornerRadius = 8;
  btn.fills = [{ type: 'SOLID', color: config.bg }];
  if ('border' in config && config.border) {
    setStroke(btn, config.border);
  }
  btn.counterAxisAlignItems = 'CENTER';
  btn.primaryAxisAlignItems = 'CENTER';

  const text = createTextSync(label, 14, 'Medium', config.fg);
  btn.appendChild(text);

  return btn;
}

/**
 * Create an input field
 */
export function createInputField(
  label: string,
  placeholder: string,
  width: number,
  colors: {
    background: RGB;
    foreground: RGB;
    mutedForeground: RGB;
    input: RGB;
  }
): FrameNode {
  const field = createAutoLayoutFrame('Field', 'VERTICAL', 0, 6);
  if (width) field.resize(width, 64);

  const labelText = createTextSync(label, 14, 'Medium', colors.foreground);
  field.appendChild(labelText);

  const input = createAutoLayoutFrame('Input', 'HORIZONTAL', 0, 0);
  input.paddingLeft = 12;
  input.paddingRight = 12;
  input.paddingTop = 10;
  input.paddingBottom = 10;
  input.cornerRadius = 8;
  input.fills = [{ type: 'SOLID', color: colors.background }];
  setStroke(input, colors.input);
  if (width) input.resize(width, 40);

  const inputText = createTextSync(placeholder || 'Enter...', 14, 'Regular', colors.mutedForeground);
  input.appendChild(inputText);
  field.appendChild(input);

  return field;
}

/**
 * Create a card component
 */
export function createCard(
  title: string | null,
  width: number,
  height: number,
  colors: {
    card: RGB;
    border: RGB;
    foreground: RGB;
  }
): FrameNode {
  const card = createAutoLayoutFrame('Card', 'VERTICAL', 24, 16);
  card.cornerRadius = 12;
  card.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(card, colors.border);
  setShadow(card, 'sm');
  if (width) card.resize(width, height || 200);

  if (title) {
    const cardTitle = createTextSync(title, 16, 'Semi Bold', colors.foreground);
    card.appendChild(cardTitle);
  }
  return card;
}

/**
 * Create tabs component
 */
export function createTabs(
  tabNames: string[],
  activeIndex: number,
  colors: {
    muted: RGB;
    background: RGB;
    foreground: RGB;
    mutedForeground: RGB;
  }
): FrameNode {
  const tabList = createAutoLayoutFrame('TabsList', 'HORIZONTAL', 4, 4);
  tabList.cornerRadius = 8;
  tabList.fills = [{ type: 'SOLID', color: colors.muted }];

  tabNames.forEach((name, i) => {
    const tab = createAutoLayoutFrame('Tab', 'HORIZONTAL', 0, 0);
    tab.paddingLeft = 16;
    tab.paddingRight = 16;
    tab.paddingTop = 8;
    tab.paddingBottom = 8;
    tab.cornerRadius = 6;
    if (i === activeIndex) {
      tab.fills = [{ type: 'SOLID', color: colors.background }];
      setShadow(tab, 'xs');
    } else {
      tab.fills = [];
    }
    const text = createTextSync(name, 14, 'Medium', i === activeIndex ? colors.foreground : colors.mutedForeground);
    tab.appendChild(text);
    tabList.appendChild(tab);
  });

  return tabList;
}

/**
 * Create a table component
 */
export function createTable(
  headers: string[],
  rows: string[][],
  width: number,
  colors: {
    background: RGB;
    border: RGB;
    muted: RGB;
    foreground: RGB;
    mutedForeground: RGB;
  }
): FrameNode {
  const table = createAutoLayoutFrame('Table', 'VERTICAL', 0, 0);
  table.fills = [{ type: 'SOLID', color: colors.background }];
  setStroke(table, colors.border);
  table.cornerRadius = 8;
  table.clipsContent = true;
  if (width) table.resize(width, 50 + rows.length * 48);

  // Header
  const headerRow = createAutoLayoutFrame('TableHeader', 'HORIZONTAL', 0, 0);
  headerRow.fills = [{ type: 'SOLID', color: colors.muted }];
  headerRow.resize(width, 44);
  headerRow.counterAxisAlignItems = 'CENTER';

  const colWidth = Math.floor((width - 32) / headers.length);
  headers.forEach(h => {
    const cell = createAutoLayoutFrame('HeaderCell', 'HORIZONTAL', 0, 0);
    cell.paddingLeft = 16;
    cell.resize(colWidth, 44);
    cell.counterAxisAlignItems = 'CENTER';
    const text = createTextSync(h, 12, 'Medium', colors.mutedForeground);
    cell.appendChild(text);
    headerRow.appendChild(cell);
  });
  table.appendChild(headerRow);

  // Rows
  rows.forEach((rowData, rowIndex) => {
    const row = createAutoLayoutFrame('TableRow', 'HORIZONTAL', 0, 0);
    row.resize(width, 48);
    row.counterAxisAlignItems = 'CENTER';
    if (rowIndex < rows.length - 1) {
      row.strokes = [{ type: 'SOLID', color: colors.border }];
      row.strokeBottomWeight = 1;
      row.strokeTopWeight = 0;
      row.strokeLeftWeight = 0;
      row.strokeRightWeight = 0;
    }

    rowData.forEach(cellData => {
      const cell = createAutoLayoutFrame('Cell', 'HORIZONTAL', 0, 0);
      cell.paddingLeft = 16;
      cell.resize(colWidth, 48);
      cell.counterAxisAlignItems = 'CENTER';
      const text = createTextSync(cellData, 14, 'Regular', colors.foreground);
      cell.appendChild(text);
      row.appendChild(cell);
    });
    table.appendChild(row);
  });

  return table;
}

/**
 * Create a metric card component
 */
export function createMetricCard(
  title: string,
  value: string,
  subtitle: string | null,
  colors: {
    card: RGB;
    border: RGB;
    foreground: RGB;
    mutedForeground: RGB;
  }
): FrameNode {
  const card = createAutoLayoutFrame('MetricCard', 'VERTICAL', 20, 8);
  card.cornerRadius = 12;
  card.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(card, colors.border);
  card.resize(250, 120);

  const titleText = createTextSync(title, 14, 'Medium', colors.mutedForeground);
  card.appendChild(titleText);

  const valueText = createTextSync(value, 28, 'Bold', colors.foreground);
  card.appendChild(valueText);

  if (subtitle) {
    const subText = createTextSync(subtitle, 12, 'Regular', colors.mutedForeground);
    card.appendChild(subText);
  }

  return card;
}

// ============================================
// FONT LOADING UTILITIES
// ============================================

/**
 * Load all required fonts
 */
export async function loadFonts(): Promise<void> {
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' })
  ]);
}

// ============================================
// VARIABLE CREATION UTILITIES
// ============================================

/**
 * Create a variable collection
 */
export function createVariableCollection(name: string): VariableCollection {
  return figma.variables.createVariableCollection(name);
}

/**
 * Create a color variable with light/dark modes
 */
export function createColorVariable(
  collection: VariableCollection,
  name: string,
  lightValue: RGB,
  darkValue: RGB,
  lightModeId: string,
  darkModeId: string
): Variable {
  const variable = figma.variables.createVariable(name, collection, 'COLOR');
  variable.setValueForMode(lightModeId, lightValue);
  variable.setValueForMode(darkModeId, darkValue);
  return variable;
}

/**
 * Create a number variable
 */
export function createNumberVariable(
  collection: VariableCollection,
  name: string,
  value: number,
  modeId: string
): Variable {
  const variable = figma.variables.createVariable(name, collection, 'FLOAT');
  variable.setValueForMode(modeId, value);
  return variable;
}

// ============================================
// TEXT STYLE UTILITIES
// ============================================

export interface TextStyleConfig {
  name: string;
  size: number;
  weight: string;
  lineHeight: number;
}

/**
 * Create a text style
 */
export async function createTextStyle(config: TextStyleConfig): Promise<TextStyle> {
  await figma.loadFontAsync({ family: 'Inter', style: config.weight });

  const style = figma.createTextStyle();
  style.name = config.name;
  style.fontSize = config.size;
  style.lineHeight = { value: config.lineHeight, unit: 'PIXELS' };
  style.fontName = { family: 'Inter', style: config.weight };

  return style;
}

// ============================================
// EFFECT STYLE UTILITIES
// ============================================

export interface ShadowConfig {
  name: string;
  color: RGBA;
  offset: { x: number; y: number };
  radius: number;
  spread: number;
}

/**
 * Create an effect style (shadow)
 */
export function createEffectStyle(config: ShadowConfig): EffectStyle {
  const style = figma.createEffectStyle();
  style.name = config.name;
  style.effects = [{
    type: 'DROP_SHADOW',
    color: config.color,
    offset: config.offset,
    radius: config.radius,
    spread: config.spread,
    visible: true,
    blendMode: 'NORMAL'
  }];
  return style;
}
