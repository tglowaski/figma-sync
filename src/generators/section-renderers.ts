/**
 * Section Renderers
 *
 * Configuration-driven content section rendering system.
 * Each renderer handles a specific section type and can be composed via configuration.
 */

import { RGB } from '../utils/figma-helpers';
import { ColorPalette, defaultRadius } from './component-generator';
import { generateMockRows } from '../mock-data';
import { ContentSection } from '../config/schema';

// ============================================
// TYPES
// ============================================

export interface BrandingConfig {
  logoText: string;
  tagline?: string;
  description?: string;
}

export interface NavItem {
  label: string;
  path?: string;
}

export interface SectionRendererConfig {
  colors: ColorPalette;
  radius: typeof defaultRadius;
  frameWidth: number;
  frameHeight: number;
  branding?: BrandingConfig;
  navItems?: NavItem[];
}

export type SectionRenderer = (
  parent: FrameNode,
  section: ContentSection,
  config: SectionRendererConfig
) => void;

// ============================================
// RENDERER REGISTRY
// ============================================

const sectionRenderers: Record<string, SectionRenderer> = {};

/**
 * Register a section renderer
 */
export function registerRenderer(type: string, renderer: SectionRenderer): void {
  sectionRenderers[type] = renderer;
}

/**
 * Get a section renderer by type
 */
export function getRenderer(type: string): SectionRenderer | undefined {
  return sectionRenderers[type];
}

/**
 * Get all registered renderer types
 */
export function getRegisteredTypes(): string[] {
  return Object.keys(sectionRenderers);
}

/**
 * Normalize a section definition (string or object) to ContentSection
 */
export function normalizeSection(section: ContentSection | string): ContentSection {
  return typeof section === 'string' ? { type: section } : section;
}

// ============================================
// HELPER FUNCTIONS (shared across renderers)
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
// SHARED COMPONENT BUILDERS
// ============================================

function createCard(
  title: string | null,
  width: number,
  height: number,
  colors: ColorPalette
): FrameNode {
  const card = createAutoLayoutFrame('Card', 'VERTICAL', 24, 16);
  card.cornerRadius = 12;
  card.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(card, colors.border);
  setShadow(card, 'sm');
  if (width) card.resize(width, height || 200);

  if (title) {
    const cardTitle = createText(title, 16, 'Semi Bold', colors.foreground);
    card.appendChild(cardTitle);
  }
  return card;
}

function createButton(
  label: string,
  variant: 'default' | 'outline' | 'ghost' | 'destructive' = 'default',
  colors: ColorPalette
): FrameNode {
  const configs: Record<string, { bg: RGB; fg: RGB; border?: RGB }> = {
    default: { bg: colors.primary, fg: colors.primaryForeground },
    outline: { bg: colors.background, fg: colors.foreground, border: colors.border },
    ghost: { bg: colors.background, fg: colors.foreground },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground }
  };
  const config = configs[variant] || configs.default;

  const btn = createAutoLayoutFrame('Button', 'HORIZONTAL', 0, 8);
  btn.paddingLeft = 16;
  btn.paddingRight = 16;
  btn.paddingTop = 10;
  btn.paddingBottom = 10;
  btn.cornerRadius = 8;
  btn.fills = [{ type: 'SOLID', color: config.bg }];
  if (config.border) setStroke(btn, config.border);
  btn.counterAxisAlignItems = 'CENTER';
  btn.primaryAxisAlignItems = 'CENTER';

  const text = createText(label, 14, 'Medium', config.fg);
  btn.appendChild(text);
  return btn;
}

function createInputField(
  label: string,
  placeholder: string,
  width: number,
  colors: ColorPalette
): FrameNode {
  const field = createAutoLayoutFrame('Field', 'VERTICAL', 0, 6);
  if (width) field.resize(width, 64);

  const labelText = createText(label, 14, 'Medium', colors.foreground);
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

  const inputText = createText(placeholder || 'Enter...', 14, 'Regular', colors.mutedForeground);
  input.appendChild(inputText);
  field.appendChild(input);

  return field;
}

function createTable(
  headers: string[],
  rows: string[][],
  width: number,
  colors: ColorPalette
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
    const text = createText(h, 12, 'Medium', colors.mutedForeground);
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
      const text = createText(cellData, 14, 'Regular', colors.foreground);
      cell.appendChild(text);
      row.appendChild(cell);
    });
    table.appendChild(row);
  });

  return table;
}

function createTabs(
  tabNames: string[],
  activeIndex: number,
  colors: ColorPalette
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
    const text = createText(name, 14, 'Medium', i === activeIndex ? colors.foreground : colors.mutedForeground);
    tab.appendChild(text);
    tabList.appendChild(tab);
  });

  return tabList;
}

function createMetricCard(
  title: string,
  value: string,
  subtitle: string | null,
  colors: ColorPalette
): FrameNode {
  const card = createAutoLayoutFrame('MetricCard', 'VERTICAL', 20, 8);
  card.cornerRadius = 12;
  card.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(card, colors.border);
  card.resize(250, 120);

  const titleText = createText(title, 14, 'Medium', colors.mutedForeground);
  card.appendChild(titleText);

  const valueText = createText(value, 28, 'Bold', colors.foreground);
  card.appendChild(valueText);

  if (subtitle) {
    const subText = createText(subtitle, 12, 'Regular', colors.mutedForeground);
    card.appendChild(subText);
  }

  return card;
}

// ============================================
// CORE SECTION RENDERERS
// ============================================

/**
 * Header section - page title and subtitle
 */
registerRenderer('header', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Page Title';
  const subtitle = section.subtitle || section.properties?.subtitle as string;

  const header = createAutoLayoutFrame('Header', 'VERTICAL', 0, 4);
  header.resize(frameWidth - 160, 60);

  const pageTitle = createText(title, 30, 'Bold', colors.foreground);
  header.appendChild(pageTitle);

  if (subtitle) {
    const pageSubtitle = createText(subtitle, 14, 'Regular', colors.mutedForeground);
    header.appendChild(pageSubtitle);
  }

  parent.appendChild(header);
});

/**
 * Header with action button
 */
registerRenderer('header-with-action', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Page Title';
  const subtitle = section.subtitle || section.properties?.subtitle as string;
  const actionLabel = section.properties?.actionLabel as string || 'Action';

  const header = createAutoLayoutFrame('Header', 'HORIZONTAL', 0, 0);
  header.resize(frameWidth - 160, 60);
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';

  const titleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 4);
  const pageTitle = createText(title, 30, 'Bold', colors.foreground);
  titleCol.appendChild(pageTitle);
  if (subtitle) {
    const pageSubtitle = createText(subtitle, 14, 'Regular', colors.mutedForeground);
    titleCol.appendChild(pageSubtitle);
  }
  header.appendChild(titleCol);

  const actionBtn = createButton(actionLabel, 'default', colors);
  header.appendChild(actionBtn);

  parent.appendChild(header);
});

/**
 * Back button with header
 */
registerRenderer('back-header', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Page Title';
  const subtitle = section.subtitle || section.properties?.subtitle as string;
  const showEdit = section.properties?.showEditButton !== false;

  const header = createAutoLayoutFrame('Header', 'HORIZONTAL', 0, 0);
  header.resize(frameWidth - 160, 60);
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';

  const leftHeader = createAutoLayoutFrame('Left', 'HORIZONTAL', 0, 12);
  leftHeader.counterAxisAlignItems = 'CENTER';
  const backBtn = createText('\u2190', 20, 'Regular', colors.foreground);
  leftHeader.appendChild(backBtn);
  const titleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 2);
  const pageTitle = createText(title, 24, 'Semi Bold', colors.foreground);
  titleCol.appendChild(pageTitle);
  if (subtitle) {
    const pageSubtitle = createText(subtitle, 14, 'Regular', colors.mutedForeground);
    titleCol.appendChild(pageSubtitle);
  }
  leftHeader.appendChild(titleCol);
  header.appendChild(leftHeader);

  if (showEdit) {
    const editBtn = createButton('Edit', 'default', colors);
    header.appendChild(editBtn);
  }

  parent.appendChild(header);
});

/**
 * Tabs section
 */
registerRenderer('tabs', (parent, section, config) => {
  const { colors } = config;
  const tabNames = section.properties?.tabs as string[] || ['Tab 1', 'Tab 2'];
  const activeIndex = section.properties?.activeIndex as number || 0;

  const tabs = createTabs(tabNames, activeIndex, colors);
  parent.appendChild(tabs);
});

/**
 * Generic data table
 */
registerRenderer('table', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const headers = section.properties?.headers as string[] || ['Column 1', 'Column 2', 'Column 3'];
  const rowCount = section.properties?.rowCount as number || 4;

  const rows = generateMockRows(headers, { rowCount });
  const table = createTable(headers, rows, frameWidth - 208, colors);
  parent.appendChild(table);
});

/**
 * Form card with input fields
 */
registerRenderer('form-card', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const cardTitle = section.title || null;
  const fields = section.properties?.fields as Array<{ name: string; placeholder?: string; type?: string }> || [
    { name: 'Field 1', placeholder: 'Enter value...' },
    { name: 'Field 2', placeholder: 'Enter value...' }
  ];

  const card = createCard(cardTitle, frameWidth - 160, 200, colors);

  const fieldsContainer = createAutoLayoutFrame('Fields', 'VERTICAL', 0, 16);

  for (let i = 0; i < fields.length; i += 2) {
    const row = createAutoLayoutFrame('FieldRow', 'HORIZONTAL', 0, 24);

    const field1 = createInputField(
      fields[i].name,
      fields[i].placeholder || 'Enter...',
      280,
      colors
    );
    row.appendChild(field1);

    if (fields[i + 1]) {
      const field2 = createInputField(
        fields[i + 1].name,
        fields[i + 1].placeholder || 'Enter...',
        280,
        colors
      );
      row.appendChild(field2);
    }

    fieldsContainer.appendChild(row);
  }

  card.appendChild(fieldsContainer);
  parent.appendChild(card);
});

/**
 * Metrics row - cards showing key metrics
 */
registerRenderer('metrics', (parent, section, config) => {
  const { colors } = config;
  const metrics = section.properties?.metrics as Array<{ title: string; value: string; subtitle?: string }> || [
    { title: 'Total Projects', value: '12', subtitle: '+2 this month' },
    { title: 'Total Investment', value: '$4.2M', subtitle: 'Across all projects' },
    { title: 'Average IRR', value: '18.5%', subtitle: 'Portfolio average' },
    { title: 'Total Distributions', value: '$1.8M', subtitle: 'YTD distributions' }
  ];

  const metricsRow = createAutoLayoutFrame('MetricsRow', 'HORIZONTAL', 0, 16);

  for (const m of metrics) {
    const card = createMetricCard(m.title, m.value, m.subtitle || null, colors);
    metricsRow.appendChild(card);
  }

  parent.appendChild(metricsRow);
});

/**
 * Loading spinner
 */
registerRenderer('loading-spinner', (parent, section, config) => {
  const { colors, frameWidth, frameHeight } = config;

  const centerContainer = createAutoLayoutFrame('LoadingContainer', 'VERTICAL', 0, 16);
  centerContainer.resize(frameWidth - 160, frameHeight - 200);
  centerContainer.primaryAxisAlignItems = 'CENTER';
  centerContainer.counterAxisAlignItems = 'CENTER';

  const spinner = createRect(32, 32, colors.muted, 16);
  centerContainer.appendChild(spinner);

  const text = createText('Loading...', 14, 'Regular', colors.mutedForeground);
  centerContainer.appendChild(text);

  parent.appendChild(centerContainer);
});

/**
 * Empty state with call to action
 */
registerRenderer('empty-state', (parent, section, config) => {
  const { colors, frameWidth, frameHeight } = config;
  const title = section.title || 'No Items Found';
  const message = section.properties?.message as string || 'Create an item to get started.';
  const actionLabel = section.properties?.actionLabel as string || 'Create';

  const centerContainer = createAutoLayoutFrame('EmptyContainer', 'VERTICAL', 0, 0);
  centerContainer.resize(frameWidth - 160, frameHeight - 200);
  centerContainer.primaryAxisAlignItems = 'CENTER';
  centerContainer.counterAxisAlignItems = 'CENTER';

  const emptyCard = createCard(null, 600, 250, colors);
  emptyCard.primaryAxisAlignItems = 'CENTER';
  emptyCard.counterAxisAlignItems = 'CENTER';

  const iconPlaceholder = createRect(48, 48, colors.muted, 24);
  emptyCard.appendChild(iconPlaceholder);

  const titleText = createText(title, 18, 'Semi Bold', colors.foreground);
  emptyCard.appendChild(titleText);

  const desc = createText(message, 14, 'Regular', colors.mutedForeground);
  emptyCard.appendChild(desc);

  const createBtn = createButton(`${actionLabel} \u2192`, 'default', colors);
  emptyCard.appendChild(createBtn);

  centerContainer.appendChild(emptyCard);
  parent.appendChild(centerContainer);
});

/**
 * Auth prompt (sign in required)
 */
registerRenderer('auth-prompt', (parent, section, config) => {
  const { colors, frameWidth, frameHeight } = config;
  const title = section.title || 'Sign In Required';
  const message = section.properties?.message as string || 'Please sign in to access this page.';
  const actionLabel = section.properties?.actionLabel as string || 'Sign In';

  const centerContainer = createAutoLayoutFrame('AuthPromptContainer', 'VERTICAL', 0, 0);
  centerContainer.resize(frameWidth - 160, frameHeight - 200);
  centerContainer.primaryAxisAlignItems = 'CENTER';
  centerContainer.counterAxisAlignItems = 'CENTER';

  const promptCard = createCard(null, 400, 200, colors);
  promptCard.primaryAxisAlignItems = 'CENTER';
  promptCard.counterAxisAlignItems = 'CENTER';

  const iconPlaceholder = createRect(48, 48, colors.muted, 24);
  promptCard.appendChild(iconPlaceholder);

  const titleText = createText(title, 18, 'Semi Bold', colors.foreground);
  promptCard.appendChild(titleText);

  const desc = createText(message, 14, 'Regular', colors.mutedForeground);
  promptCard.appendChild(desc);

  const actionBtn = createButton(actionLabel, 'default', colors);
  promptCard.appendChild(actionBtn);

  centerContainer.appendChild(promptCard);
  parent.appendChild(centerContainer);
});

/**
 * Organization prompt
 */
registerRenderer('org-prompt', (parent, section, config) => {
  const { colors, frameWidth, frameHeight } = config;
  const title = section.title || 'No Organization';
  const message = section.properties?.message as string || 'Please select or create an organization.';
  const actionLabel = section.properties?.actionLabel as string || 'Select Organization';

  const centerContainer = createAutoLayoutFrame('OrgPromptContainer', 'VERTICAL', 0, 0);
  centerContainer.resize(frameWidth - 160, frameHeight - 200);
  centerContainer.primaryAxisAlignItems = 'CENTER';
  centerContainer.counterAxisAlignItems = 'CENTER';

  const promptCard = createCard(null, 400, 200, colors);
  promptCard.primaryAxisAlignItems = 'CENTER';
  promptCard.counterAxisAlignItems = 'CENTER';

  const iconPlaceholder = createRect(48, 48, colors.muted, 24);
  promptCard.appendChild(iconPlaceholder);

  const titleText = createText(title, 18, 'Semi Bold', colors.foreground);
  promptCard.appendChild(titleText);

  const desc = createText(message, 14, 'Regular', colors.mutedForeground);
  promptCard.appendChild(desc);

  const actionBtn = createButton(actionLabel, 'default', colors);
  promptCard.appendChild(actionBtn);

  centerContainer.appendChild(promptCard);
  parent.appendChild(centerContainer);
});

/**
 * Button row - action buttons
 */
registerRenderer('button-row', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const buttons = section.properties?.buttons as Array<{ label: string; variant?: 'default' | 'outline' | 'ghost' | 'destructive' }> || [
    { label: 'Save', variant: 'default' }
  ];
  const alignment = section.properties?.alignment as 'left' | 'right' | 'center' || 'right';

  const buttonRow = createAutoLayoutFrame('ButtonRow', 'HORIZONTAL', 0, 12);
  buttonRow.resize(frameWidth - 160, 50);

  if (alignment === 'right') {
    buttonRow.primaryAxisAlignItems = 'MAX';
  } else if (alignment === 'center') {
    buttonRow.primaryAxisAlignItems = 'CENTER';
  }

  for (const b of buttons) {
    const btn = createButton(b.label, b.variant || 'default', colors);
    buttonRow.appendChild(btn);
  }

  parent.appendChild(buttonRow);
});

// ============================================
// WIZARD SECTION RENDERERS
// ============================================

/**
 * Wizard progress indicator
 */
registerRenderer('wizard-progress', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const currentStep = section.properties?.currentStep as number || 1;
  const totalSteps = section.properties?.totalSteps as number || 4;
  const stepNames = section.properties?.stepNames as string[] || [];

  const progressContainer = createAutoLayoutFrame('WizardProgress', 'HORIZONTAL', 0, 0);
  progressContainer.resize(frameWidth - 160, 60);
  progressContainer.primaryAxisAlignItems = 'CENTER';
  progressContainer.counterAxisAlignItems = 'CENTER';

  const progressBar = createAutoLayoutFrame('ProgressBar', 'HORIZONTAL', 0, 8);
  progressBar.counterAxisAlignItems = 'CENTER';

  for (let i = 1; i <= totalSteps; i++) {
    const isActive = i === currentStep;
    const isCompleted = i < currentStep;

    // Step circle with number
    const stepCircle = createAutoLayoutFrame(`Step${i}`, 'HORIZONTAL', 0, 0);
    stepCircle.resize(32, 32);
    stepCircle.cornerRadius = 16;
    stepCircle.primaryAxisAlignItems = 'CENTER';
    stepCircle.counterAxisAlignItems = 'CENTER';
    stepCircle.fills = [{ type: 'SOLID', color: isCompleted || isActive ? colors.primary : colors.muted }];

    const stepText = createText(
      isCompleted ? '\u2713' : String(i),
      14,
      'Medium',
      isCompleted || isActive ? colors.primaryForeground : colors.mutedForeground
    );
    stepCircle.appendChild(stepText);
    progressBar.appendChild(stepCircle);

    // Connector line (except for last step)
    if (i < totalSteps) {
      const line = createRect(60, 2, isCompleted ? colors.primary : colors.muted, 0);
      progressBar.appendChild(line);
    }
  }

  progressContainer.appendChild(progressBar);
  parent.appendChild(progressContainer);
});

/**
 * Wizard navigation (Back/Skip/Continue buttons)
 */
registerRenderer('wizard-navigation', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const showBack = section.properties?.showBack !== false;
  const showSkip = section.properties?.showSkip === true;
  const nextLabel = section.properties?.nextLabel as string || 'Continue';

  const navRow = createAutoLayoutFrame('WizardNav', 'HORIZONTAL', 0, 12);
  navRow.resize(frameWidth - 160, 50);
  navRow.primaryAxisAlignItems = 'SPACE_BETWEEN';

  // Left side - back button
  const leftButtons = createAutoLayoutFrame('LeftButtons', 'HORIZONTAL', 0, 12);
  if (showBack) {
    const backBtn = createButton('\u2190 Back', 'outline', colors);
    leftButtons.appendChild(backBtn);
  }
  navRow.appendChild(leftButtons);

  // Right side - skip and continue
  const rightButtons = createAutoLayoutFrame('RightButtons', 'HORIZONTAL', 0, 12);
  if (showSkip) {
    const skipBtn = createButton('Skip', 'ghost', colors);
    rightButtons.appendChild(skipBtn);
  }
  const continueBtn = createButton(nextLabel, 'default', colors);
  rightButtons.appendChild(continueBtn);
  navRow.appendChild(rightButtons);

  parent.appendChild(navRow);
});

/**
 * Preview summary card
 */
registerRenderer('preview-summary', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Preview';
  const items = section.properties?.items as Array<{ label: string; value: string }> || [
    { label: 'Item 1', value: 'Value 1' },
    { label: 'Item 2', value: 'Value 2' }
  ];

  const card = createCard(title, frameWidth - 160, 150, colors);
  card.fills = [{ type: 'SOLID', color: colors.muted }];

  for (const item of items) {
    const row = createAutoLayoutFrame('SummaryRow', 'HORIZONTAL', 0, 0);
    row.resize(frameWidth - 208, 24);
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';

    const label = createText(item.label, 14, 'Regular', colors.mutedForeground);
    row.appendChild(label);

    const value = createText(item.value, 14, 'Medium', colors.foreground);
    row.appendChild(value);

    card.appendChild(row);
  }

  parent.appendChild(card);
});

// ============================================
// DEALAPP-SPECIFIC SECTION RENDERERS
// ============================================

/**
 * Project selector with dropdown and configure button
 */
registerRenderer('project-selector', (parent, section, config) => {
  const { colors } = config;
  const projectName = section.properties?.projectName as string || 'Oakwood Apartments';
  const showConfigureButton = section.properties?.showConfigureButton !== false;

  const selectorRow = createAutoLayoutFrame('ProjectSelector', 'HORIZONTAL', 0, 12);
  selectorRow.counterAxisAlignItems = 'CENTER';

  const selectorLabel = createText('Project:', 14, 'Regular', colors.mutedForeground);
  selectorRow.appendChild(selectorLabel);

  const selector = createAutoLayoutFrame('Select', 'HORIZONTAL', 0, 8);
  selector.paddingLeft = 12;
  selector.paddingRight = 12;
  selector.paddingTop = 8;
  selector.paddingBottom = 8;
  selector.cornerRadius = 8;
  selector.fills = [{ type: 'SOLID', color: colors.background }];
  setStroke(selector, colors.input);

  const selectText = createText(projectName, 14, 'Regular', colors.foreground);
  selector.appendChild(selectText);

  const chevron = createText('\u25BC', 10, 'Regular', colors.mutedForeground);
  selector.appendChild(chevron);

  selectorRow.appendChild(selector);

  if (showConfigureButton) {
    const configBtn = createButton('Configure Project', 'outline', colors);
    selectorRow.appendChild(configBtn);
  }

  parent.appendChild(selectorRow);
});

/**
 * Sales input card - sale proceeds and date inputs
 */
registerRenderer('sales-input-card', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Sale Proceeds';

  const card = createCard(title, frameWidth - 160, 150, colors);

  const fieldsRow = createAutoLayoutFrame('Fields', 'HORIZONTAL', 0, 24);

  const proceedsField = createInputField('Sale Proceeds', '$5,000,000', 280, colors);
  fieldsRow.appendChild(proceedsField);

  const dateField = createInputField('Sale Date', 'Dec 31, 2026', 200, colors);
  fieldsRow.appendChild(dateField);

  const calculateBtn = createButton('Calculate', 'default', colors);
  fieldsRow.appendChild(calculateBtn);

  card.appendChild(fieldsRow);
  parent.appendChild(card);
});

/**
 * Contributions table - entity × period contribution grid
 */
registerRenderer('contributions-table', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Capital Contributions';
  const headers = section.properties?.headers as string[] || ['Entity', 'Total', 'Period 1', 'Period 2', 'Period 3'];
  const rowCount = section.properties?.rowCount as number || 4;

  const card = createCard(title, frameWidth - 160, 300, colors);

  const rows = generateMockRows(headers, { rowCount });
  const table = createTable(headers, rows, frameWidth - 208, colors);
  card.appendChild(table);

  parent.appendChild(card);
});

/**
 * Distributions table - expandable tier distribution
 */
registerRenderer('distributions-table', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Distributions by Tier';
  const headers = section.properties?.headers as string[] || ['Tier', 'Entity', 'IRR', 'Amount', 'Cumulative'];
  const rowCount = section.properties?.rowCount as number || 6;

  const card = createCard(title, frameWidth - 160, 350, colors);

  const rows = generateMockRows(headers, { rowCount });
  const table = createTable(headers, rows, frameWidth - 208, colors);
  card.appendChild(table);

  parent.appendChild(card);
});

/**
 * Entity table - entities with type/ownership/contribution
 */
registerRenderer('entity-table', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Entities';
  const headers = section.properties?.headers as string[] || ['Name', 'Type', 'Category', 'Contribution', 'Ownership %'];
  const rowCount = section.properties?.rowCount as number || 4;

  const card = createCard(title, frameWidth - 160, 300, colors);

  // Card header with add button
  const cardHeader = createAutoLayoutFrame('CardHeader', 'HORIZONTAL', 0, 0);
  cardHeader.resize(frameWidth - 208, 40);
  cardHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  cardHeader.counterAxisAlignItems = 'CENTER';

  const addBtn = createButton('+ Add Entity', 'outline', colors);
  cardHeader.appendChild(addBtn);
  card.appendChild(cardHeader);

  const rows = generateMockRows(headers, { rowCount });
  const table = createTable(headers, rows, frameWidth - 208, colors);
  card.appendChild(table);

  parent.appendChild(card);
});

/**
 * Waterfall tiers table - tier configuration
 */
registerRenderer('waterfall-tiers-table', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Waterfall Tiers';
  const headers = section.properties?.headers as string[] || ['Order', 'Tier Name', 'IRR Threshold', 'Multiple', 'LP %', 'GP %'];
  const rowCount = section.properties?.rowCount as number || 4;

  const card = createCard(title, frameWidth - 160, 320, colors);

  // Card description
  const desc = createText('Configure distribution tiers and hurdle rates', 14, 'Regular', colors.mutedForeground);
  card.appendChild(desc);

  const rows = generateMockRows(headers, { rowCount });
  const table = createTable(headers, rows, frameWidth - 208, colors);
  card.appendChild(table);

  // Add tier button
  const addRow = createAutoLayoutFrame('AddRow', 'HORIZONTAL', 0, 0);
  addRow.resize(frameWidth - 208, 40);
  const addBtn = createButton('+ Add Tier', 'outline', colors);
  addRow.appendChild(addBtn);
  card.appendChild(addRow);

  parent.appendChild(card);
});

/**
 * Summary table for waterfall results
 */
registerRenderer('summary-table', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Distribution Summary';
  const headers = section.properties?.headers as string[] || ['Entity', 'Contribution', 'Distribution', 'IRR', 'Multiple'];
  const rowCount = section.properties?.rowCount as number || 5;

  const card = createCard(title, frameWidth - 160, 350, colors);

  const rows = generateMockRows(headers, { rowCount });
  const table = createTable(headers, rows, frameWidth - 208, colors);
  card.appendChild(table);

  parent.appendChild(card);
});

/**
 * Breadcrumb navigation
 */
registerRenderer('breadcrumb', (parent, section, config) => {
  const { colors } = config;
  const items = section.properties?.items as string[] || ['Dashboard', 'Current Page'];

  const breadcrumb = createAutoLayoutFrame('Breadcrumb', 'HORIZONTAL', 0, 8);

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const text = createText(item, 14, 'Regular', isLast ? colors.foreground : colors.mutedForeground);
    breadcrumb.appendChild(text);

    if (!isLast) {
      const sep = createText('/', 14, 'Regular', colors.mutedForeground);
      breadcrumb.appendChild(sep);
    }
  });

  parent.appendChild(breadcrumb);
});

/**
 * Avatar header (profile page style)
 */
registerRenderer('avatar-header', (parent, section, config) => {
  const { colors } = config;
  const title = section.title || 'Profile Settings';
  const subtitle = section.subtitle || 'Manage your account information';

  const header = createAutoLayoutFrame('AvatarHeader', 'HORIZONTAL', 0, 16);
  header.counterAxisAlignItems = 'CENTER';

  const avatar = createRect(80, 80, colors.muted, 40);
  header.appendChild(avatar);

  const titleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 4);
  const pageTitle = createText(title, 30, 'Bold', colors.foreground);
  titleCol.appendChild(pageTitle);
  const pageSubtitle = createText(subtitle, 14, 'Regular', colors.mutedForeground);
  titleCol.appendChild(pageSubtitle);
  header.appendChild(titleCol);

  parent.appendChild(header);
});

/**
 * Settings form card
 */
registerRenderer('settings-form', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Settings';

  const card = createCard(null, frameWidth - 160, 450, colors);

  // Card header with title and action
  const cardHeader = createAutoLayoutFrame('CardHeader', 'HORIZONTAL', 0, 0);
  cardHeader.resize(frameWidth - 208, 50);
  cardHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  cardHeader.counterAxisAlignItems = 'CENTER';

  const cardTitleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 4);
  const cardTitle = createText(title, 18, 'Semi Bold', colors.foreground);
  cardTitleCol.appendChild(cardTitle);
  const cardDesc = createText('Manage team members and permissions', 14, 'Regular', colors.mutedForeground);
  cardTitleCol.appendChild(cardDesc);
  cardHeader.appendChild(cardTitleCol);

  const inviteBtn = createButton('+ Invite Member', 'default', colors);
  cardHeader.appendChild(inviteBtn);
  card.appendChild(cardHeader);

  // Team members table
  const memberHeaders = ['Member', 'Email', 'Role', 'Actions'];
  const memberRows = generateMockRows(memberHeaders, { rowCount: 4 });
  const memberTable = createTable(memberHeaders, memberRows, frameWidth - 208, colors);
  card.appendChild(memberTable);

  parent.appendChild(card);
});

/**
 * Chart placeholder
 */
registerRenderer('chart', (parent, section, config) => {
  const { colors, frameWidth } = config;
  const title = section.title || 'Chart';
  const width = section.properties?.width as number || 340;
  const height = section.properties?.height as number || 280;

  const card = createCard(title, width + 48, height + 80, colors);
  const chartPlaceholder = createRect(width, height, colors.muted, 8);
  card.appendChild(chartPlaceholder);

  parent.appendChild(card);
});

/**
 * Dashboard content - combined metrics, table, and chart
 */
registerRenderer('dashboard-content', (parent, section, config) => {
  const { colors, frameWidth } = config;

  // Metrics row
  const metricsRow = createAutoLayoutFrame('MetricsRow', 'HORIZONTAL', 0, 16);
  const metrics = [
    { title: 'Total Projects', value: '12', subtitle: '+2 this month' },
    { title: 'Total Investment', value: '$4.2M', subtitle: 'Across all projects' },
    { title: 'Average IRR', value: '18.5%', subtitle: 'Portfolio average' },
    { title: 'Total Distributions', value: '$1.8M', subtitle: 'YTD distributions' }
  ];
  for (const m of metrics) {
    const card = createMetricCard(m.title, m.value, m.subtitle, colors);
    metricsRow.appendChild(card);
  }
  parent.appendChild(metricsRow);

  // Main content row
  const mainRow = createAutoLayoutFrame('MainRow', 'HORIZONTAL', 0, 24);
  mainRow.resize(frameWidth - 160, 400);

  // Project table card
  const projectCard = createCard('Recent Projects', 700, 400, colors);
  const projectHeaders = ['Project', 'Status', 'Investment', 'IRR'];
  const projectRows = generateMockRows(projectHeaders, { rowCount: 4 });
  const projectTable = createTable(projectHeaders, projectRows, 652, colors);
  projectCard.appendChild(projectTable);
  mainRow.appendChild(projectCard);

  // Chart card
  const chartCard = createCard('Distribution Chart', 340, 400, colors);
  const chartPlaceholder = createRect(292, 280, colors.muted, 8);
  chartCard.appendChild(chartPlaceholder);
  mainRow.appendChild(chartCard);

  parent.appendChild(mainRow);
});

// Export helpers for potential reuse
export {
  createAutoLayoutFrame,
  createRect,
  createText,
  createCard,
  createButton,
  createInputField,
  createTable,
  createTabs,
  createMetricCard,
  setStroke,
  setShadow
};
