/**
 * Component Generator
 *
 * Creates Figma components from parsed React component definitions
 */

import { RGB } from '../utils/figma-helpers';
import {
  ParsedComponent,
  VariantCombination,
  generateVariantMatrix,
  getPredefinedComponents
} from '../parsers/component-parser';
import { getReferencedBaseComponents } from '../parsers/slds-base-components';

// ============================================
// TYPES
// ============================================

export interface ColorPalette {
  background: RGB;
  foreground: RGB;
  card: RGB;
  cardForeground: RGB;
  primary: RGB;
  primaryForeground: RGB;
  secondary: RGB;
  secondaryForeground: RGB;
  muted: RGB;
  mutedForeground: RGB;
  accent: RGB;
  accentForeground: RGB;
  destructive: RGB;
  destructiveForeground: RGB;
  border: RGB;
  input: RGB;
  ring: RGB;
}

export interface BrandingConfig {
  logoText: string;
  tagline?: string;
  description?: string;
}

export interface NavItem {
  label: string;
  path?: string;
}

export interface ComponentGeneratorConfig {
  colors: ColorPalette;
  radius: { sm: number; md: number; DEFAULT: number; lg: number; xl: number; full: number };
  prefix?: string;
  branding?: BrandingConfig;
  navItems?: NavItem[];
}

// ============================================
// DEFAULT COLORS
// ============================================

export const defaultColors: ColorPalette = {
  background: { r: 1, g: 1, b: 1 },
  foreground: { r: 0.09, g: 0.09, b: 0.09 },
  card: { r: 1, g: 1, b: 1 },
  cardForeground: { r: 0.09, g: 0.09, b: 0.09 },
  primary: { r: 0.15, g: 0.15, b: 0.15 },
  primaryForeground: { r: 0.98, g: 0.98, b: 0.98 },
  secondary: { r: 0.96, g: 0.96, b: 0.96 },
  secondaryForeground: { r: 0.15, g: 0.15, b: 0.15 },
  muted: { r: 0.96, g: 0.96, b: 0.96 },
  mutedForeground: { r: 0.45, g: 0.45, b: 0.45 },
  accent: { r: 0.96, g: 0.96, b: 0.96 },
  accentForeground: { r: 0.15, g: 0.15, b: 0.15 },
  destructive: { r: 0.86, g: 0.15, b: 0.15 },
  destructiveForeground: { r: 1, g: 1, b: 1 },
  border: { r: 0.90, g: 0.90, b: 0.90 },
  input: { r: 0.90, g: 0.90, b: 0.90 },
  ring: { r: 0.64, g: 0.64, b: 0.64 }
};

export const defaultRadius = {
  sm: 6,
  md: 8,
  DEFAULT: 10,
  lg: 10,
  xl: 14,
  full: 9999
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function createAutoLayoutFrame(
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

function createRect(width: number, height: number, fill: RGB, cornerRadius: number = 0): RectangleNode {
  const rect = figma.createRectangle();
  rect.resize(width, height);
  rect.fills = [{ type: 'SOLID', color: fill }];
  rect.cornerRadius = cornerRadius;
  return rect;
}

function createText(content: string, size: number, weight: string, color: RGB): TextNode {
  const text = figma.createText();
  text.characters = content;
  text.fontSize = size;
  text.fontName = { family: 'Inter', style: weight };
  text.fills = [{ type: 'SOLID', color }];
  return text;
}

function setStroke(node: GeometryMixin, color: RGB, weight: number = 1): void {
  node.strokes = [{ type: 'SOLID', color }];
  node.strokeWeight = weight;
}

function setShadow(node: BlendMixin, type: 'xs' | 'sm' | 'md' | 'lg' = 'sm'): void {
  const shadows: Record<string, DropShadowEffect[]> = {
    xs: [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.05 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: 'NORMAL' }],
    sm: [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 1 }, radius: 3, spread: 0, visible: true, blendMode: 'NORMAL' }],
    md: [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 6, spread: -1, visible: true, blendMode: 'NORMAL' }],
    lg: [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 10 }, radius: 15, spread: -3, visible: true, blendMode: 'NORMAL' }]
  };
  node.effects = shadows[type] || shadows.sm;
}

// ============================================
// COMPONENT GENERATORS
// ============================================

/**
 * Create a button component
 */
function createButtonComponent(
  variant: string,
  size: string,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const variantConfigs: Record<string, { bg: RGB; fg: RGB; border?: RGB }> = {
    default: { bg: colors.primary, fg: colors.primaryForeground },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground },
    outline: { bg: colors.background, fg: colors.foreground, border: colors.border },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground },
    ghost: { bg: colors.background, fg: colors.foreground },
    link: { bg: colors.background, fg: colors.primary }
  };

  const sizeConfigs: Record<string, { height: number; px: number; py: number; fontSize: number }> = {
    sm: { height: 32, px: 12, py: 6, fontSize: 13 },
    default: { height: 36, px: 16, py: 8, fontSize: 14 },
    lg: { height: 40, px: 24, py: 10, fontSize: 14 },
    icon: { height: 36, px: 9, py: 9, fontSize: 14 }
  };

  const config = variantConfigs[variant] || variantConfigs.default;
  const sizeConfig = sizeConfigs[size] || sizeConfigs.default;

  const btn = createAutoLayoutFrame(`Button/${variant}/${size}`, 'HORIZONTAL', 0, 8);
  btn.paddingLeft = sizeConfig.px;
  btn.paddingRight = sizeConfig.px;
  btn.paddingTop = sizeConfig.py;
  btn.paddingBottom = sizeConfig.py;
  btn.cornerRadius = radius.md;
  btn.fills = variant === 'link' ? [] : [{ type: 'SOLID', color: config.bg }];
  if (config.border) setStroke(btn, config.border);
  if (variant !== 'ghost' && variant !== 'link') setShadow(btn, 'xs');
  btn.counterAxisAlignItems = 'CENTER';
  btn.primaryAxisAlignItems = 'CENTER';

  const label = size === 'icon' ? '...' : capitalize(variant);
  const text = createText(label, sizeConfig.fontSize, 'Medium', config.fg);
  if (variant === 'link') {
    text.textDecoration = 'UNDERLINE';
  }
  btn.appendChild(text);

  return btn;
}

/**
 * Create an input component
 */
function createInputComponent(
  state: string,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const stateConfigs: Record<string, { border: RGB; opacity?: number }> = {
    default: { border: colors.input },
    focus: { border: colors.ring },
    error: { border: colors.destructive },
    disabled: { border: colors.input, opacity: 0.5 }
  };

  const config = stateConfigs[state] || stateConfigs.default;

  const input = createAutoLayoutFrame(`Input/${state}`, 'HORIZONTAL', 0, 0);
  input.paddingLeft = 12;
  input.paddingRight = 12;
  input.paddingTop = 8;
  input.paddingBottom = 8;
  input.resize(200, 36);
  input.cornerRadius = radius.md;
  input.fills = [{ type: 'SOLID', color: colors.background }];
  setStroke(input, config.border);
  setShadow(input, 'xs');
  if (config.opacity) input.opacity = config.opacity;

  const text = createText('Enter text...', 14, 'Regular', colors.mutedForeground);
  input.appendChild(text);

  return input;
}

/**
 * Create a badge component
 */
function createBadgeComponent(
  variant: string,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const variantConfigs: Record<string, { bg: RGB; fg: RGB; border?: RGB }> = {
    default: { bg: colors.primary, fg: colors.primaryForeground },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground },
    outline: { bg: colors.background, fg: colors.foreground, border: colors.border }
  };

  const config = variantConfigs[variant] || variantConfigs.default;

  const badge = createAutoLayoutFrame(`Badge/${variant}`, 'HORIZONTAL', 0, 4);
  badge.paddingLeft = 8;
  badge.paddingRight = 8;
  badge.paddingTop = 2;
  badge.paddingBottom = 2;
  badge.cornerRadius = radius.md;
  badge.fills = [{ type: 'SOLID', color: config.bg }];
  if (config.border) setStroke(badge, config.border);

  const text = createText(capitalize(variant), 12, 'Medium', config.fg);
  badge.appendChild(text);

  return badge;
}

/**
 * Create a card component
 */
function createCardComponent(
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const card = createAutoLayoutFrame('Card', 'VERTICAL', 24, 16);
  card.cornerRadius = radius.xl;
  card.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(card, colors.border);
  setShadow(card, 'sm');
  card.resize(320, 200);

  const header = createAutoLayoutFrame('CardHeader', 'VERTICAL', 0, 4);
  const title = createText('Card Title', 16, 'Semi Bold', colors.foreground);
  header.appendChild(title);
  const desc = createText('Card description', 14, 'Regular', colors.mutedForeground);
  header.appendChild(desc);
  card.appendChild(header);

  const content = createAutoLayoutFrame('CardContent', 'VERTICAL', 0, 8);
  const contentText = createText('Card content goes here.', 14, 'Regular', colors.foreground);
  content.appendChild(contentText);
  card.appendChild(content);

  return card;
}

/**
 * Create a checkbox component
 */
function createCheckboxComponent(
  state: string,
  colors: ColorPalette
): FrameNode {
  const isChecked = state === 'checked';

  const checkbox = createAutoLayoutFrame(`Checkbox/${state}`, 'HORIZONTAL', 0, 8);
  checkbox.counterAxisAlignItems = 'CENTER';

  const box = createRect(16, 16, isChecked ? colors.primary : colors.background, 4);
  setStroke(box, isChecked ? colors.primary : colors.input);
  checkbox.appendChild(box);

  const label = createText('Checkbox', 14, 'Regular', colors.foreground);
  checkbox.appendChild(label);

  return checkbox;
}

/**
 * Create a switch component
 */
function createSwitchComponent(
  state: string,
  colors: ColorPalette
): FrameNode {
  const isOn = state === 'on';

  const switchFrame = createAutoLayoutFrame(`Switch/${state}`, 'HORIZONTAL', 0, 8);
  switchFrame.counterAxisAlignItems = 'CENTER';

  const track = createRect(44, 24, isOn ? colors.primary : colors.input, 12);
  switchFrame.appendChild(track);

  const label = createText(isOn ? 'On' : 'Off', 14, 'Regular', colors.foreground);
  switchFrame.appendChild(label);

  return switchFrame;
}

/**
 * Create an avatar component
 */
function createAvatarComponent(
  size: string,
  colors: ColorPalette
): FrameNode {
  const sizes: Record<string, number> = {
    sm: 32,
    default: 40,
    lg: 64,
    xl: 80
  };

  const dimension = sizes[size] || sizes.default;
  const frame = createAutoLayoutFrame(`Avatar/${size}`, 'HORIZONTAL', 0, 0);
  frame.counterAxisAlignItems = 'CENTER';
  frame.primaryAxisAlignItems = 'CENTER';
  const avatar = createRect(dimension, dimension, colors.muted, 9999);
  frame.appendChild(avatar);

  return frame;
}

/**
 * Create an alert component
 */
function createAlertComponent(
  variant: string,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const variantConfigs: Record<string, { bg: RGB; fg: RGB }> = {
    default: { bg: colors.background, fg: colors.foreground },
    destructive: { bg: { r: 1, g: 0.95, b: 0.95 }, fg: colors.destructive }
  };

  const config = variantConfigs[variant] || variantConfigs.default;

  const alert = createAutoLayoutFrame(`Alert/${variant}`, 'HORIZONTAL', 16, 12);
  alert.cornerRadius = radius.lg;
  alert.fills = [{ type: 'SOLID', color: config.bg }];
  setStroke(alert, colors.border);
  alert.resize(400, 80);

  const content = createAutoLayoutFrame('AlertContent', 'VERTICAL', 0, 4);
  const title = createText('Alert Title', 14, 'Medium', config.fg);
  content.appendChild(title);
  const desc = createText('Alert description text.', 14, 'Regular', colors.mutedForeground);
  content.appendChild(desc);
  alert.appendChild(content);

  return alert;
}

/**
 * Create navigation bar component
 */
function createNavigationBarComponent(
  colors: ColorPalette,
  width: number = 1440,
  branding?: BrandingConfig,
  navItems?: NavItem[]
): FrameNode {
  const nav = createAutoLayoutFrame('NavigationBar', 'HORIZONTAL', 0, 0);
  nav.paddingLeft = 16;
  nav.paddingRight = 16;
  nav.fills = [{ type: 'SOLID', color: colors.background }];
  nav.strokes = [{ type: 'SOLID', color: colors.border }];
  nav.strokeBottomWeight = 1;
  nav.strokeTopWeight = 0;
  nav.strokeLeftWeight = 0;
  nav.strokeRightWeight = 0;
  nav.resize(width, 64);
  nav.primaryAxisAlignItems = 'SPACE_BETWEEN';
  nav.counterAxisAlignItems = 'CENTER';

  // Logo - use branding config or default
  const logoTextValue = branding?.logoText || 'App';
  const logo = createAutoLayoutFrame('Logo', 'HORIZONTAL', 0, 8);
  logo.counterAxisAlignItems = 'CENTER';
  const logoIcon = createRect(32, 32, colors.primary, 6);
  logo.appendChild(logoIcon);
  const logoText = createText(logoTextValue, 18, 'Bold', colors.foreground);
  logo.appendChild(logoText);
  nav.appendChild(logo);

  // Nav Links - use navItems config or defaults
  const links = createAutoLayoutFrame('NavLinks', 'HORIZONTAL', 0, 24);
  links.counterAxisAlignItems = 'CENTER';
  const defaultNavItems = ['Dashboard', 'Projects', 'Settings'];
  const items = navItems?.map(item => item.label) || defaultNavItems;
  items.forEach((item, i) => {
    const link = createText(item, 14, 'Medium', i === 0 ? colors.foreground : colors.mutedForeground);
    links.appendChild(link);
  });
  nav.appendChild(links);

  // Avatar
  const avatar = createRect(36, 36, colors.muted, 18);
  nav.appendChild(avatar);

  return nav;
}

// ============================================
// MAIN GENERATOR
// ============================================

/**
 * Generate all UI components
 */
export async function generateAllComponents(config: ComponentGeneratorConfig): Promise<ComponentNode[]> {
  const { colors, radius, branding, navItems } = config;
  const components: ComponentNode[] = [];
  let x = 0;
  let y = 0;

  // Load fonts
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' })
  ]);

  // Button variants
  const buttonVariants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
  const buttonSizes = ['sm', 'default', 'lg', 'icon'];

  for (const variant of buttonVariants) {
    for (const size of buttonSizes) {
      const btn = createButtonComponent(variant, size, colors, radius);
      btn.x = x;
      btn.y = y;
      x += 150;
      const component = figma.createComponentFromNode(btn);
      components.push(component);
    }
    y += 60;
    x = 0;
  }

  // Input states
  const inputStates = ['default', 'focus', 'error', 'disabled'];
  for (const state of inputStates) {
    const input = createInputComponent(state, colors, radius);
    input.x = x;
    input.y = y;
    x += 220;
    const component = figma.createComponentFromNode(input);
    components.push(component);
  }
  y += 60;
  x = 0;

  // Badges
  const badgeVariants = ['default', 'secondary', 'destructive', 'outline'];
  for (const variant of badgeVariants) {
    const badge = createBadgeComponent(variant, colors, radius);
    badge.x = x;
    badge.y = y;
    x += 120;
    const component = figma.createComponentFromNode(badge);
    components.push(component);
  }
  y += 50;
  x = 0;

  // Card
  const card = createCardComponent(colors, radius);
  card.x = x;
  card.y = y;
  const cardComponent = figma.createComponentFromNode(card);
  components.push(cardComponent);
  y += 220;
  x = 0;

  // Checkbox
  for (const state of ['unchecked', 'checked']) {
    const checkbox = createCheckboxComponent(state, colors);
    checkbox.x = x;
    checkbox.y = y;
    x += 150;
    const component = figma.createComponentFromNode(checkbox);
    components.push(component);
  }

  // Switch
  for (const state of ['off', 'on']) {
    const switchComp = createSwitchComponent(state, colors);
    switchComp.x = x;
    switchComp.y = y;
    x += 100;
    const component = figma.createComponentFromNode(switchComp);
    components.push(component);
  }
  y += 50;
  x = 0;

  // Avatar sizes
  for (const size of ['sm', 'default', 'lg', 'xl']) {
    const avatar = createAvatarComponent(size, colors);
    avatar.x = x;
    avatar.y = y;
    const sizes: Record<string, number> = { sm: 32, default: 40, lg: 64, xl: 80 };
    x += sizes[size] + 20;
    const component = figma.createComponentFromNode(avatar);
    components.push(component);
  }
  y += 100;
  x = 0;

  // Alert variants
  for (const variant of ['default', 'destructive']) {
    const alert = createAlertComponent(variant, colors, radius);
    alert.x = x;
    alert.y = y;
    x += 420;
    const component = figma.createComponentFromNode(alert);
    components.push(component);
  }
  y += 100;
  x = 0;

  // Navigation Bar
  const nav = createNavigationBarComponent(colors, 1440, branding, navItems);
  nav.x = x;
  nav.y = y;
  const navComponent = figma.createComponentFromNode(nav);
  components.push(navComponent);

  return components;
}

// ============================================
// SLDS DEFAULTS
// ============================================

/**
 * Salesforce Lightning Design System default color palette
 */
export const sldsDefaultColors: ColorPalette = {
  background: { r: 1, g: 1, b: 1 },
  foreground: { r: 0.094, g: 0.094, b: 0.094 },       // #181818
  card: { r: 1, g: 1, b: 1 },
  cardForeground: { r: 0.094, g: 0.094, b: 0.094 },
  primary: { r: 0.004, g: 0.463, b: 0.827 },           // #0176D3
  primaryForeground: { r: 1, g: 1, b: 1 },
  secondary: { r: 0.455, g: 0.455, b: 0.455 },         // #747474
  secondaryForeground: { r: 1, g: 1, b: 1 },
  muted: { r: 0.953, g: 0.953, b: 0.953 },             // #F3F3F3
  mutedForeground: { r: 0.455, g: 0.455, b: 0.455 },   // #747474
  accent: { r: 0.18, g: 0.518, b: 0.29 },              // #2E844A
  accentForeground: { r: 1, g: 1, b: 1 },
  destructive: { r: 0.918, g: 0, b: 0.118 },           // #EA001E
  destructiveForeground: { r: 1, g: 1, b: 1 },
  border: { r: 0.788, g: 0.788, b: 0.788 },            // #C9C9C9
  input: { r: 0.788, g: 0.788, b: 0.788 },
  ring: { r: 0.004, g: 0.463, b: 0.827 }               // #0176D3
};

export const sldsDefaultRadius = {
  sm: 2,
  md: 4,
  DEFAULT: 4,
  lg: 6,
  xl: 8,
  full: 9999
};

// ============================================
// SLDS COMPONENT CREATORS
// ============================================

/**
 * Create an SLDS-style button component
 */
function createSldsButtonComponent(
  variant: string,
  size: string,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const variantConfigs: Record<string, { bg: RGB; fg: RGB; border?: RGB }> = {
    neutral: { bg: colors.background, fg: colors.foreground, border: colors.border },
    brand: { bg: colors.primary, fg: colors.primaryForeground },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground },
    inverse: { bg: { r: 0, g: 0, b: 0 }, fg: { r: 1, g: 1, b: 1 } },
    success: { bg: colors.accent, fg: colors.accentForeground }
  };

  const sizeConfigs: Record<string, { height: number; px: number; py: number; fontSize: number }> = {
    small: { height: 28, px: 12, py: 4, fontSize: 12 },
    medium: { height: 32, px: 16, py: 6, fontSize: 13 }
  };

  const config = variantConfigs[variant] || variantConfigs.neutral;
  const sizeConfig = sizeConfigs[size] || sizeConfigs.medium;

  const btn = createAutoLayoutFrame(`SLDS Button/${variant}/${size}`, 'HORIZONTAL', 0, 8);
  btn.paddingLeft = sizeConfig.px;
  btn.paddingRight = sizeConfig.px;
  btn.paddingTop = sizeConfig.py;
  btn.paddingBottom = sizeConfig.py;
  btn.cornerRadius = radius.md;
  btn.fills = [{ type: 'SOLID', color: config.bg }];
  if (config.border) setStroke(btn, config.border);
  setShadow(btn, 'xs');
  btn.counterAxisAlignItems = 'CENTER';
  btn.primaryAxisAlignItems = 'CENTER';

  const text = createText(capitalize(variant), sizeConfig.fontSize, 'Medium', config.fg);
  btn.appendChild(text);

  return btn;
}

/**
 * Create an SLDS-style input component
 */
function createSldsInputComponent(
  type: string,
  variant: string,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const wrapper = createAutoLayoutFrame(`SLDS Input/${type}/${variant}`, 'VERTICAL', 0, 4);

  // Label (hidden in label-hidden variant)
  if (variant !== 'label-hidden') {
    const label = createText('Field Label', 12, 'Medium', colors.foreground);
    wrapper.appendChild(label);
  }

  const input = createAutoLayoutFrame('InputField', 'HORIZONTAL', 0, 0);
  input.paddingLeft = 12;
  input.paddingRight = 12;
  input.paddingTop = 6;
  input.paddingBottom = 6;
  input.resize(220, 32);
  input.cornerRadius = radius.md;
  input.fills = [{ type: 'SOLID', color: colors.background }];
  setStroke(input, colors.input);

  const placeholders: Record<string, string> = {
    text: 'Enter text...',
    number: '0',
    email: 'user@example.com',
    password: '********',
    search: 'Search...',
    tel: '(555) 555-5555',
    checkbox: '',
    toggle: ''
  };

  if (type === 'checkbox' || type === 'toggle') {
    // Render as checkbox/toggle
    const box = createRect(16, 16, colors.background, type === 'toggle' ? 8 : 3);
    setStroke(box, colors.input);
    input.appendChild(box);
    const checkLabel = createText('Option', 13, 'Regular', colors.foreground);
    input.appendChild(checkLabel);
  } else {
    const text = createText(placeholders[type] || 'Enter...', 13, 'Regular', colors.mutedForeground);
    input.appendChild(text);
  }

  wrapper.appendChild(input);
  return wrapper;
}

/**
 * Create an SLDS-style card component
 */
function createSldsCardComponent(
  variant: string,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const isNarrow = variant === 'narrow';
  const card = createAutoLayoutFrame(`SLDS Card/${variant}`, 'VERTICAL', isNarrow ? 12 : 16, 12);
  card.cornerRadius = radius.lg;
  card.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(card, colors.border);
  setShadow(card, 'sm');
  card.resize(isNarrow ? 240 : 320, 160);

  // Header
  const header = createAutoLayoutFrame('CardHeader', 'HORIZONTAL', 0, 8);
  header.counterAxisAlignItems = 'CENTER';
  const iconPlaceholder = createRect(20, 20, colors.primary, 4);
  header.appendChild(iconPlaceholder);
  const title = createText('Card Title', 14, 'Semi Bold', colors.foreground);
  header.appendChild(title);
  card.appendChild(header);

  // Body
  const body = createText('Card content area', 13, 'Regular', colors.mutedForeground);
  card.appendChild(body);

  return card;
}

/**
 * Create an SLDS-style badge component
 */
function createSldsBadgeComponent(
  variant: string,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const variantConfigs: Record<string, { bg: RGB; fg: RGB }> = {
    default: { bg: colors.muted, fg: colors.foreground },
    inverse: { bg: colors.foreground, fg: colors.background },
    lightest: { bg: colors.background, fg: colors.foreground },
    success: { bg: { r: 0.18, g: 0.518, b: 0.29 }, fg: { r: 1, g: 1, b: 1 } },
    warning: { bg: { r: 0.996, g: 0.576, b: 0.224 }, fg: { r: 0.094, g: 0.094, b: 0.094 } },
    error: { bg: colors.destructive, fg: colors.destructiveForeground }
  };

  const config = variantConfigs[variant] || variantConfigs.default;

  const badge = createAutoLayoutFrame(`SLDS Badge/${variant}`, 'HORIZONTAL', 0, 4);
  badge.paddingLeft = 8;
  badge.paddingRight = 8;
  badge.paddingTop = 2;
  badge.paddingBottom = 2;
  badge.cornerRadius = radius.md;
  badge.fills = [{ type: 'SOLID', color: config.bg }];

  const text = createText(capitalize(variant), 11, 'Medium', config.fg);
  badge.appendChild(text);

  return badge;
}

/**
 * Create an SLDS-style spinner component
 */
function createSldsSpinnerComponent(
  size: string,
  variant: string,
  colors: ColorPalette
): FrameNode {
  const sizes: Record<string, number> = {
    small: 24,
    medium: 48,
    large: 80
  };

  const variantColors: Record<string, RGB> = {
    base: colors.mutedForeground,
    brand: colors.primary,
    inverse: { r: 1, g: 1, b: 1 }
  };

  const dimension = sizes[size] || 48;
  const color = variantColors[variant] || colors.mutedForeground;

  const frame = createAutoLayoutFrame(`SLDS Spinner/${size}/${variant}`, 'HORIZONTAL', 0, 0);
  frame.counterAxisAlignItems = 'CENTER';
  frame.primaryAxisAlignItems = 'CENTER';
  const spinner = createRect(dimension, dimension, color, dimension / 2);
  spinner.opacity = 0.65;
  frame.appendChild(spinner);

  return frame;
}

/**
 * Create a generic SLDS component placeholder for custom components.
 * Renders as a labeled card showing the component name, variant info, and category.
 */
function createGenericSldsComponent(
  component: ParsedComponent,
  variantValues: Record<string, string>,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const variantLabel = Object.entries(variantValues)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ') || 'default';

  // Route to category-specific renderers for richer visuals
  switch (component.category) {
    case 'form-controls':
      return createGenericFormComponent(component, variantValues, variantLabel, colors, radius);
    case 'data-display':
      return createGenericDataComponent(component, variantValues, variantLabel, colors, radius);
    case 'feedback':
      return createGenericFeedbackComponent(component, variantValues, variantLabel, colors, radius);
    case 'navigation':
      return createGenericNavComponent(component, variantValues, variantLabel, colors, radius);
    case 'layout':
      return createGenericLayoutComponent(component, variantValues, variantLabel, colors, radius);
    case 'overlay':
      return createGenericOverlayComponent(component, variantValues, variantLabel, colors, radius);
    default:
      return createGenericCardComponent(component, variantValues, variantLabel, colors, radius);
  }
}

/** Generic card wrapper with header used by all category renderers */
function createComponentFrame(
  name: string, variantLabel: string, width: number, height: number,
  colors: ColorPalette, radius: typeof defaultRadius
): FrameNode {
  const frame = createAutoLayoutFrame(`${name}/${variantLabel}`, 'VERTICAL', 16, 12);
  frame.cornerRadius = radius.lg;
  frame.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(frame, colors.border);
  setShadow(frame, 'sm');
  frame.resize(width, height);
  return frame;
}

/** Add a component title bar */
function addComponentHeader(parent: FrameNode, name: string, colors: ColorPalette, radius: typeof defaultRadius): void {
  const header = createAutoLayoutFrame('Header', 'HORIZONTAL', 0, 8);
  header.counterAxisAlignItems = 'CENTER';
  const icon = createRect(18, 18, colors.primary, 4);
  header.appendChild(icon);
  const title = createText(name, 13, 'Semi Bold', colors.foreground);
  header.appendChild(title);
  parent.appendChild(header);
}

/** Form component: renders labeled fields + buttons */
function createGenericFormComponent(
  component: ParsedComponent, variantValues: Record<string, string>,
  variantLabel: string, colors: ColorPalette, radius: typeof defaultRadius
): FrameNode {
  const mode = variantValues.mode || variantValues.layout || 'edit';
  const frame = createComponentFrame(component.name, variantLabel, 320, 260, colors, radius);
  addComponentHeader(frame, component.name, colors, radius);

  // Separator
  const sep = createRect(288, 1, colors.border, 0);
  frame.appendChild(sep);

  // Form fields
  const fieldNames = ['First Name', 'Last Name', 'Email'];
  for (const fieldName of fieldNames) {
    const fieldGroup = createAutoLayoutFrame(fieldName, 'VERTICAL', 0, 4);
    const label = createText(fieldName, 11, 'Medium', colors.mutedForeground);
    fieldGroup.appendChild(label);

    const input = createAutoLayoutFrame('Input', 'HORIZONTAL', 0, 0);
    input.paddingLeft = 10;
    input.paddingRight = 10;
    input.paddingTop = 6;
    input.paddingBottom = 6;
    input.resize(288, 32);
    input.cornerRadius = radius.md;
    input.fills = [{ type: 'SOLID', color: colors.background }];
    setStroke(input, colors.input);

    const placeholder = mode === 'view'
      ? createText('Value', 12, 'Regular', colors.foreground)
      : createText(`Enter ${fieldName.toLowerCase()}...`, 12, 'Regular', colors.mutedForeground);
    input.appendChild(placeholder);
    fieldGroup.appendChild(input);
    frame.appendChild(fieldGroup);
  }

  // Action buttons
  const btnRow = createAutoLayoutFrame('Actions', 'HORIZONTAL', 0, 8);
  const saveBtn = createAutoLayoutFrame('Save', 'HORIZONTAL', 0, 0);
  saveBtn.paddingLeft = 16;
  saveBtn.paddingRight = 16;
  saveBtn.paddingTop = 6;
  saveBtn.paddingBottom = 6;
  saveBtn.cornerRadius = radius.md;
  saveBtn.fills = [{ type: 'SOLID', color: colors.primary }];
  saveBtn.appendChild(createText('Save', 12, 'Medium', colors.primaryForeground));
  btnRow.appendChild(saveBtn);

  const cancelBtn = createAutoLayoutFrame('Cancel', 'HORIZONTAL', 0, 0);
  cancelBtn.paddingLeft = 16;
  cancelBtn.paddingRight = 16;
  cancelBtn.paddingTop = 6;
  cancelBtn.paddingBottom = 6;
  cancelBtn.cornerRadius = radius.md;
  cancelBtn.fills = [{ type: 'SOLID', color: colors.background }];
  setStroke(cancelBtn, colors.border);
  cancelBtn.appendChild(createText('Cancel', 12, 'Medium', colors.foreground));
  btnRow.appendChild(cancelBtn);
  frame.appendChild(btnRow);

  return frame;
}

/** Data display component: renders as a card with table rows or data content */
function createGenericDataComponent(
  component: ParsedComponent, variantValues: Record<string, string>,
  variantLabel: string, colors: ColorPalette, radius: typeof defaultRadius
): FrameNode {
  const lowerName = component.name.toLowerCase();
  const isTable = lowerName.includes('table') || lowerName.includes('data') || lowerName.includes('list');
  const frame = createComponentFrame(component.name, variantLabel, isTable ? 400 : 320, isTable ? 240 : 180, colors, radius);
  addComponentHeader(frame, component.name, colors, radius);

  const sep = createRect(isTable ? 368 : 288, 1, colors.border, 0);
  frame.appendChild(sep);

  if (isTable) {
    // Table header row
    const headerRow = createAutoLayoutFrame('TableHeader', 'HORIZONTAL', 0, 0);
    headerRow.fills = [{ type: 'SOLID', color: colors.muted }];
    headerRow.paddingTop = 6;
    headerRow.paddingBottom = 6;
    headerRow.paddingLeft = 10;
    headerRow.paddingRight = 10;
    const headers = ['Name', 'Status', 'Date', 'Amount'];
    for (const h of headers) {
      const cell = createAutoLayoutFrame(h, 'HORIZONTAL', 0, 0);
      cell.resize(85, 20);
      cell.appendChild(createText(h, 11, 'Semi Bold', colors.foreground));
      headerRow.appendChild(cell);
    }
    frame.appendChild(headerRow);

    // Data rows
    const rowData = [
      ['Acme Corp', 'Active', '2024-01-15', '$12,500'],
      ['Global Inc', 'Pending', '2024-01-14', '$8,200'],
      ['Tech Co', 'Closed', '2024-01-13', '$24,800']
    ];
    for (const row of rowData) {
      const dataRow = createAutoLayoutFrame('Row', 'HORIZONTAL', 0, 0);
      dataRow.paddingTop = 6;
      dataRow.paddingBottom = 6;
      dataRow.paddingLeft = 10;
      dataRow.paddingRight = 10;
      for (const cellVal of row) {
        const cell = createAutoLayoutFrame('Cell', 'HORIZONTAL', 0, 0);
        cell.resize(85, 20);
        cell.appendChild(createText(cellVal, 11, 'Regular', colors.foreground));
        dataRow.appendChild(cell);
      }
      frame.appendChild(dataRow);
      const rowSep = createRect(368, 1, colors.border, 0);
      frame.appendChild(rowSep);
    }
  } else {
    // Card-style content
    const body = createAutoLayoutFrame('Body', 'VERTICAL', 12, 8);
    body.appendChild(createText('Content area with component data', 13, 'Regular', colors.mutedForeground));

    // Show variant-specific content hints
    for (const [key, val] of Object.entries(variantValues)) {
      const propRow = createAutoLayoutFrame(key, 'HORIZONTAL', 0, 6);
      propRow.appendChild(createText(key + ':', 11, 'Medium', colors.mutedForeground));
      propRow.appendChild(createText(val, 11, 'Regular', colors.foreground));
      body.appendChild(propRow);
    }
    frame.appendChild(body);

    // Footer with action
    const footer = createAutoLayoutFrame('Footer', 'HORIZONTAL', 0, 8);
    const actionBtn = createAutoLayoutFrame('Action', 'HORIZONTAL', 0, 0);
    actionBtn.paddingLeft = 12;
    actionBtn.paddingRight = 12;
    actionBtn.paddingTop = 4;
    actionBtn.paddingBottom = 4;
    actionBtn.cornerRadius = radius.md;
    actionBtn.fills = [{ type: 'SOLID', color: colors.primary }];
    actionBtn.appendChild(createText('View Details', 11, 'Medium', colors.primaryForeground));
    footer.appendChild(actionBtn);
    frame.appendChild(footer);
  }

  return frame;
}

/** Feedback component: renders as a notification/toast/alert */
function createGenericFeedbackComponent(
  component: ParsedComponent, variantValues: Record<string, string>,
  variantLabel: string, colors: ColorPalette, radius: typeof defaultRadius
): FrameNode {
  const severity = variantValues.severity || variantValues.variant || 'info';
  const severityColors: Record<string, { bg: RGB; fg: RGB; accent: RGB }> = {
    info: { bg: { r: 0.93, g: 0.95, b: 1.0 }, fg: colors.foreground, accent: colors.primary },
    success: { bg: { r: 0.92, g: 0.97, b: 0.93 }, fg: colors.foreground, accent: colors.accent },
    warning: { bg: { r: 1.0, g: 0.96, b: 0.88 }, fg: colors.foreground, accent: { r: 0.996, g: 0.576, b: 0.224 } },
    error: { bg: { r: 1.0, g: 0.92, b: 0.92 }, fg: colors.foreground, accent: colors.destructive }
  };
  const sColors = severityColors[severity] || severityColors.info;

  const frame = createAutoLayoutFrame(`${component.name}/${variantLabel}`, 'HORIZONTAL', 0, 12);
  frame.paddingLeft = 16;
  frame.paddingRight = 16;
  frame.paddingTop = 12;
  frame.paddingBottom = 12;
  frame.cornerRadius = radius.md;
  frame.fills = [{ type: 'SOLID', color: sColors.bg }];
  frame.resize(360, 72);
  frame.counterAxisAlignItems = 'CENTER';

  // Severity icon
  const icon = createRect(20, 20, sColors.accent, 10);
  frame.appendChild(icon);

  // Text content
  const textGroup = createAutoLayoutFrame('Text', 'VERTICAL', 0, 2);
  textGroup.layoutGrow = 1;
  const title = variantValues.title || component.name;
  textGroup.appendChild(createText(title, 13, 'Semi Bold', sColors.fg));
  textGroup.appendChild(createText('Notification message content', 12, 'Regular', colors.mutedForeground));
  frame.appendChild(textGroup);

  // Dismiss button
  if (variantValues.dismissible !== 'false') {
    const closeBtn = createAutoLayoutFrame('Close', 'HORIZONTAL', 0, 0);
    closeBtn.counterAxisAlignItems = 'CENTER';
    closeBtn.primaryAxisAlignItems = 'CENTER';
    closeBtn.resize(20, 20);
    closeBtn.appendChild(createText('×', 16, 'Regular', colors.mutedForeground));
    frame.appendChild(closeBtn);
  }

  return frame;
}

/** Navigation component */
function createGenericNavComponent(
  component: ParsedComponent, variantValues: Record<string, string>,
  variantLabel: string, colors: ColorPalette, radius: typeof defaultRadius
): FrameNode {
  const frame = createComponentFrame(component.name, variantLabel, 360, 48, colors, radius);
  frame.layoutMode = 'HORIZONTAL';
  frame.counterAxisAlignItems = 'CENTER';
  frame.paddingTop = 0;
  frame.paddingBottom = 0;

  const tabs = ['Tab 1', 'Tab 2', 'Tab 3'];
  for (let i = 0; i < tabs.length; i++) {
    const tab = createAutoLayoutFrame(tabs[i], 'VERTICAL', 0, 0);
    tab.paddingLeft = 16;
    tab.paddingRight = 16;
    tab.paddingTop = 12;
    tab.paddingBottom = 12;
    const isActive = i === 0;
    tab.appendChild(createText(tabs[i], 13, isActive ? 'Semi Bold' : 'Regular',
      isActive ? colors.primary : colors.mutedForeground));
    if (isActive) {
      const indicator = createRect(40, 2, colors.primary, 0);
      tab.appendChild(indicator);
    }
    frame.appendChild(tab);
  }

  return frame;
}

/** Layout/container component */
function createGenericLayoutComponent(
  component: ParsedComponent, variantValues: Record<string, string>,
  variantLabel: string, colors: ColorPalette, radius: typeof defaultRadius
): FrameNode {
  const frame = createComponentFrame(component.name, variantLabel, 360, 200, colors, radius);
  addComponentHeader(frame, component.name, colors, radius);

  const sep = createRect(328, 1, colors.border, 0);
  frame.appendChild(sep);

  // Grid-like content area
  const grid = createAutoLayoutFrame('Content', 'HORIZONTAL', 0, 12);
  for (let i = 0; i < 2; i++) {
    const col = createAutoLayoutFrame(`Col${i}`, 'VERTICAL', 12, 8);
    col.cornerRadius = radius.md;
    col.fills = [{ type: 'SOLID', color: colors.muted }];
    col.resize(156, 120);
    col.appendChild(createText(`Section ${i + 1}`, 12, 'Medium', colors.foreground));
    col.appendChild(createText('Content area', 11, 'Regular', colors.mutedForeground));
    grid.appendChild(col);
  }
  frame.appendChild(grid);

  return frame;
}

/** Modal/overlay component */
function createGenericOverlayComponent(
  component: ParsedComponent, variantValues: Record<string, string>,
  variantLabel: string, colors: ColorPalette, radius: typeof defaultRadius
): FrameNode {
  // Backdrop
  const wrapper = createAutoLayoutFrame(`${component.name}/${variantLabel}`, 'VERTICAL', 0, 0);
  wrapper.resize(400, 300);
  wrapper.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.4 }];
  wrapper.counterAxisAlignItems = 'CENTER';
  wrapper.primaryAxisAlignItems = 'CENTER';

  // Modal card
  const modal = createAutoLayoutFrame('Modal', 'VERTICAL', 20, 16);
  modal.cornerRadius = radius.lg;
  modal.fills = [{ type: 'SOLID', color: colors.card }];
  setShadow(modal, 'lg');
  modal.resize(320, 220);

  // Modal header
  const header = createAutoLayoutFrame('Header', 'HORIZONTAL', 0, 0);
  header.counterAxisAlignItems = 'CENTER';
  header.appendChild(createText(component.name, 16, 'Semi Bold', colors.foreground));
  modal.appendChild(header);

  const sep = createRect(280, 1, colors.border, 0);
  modal.appendChild(sep);

  // Modal body
  modal.appendChild(createText('Modal content area', 13, 'Regular', colors.mutedForeground));

  // Modal footer
  const footer = createAutoLayoutFrame('Footer', 'HORIZONTAL', 0, 8);
  const confirmBtn = createAutoLayoutFrame('Confirm', 'HORIZONTAL', 0, 0);
  confirmBtn.paddingLeft = 16;
  confirmBtn.paddingRight = 16;
  confirmBtn.paddingTop = 6;
  confirmBtn.paddingBottom = 6;
  confirmBtn.cornerRadius = radius.md;
  confirmBtn.fills = [{ type: 'SOLID', color: colors.primary }];
  confirmBtn.appendChild(createText('Confirm', 12, 'Medium', colors.primaryForeground));
  footer.appendChild(confirmBtn);

  const cancelBtn = createAutoLayoutFrame('Cancel', 'HORIZONTAL', 0, 0);
  cancelBtn.paddingLeft = 16;
  cancelBtn.paddingRight = 16;
  cancelBtn.paddingTop = 6;
  cancelBtn.paddingBottom = 6;
  cancelBtn.cornerRadius = radius.md;
  setStroke(cancelBtn, colors.border);
  cancelBtn.appendChild(createText('Cancel', 12, 'Medium', colors.foreground));
  footer.appendChild(cancelBtn);
  modal.appendChild(footer);

  wrapper.appendChild(modal);
  return wrapper;
}

/** Fallback card renderer for unrecognized categories */
function createGenericCardComponent(
  component: ParsedComponent, variantValues: Record<string, string>,
  variantLabel: string, colors: ColorPalette, radius: typeof defaultRadius
): FrameNode {
  const frame = createComponentFrame(component.name, variantLabel, 300, 160, colors, radius);
  addComponentHeader(frame, component.name, colors, radius);

  const sep = createRect(268, 1, colors.border, 0);
  frame.appendChild(sep);

  frame.appendChild(createText('Component content', 13, 'Regular', colors.mutedForeground));

  // Show variant values as property list
  for (const [key, val] of Object.entries(variantValues)) {
    const row = createAutoLayoutFrame(key, 'HORIZONTAL', 0, 6);
    row.appendChild(createText(key + ':', 11, 'Medium', colors.mutedForeground));
    row.appendChild(createText(val, 11, 'Regular', colors.foreground));
    frame.appendChild(row);
  }

  return frame;
}

// ============================================
// SALESFORCE COMPONENT GENERATOR
// ============================================

export interface SalesforceComponentGeneratorConfig {
  colors: ColorPalette;
  radius: typeof defaultRadius;
  prefix?: string;
  customComponents: ParsedComponent[];
  baseComponentRefs: string[];
}

/**
 * Generate all Salesforce components (custom + referenced base components)
 */
export async function generateAllSalesforceComponents(
  config: SalesforceComponentGeneratorConfig
): Promise<ComponentNode[]> {
  const { colors, radius, customComponents, baseComponentRefs } = config;
  const components: ComponentNode[] = [];
  let x = 0;
  let y = 0;

  // Load fonts
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' })
  ]);

  // --- Generate SLDS base components (only referenced ones) ---
  const baseComponents = getReferencedBaseComponents(baseComponentRefs);

  for (const baseDef of baseComponents) {
    const matrix = generateVariantMatrix(baseDef);

    for (const combo of matrix) {
      let frame: FrameNode;

      // Route to specific SLDS creators based on component name
      switch (baseDef.filePath) {
        case 'lightning/button':
          frame = createSldsButtonComponent(
            combo.values.variant || 'neutral',
            combo.values.size || 'medium',
            colors, radius
          );
          break;
        case 'lightning/input':
          frame = createSldsInputComponent(
            combo.values.type || 'text',
            combo.values.variant || 'standard',
            colors, radius
          );
          break;
        case 'lightning/card':
          frame = createSldsCardComponent(
            combo.values.variant || 'base',
            colors, radius
          );
          break;
        case 'lightning/badge':
          frame = createSldsBadgeComponent(
            combo.values.variant || 'default',
            colors, radius
          );
          break;
        case 'lightning/spinner':
          frame = createSldsSpinnerComponent(
            combo.values.size || 'medium',
            combo.values.variant || 'base',
            colors
          );
          break;
        default:
          // Generic placeholder for other base components
          frame = createGenericSldsComponent(baseDef, combo.values, colors, radius);
          break;
      }

      frame.x = x;
      frame.y = y;
      x += 300;
      if (x > 1200) {
        x = 0;
        y += 80;
      }

      const component = figma.createComponentFromNode(frame);
      components.push(component);
    }

    // New row after each base component type
    y += 100;
    x = 0;
  }

  // --- Generate custom components ---
  for (const customDef of customComponents) {
    const matrix = generateVariantMatrix(customDef);

    for (const combo of matrix) {
      const frame = createGenericSldsComponent(customDef, combo.values, colors, radius);
      frame.x = x;
      frame.y = y;
      x += 300;
      if (x > 1200) {
        x = 0;
        y += 120;
      }

      const component = figma.createComponentFromNode(frame);
      components.push(component);
    }

    y += 120;
    x = 0;
  }

  return components;
}

// ============================================
// UTILITY
// ============================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
