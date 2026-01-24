/**
 * Wireframe Generator
 *
 * Creates full-page wireframe designs from parsed page configurations.
 * Configuration-driven to support different projects.
 */

import { RGB } from '../utils/figma-helpers';
import { WireframeConfig, getPredefinedPages } from '../parsers/page-parser';
import { ColorPalette, defaultColors, defaultRadius } from './component-generator';
import { generateMockRows } from '../mock-data';

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

export interface WireframeGeneratorConfig {
  colors: ColorPalette;
  radius: typeof defaultRadius;
  frameWidth: number;
  frameHeight: number;
  spacing: number;
  columns: number;
  /** Branding configuration for logo and text */
  branding?: BrandingConfig;
  /** Navigation items for the nav bar */
  navItems?: NavItem[];
}

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
// COMPONENT BUILDERS
// ============================================

function createNavBar(
  parent: FrameNode,
  width: number,
  colors: ColorPalette,
  branding?: BrandingConfig,
  navItems?: NavItem[]
): FrameNode {
  const nav = createAutoLayoutFrame('NavigationBar', 'HORIZONTAL', 0, 0);
  nav.paddingLeft = 24;
  nav.paddingRight = 24;
  nav.resize(width, 64);
  nav.fills = [{ type: 'SOLID', color: colors.background }];
  nav.strokes = [{ type: 'SOLID', color: colors.border }];
  nav.strokeBottomWeight = 1;
  nav.strokeTopWeight = 0;
  nav.strokeLeftWeight = 0;
  nav.strokeRightWeight = 0;
  nav.primaryAxisAlignItems = 'SPACE_BETWEEN';
  nav.counterAxisAlignItems = 'CENTER';
  parent.appendChild(nav);
  nav.x = 0;
  nav.y = 0;

  // Logo - use branding config or default
  const logoTextValue = branding?.logoText || 'App';
  const logo = createAutoLayoutFrame('Logo', 'HORIZONTAL', 0, 8);
  logo.counterAxisAlignItems = 'CENTER';
  const logoIcon = createRect(28, 28, colors.primary, 6);
  logo.appendChild(logoIcon);
  const logoTextNode = createText(logoTextValue, 18, 'Bold', colors.foreground);
  logo.appendChild(logoTextNode);
  nav.appendChild(logo);

  // Nav Links - use navItems config or defaults
  const links = createAutoLayoutFrame('NavLinks', 'HORIZONTAL', 0, 32);
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

function createCard(
  title: string | null,
  width: number,
  height: number,
  colors: ColorPalette,
  radius: typeof defaultRadius
): FrameNode {
  const card = createAutoLayoutFrame('Card', 'VERTICAL', 24, 16);
  card.cornerRadius = radius.xl;
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

function createLoader(colors: ColorPalette): FrameNode {
  const loader = createAutoLayoutFrame('Loader', 'VERTICAL', 0, 16);
  loader.primaryAxisAlignItems = 'CENTER';
  loader.counterAxisAlignItems = 'CENTER';

  const spinner = createRect(32, 32, colors.muted, 16);
  loader.appendChild(spinner);

  const text = createText('Loading...', 14, 'Regular', colors.mutedForeground);
  loader.appendChild(text);

  return loader;
}

// ============================================
// PAGE GENERATORS
// ============================================

function findOrCreateFrame(
  name: string,
  width: number,
  height: number,
  colors: ColorPalette
): { frame: FrameNode; isNew: boolean } {
  const existingFrames = figma.currentPage.findAll(
    node => node.type === 'FRAME' && node.name === name
  ) as FrameNode[];

  if (existingFrames.length > 0) {
    const frame = existingFrames[0];
    while (frame.children.length > 0) {
      frame.children[0].remove();
    }
    frame.resize(width, height);
    frame.fills = [{ type: 'SOLID', color: colors.background }];
    return { frame, isNew: false };
  }

  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(width, height);
  frame.fills = [{ type: 'SOLID', color: colors.background }];
  return { frame, isNew: true };
}

/**
 * Generate login page wireframe
 */
function generateLoginPage(
  frame: FrameNode,
  config: WireframeGeneratorConfig
): void {
  const { colors, radius, frameWidth, frameHeight, branding } = config;
  const logoTextValue = branding?.logoText || 'App';

  // Centered login card
  const loginCard = createAutoLayoutFrame('LoginCard', 'VERTICAL', 32, 24);
  loginCard.cornerRadius = 16;
  loginCard.fills = [{ type: 'SOLID', color: colors.card }];
  setStroke(loginCard, colors.border);
  setShadow(loginCard, 'lg');
  loginCard.resize(400, 480);
  loginCard.x = (frameWidth - 400) / 2;
  loginCard.y = (frameHeight - 480) / 2;

  // Logo - use branding config
  const logoRow = createAutoLayoutFrame('LogoRow', 'HORIZONTAL', 0, 8);
  logoRow.primaryAxisAlignItems = 'CENTER';
  logoRow.counterAxisAlignItems = 'CENTER';
  logoRow.resize(336, 40);
  const logoIcon = createRect(32, 32, colors.primary, 8);
  logoRow.appendChild(logoIcon);
  const logoText = createText(logoTextValue, 20, 'Bold', colors.foreground);
  logoRow.appendChild(logoText);
  loginCard.appendChild(logoRow);

  // Title
  const title = createText('Welcome back', 24, 'Semi Bold', colors.foreground);
  loginCard.appendChild(title);
  const subtitle = createText('Sign in to your account', 14, 'Regular', colors.mutedForeground);
  loginCard.appendChild(subtitle);

  // Form fields
  const emailField = createInputField('Email', 'name@example.com', 336, colors);
  loginCard.appendChild(emailField);
  const passField = createInputField('Password', '••••••••', 336, colors);
  loginCard.appendChild(passField);

  // Forgot password link
  const forgotLink = createText('Forgot password?', 14, 'Medium', colors.primary);
  loginCard.appendChild(forgotLink);

  // Sign in button
  const signInBtn = createButton('Sign In', 'default', colors);
  signInBtn.resize(336, 40);
  loginCard.appendChild(signInBtn);

  // Divider
  const dividerRow = createAutoLayoutFrame('Divider', 'HORIZONTAL', 0, 12);
  dividerRow.resize(336, 20);
  dividerRow.counterAxisAlignItems = 'CENTER';
  const line1 = createRect(140, 1, colors.border, 0);
  dividerRow.appendChild(line1);
  const orText = createText('or', 12, 'Regular', colors.mutedForeground);
  dividerRow.appendChild(orText);
  const line2 = createRect(140, 1, colors.border, 0);
  dividerRow.appendChild(line2);
  loginCard.appendChild(dividerRow);

  // Sign up link
  const signUpRow = createAutoLayoutFrame('SignUpRow', 'HORIZONTAL', 0, 4);
  signUpRow.primaryAxisAlignItems = 'CENTER';
  signUpRow.resize(336, 20);
  const noAccountText = createText("Don't have an account?", 14, 'Regular', colors.mutedForeground);
  signUpRow.appendChild(noAccountText);
  const signUpLink = createText('Sign up', 14, 'Medium', colors.primary);
  signUpRow.appendChild(signUpLink);
  loginCard.appendChild(signUpRow);

  frame.appendChild(loginCard);
}

/**
 * Generate dashboard page wireframe
 */
function generateDashboardPage(
  frame: FrameNode,
  config: WireframeGeneratorConfig
): void {
  const { colors, radius, frameWidth, frameHeight, branding, navItems } = config;

  createNavBar(frame, frameWidth, colors, branding, navItems);

  // Main content
  const content = createAutoLayoutFrame('Content', 'VERTICAL', 24, 24);
  content.x = 0;
  content.y = 64;
  content.resize(frameWidth, frameHeight - 64);
  content.paddingLeft = 80;
  content.paddingRight = 80;
  content.paddingTop = 32;

  // Header row
  const header = createAutoLayoutFrame('Header', 'HORIZONTAL', 0, 0);
  header.resize(frameWidth - 160, 60);
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';

  const titleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 4);
  const pageTitle = createText('Dashboard', 30, 'Bold', colors.foreground);
  titleCol.appendChild(pageTitle);
  const pageSubtitle = createText('Overview of your investment portfolio', 14, 'Regular', colors.mutedForeground);
  titleCol.appendChild(pageSubtitle);
  header.appendChild(titleCol);

  const newProjectBtn = createButton('+ New Project', 'default', colors);
  header.appendChild(newProjectBtn);
  content.appendChild(header);

  // Metrics row
  const metricsRow = createAutoLayoutFrame('MetricsRow', 'HORIZONTAL', 0, 16);
  const metrics = [
    { title: 'Total Projects', value: '12', subtitle: '+2 this month' },
    { title: 'Total Investment', value: '$4.2M', subtitle: 'Across all projects' },
    { title: 'Average IRR', value: '18.5%', subtitle: 'Portfolio average' },
    { title: 'Total Distributions', value: '$1.8M', subtitle: 'YTD distributions' }
  ];
  metrics.forEach(m => {
    const card = createMetricCard(m.title, m.value, m.subtitle, colors);
    metricsRow.appendChild(card);
  });
  content.appendChild(metricsRow);

  // Main content row
  const mainRow = createAutoLayoutFrame('MainRow', 'HORIZONTAL', 0, 24);
  mainRow.resize(frameWidth - 160, 400);

  // Project Summary Card
  const projectCard = createCard('Recent Projects', 700, 400, colors, radius);
  const projectHeaders = ['Project', 'Status', 'Investment', 'IRR'];
  const projectRows = generateMockRows(projectHeaders, { rowCount: 4 });
  const projectTable = createTable(
    projectHeaders,
    projectRows,
    652,
    colors
  );
  projectCard.appendChild(projectTable);
  mainRow.appendChild(projectCard);

  // Chart placeholder
  const chartCard = createCard('Distribution Chart', 340, 400, colors, radius);
  const chartPlaceholder = createRect(292, 280, colors.muted, 8);
  chartCard.appendChild(chartPlaceholder);
  mainRow.appendChild(chartCard);

  content.appendChild(mainRow);
  frame.appendChild(content);
}

/**
 * Generate waterfall summary page wireframe
 */
function generateWaterfallSummaryPage(
  frame: FrameNode,
  config: WireframeGeneratorConfig
): void {
  const { colors, radius, frameWidth, frameHeight, branding, navItems } = config;

  createNavBar(frame, frameWidth, colors, branding, navItems);

  const content = createAutoLayoutFrame('Content', 'VERTICAL', 24, 24);
  content.x = 0;
  content.y = 64;
  content.resize(frameWidth, frameHeight - 64);
  content.paddingLeft = 80;
  content.paddingRight = 80;
  content.paddingTop = 32;

  // Header
  const header = createAutoLayoutFrame('Header', 'HORIZONTAL', 0, 0);
  header.resize(frameWidth - 160, 60);
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';

  const titleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 4);
  const pageTitle = createText('Waterfall Distributions', 30, 'Bold', colors.foreground);
  titleCol.appendChild(pageTitle);
  const pageSubtitle = createText('Calculate and analyze waterfall distributions', 14, 'Regular', colors.mutedForeground);
  titleCol.appendChild(pageSubtitle);
  header.appendChild(titleCol);

  // Project selector
  const selectorRow = createAutoLayoutFrame('Selector', 'HORIZONTAL', 0, 12);
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
  const selectText = createText('Oakwood Apartments', 14, 'Regular', colors.foreground);
  selector.appendChild(selectText);
  const chevron = createText('▼', 10, 'Regular', colors.mutedForeground);
  selector.appendChild(chevron);
  selectorRow.appendChild(selector);
  const configBtn = createButton('Configure Project', 'outline', colors);
  selectorRow.appendChild(configBtn);
  header.appendChild(selectorRow);
  content.appendChild(header);

  // Tabs
  const tabs = createTabs(['Summary', 'Detail'], 0, colors);
  content.appendChild(tabs);

  // Summary Card
  const summaryCard = createCard('Distribution Summary', frameWidth - 160, 500, colors, radius);
  const summaryHeaders = ['Entity', 'Contribution', 'Distribution', 'Rate', 'Multiple'];
  const summaryRows = generateMockRows(summaryHeaders, { rowCount: 6 });
  const summaryTable = createTable(
    summaryHeaders,
    summaryRows,
    frameWidth - 208,
    colors
  );
  summaryCard.appendChild(summaryTable);
  content.appendChild(summaryCard);

  frame.appendChild(content);
}

/**
 * Generate loading state wireframe
 */
function generateLoadingState(
  frame: FrameNode,
  config: WireframeGeneratorConfig
): void {
  const { colors, frameWidth, frameHeight, branding, navItems } = config;

  createNavBar(frame, frameWidth, colors, branding, navItems);

  const centerContainer = createAutoLayoutFrame('CenterContainer', 'VERTICAL', 0, 0);
  centerContainer.resize(frameWidth, frameHeight - 64);
  centerContainer.x = 0;
  centerContainer.y = 64;
  centerContainer.primaryAxisAlignItems = 'CENTER';
  centerContainer.counterAxisAlignItems = 'CENTER';

  const loader = createLoader(colors);
  centerContainer.appendChild(loader);

  frame.appendChild(centerContainer);
}

/**
 * Generate auth prompt state wireframe
 */
function generateAuthPromptState(
  frame: FrameNode,
  config: WireframeGeneratorConfig,
  message: string,
  icon: string
): void {
  const { colors, radius, frameWidth, frameHeight, branding, navItems } = config;

  createNavBar(frame, frameWidth, colors, branding, navItems);

  const centerContainer = createAutoLayoutFrame('CenterContainer', 'VERTICAL', 0, 0);
  centerContainer.resize(frameWidth, frameHeight - 64);
  centerContainer.x = 0;
  centerContainer.y = 64;
  centerContainer.primaryAxisAlignItems = 'CENTER';
  centerContainer.counterAxisAlignItems = 'CENTER';

  const promptCard = createCard(null, 400, 200, colors, radius);
  promptCard.primaryAxisAlignItems = 'CENTER';
  promptCard.counterAxisAlignItems = 'CENTER';

  const iconPlaceholder = createRect(48, 48, colors.muted, 24);
  promptCard.appendChild(iconPlaceholder);

  const title = createText(icon === 'alert' ? 'Sign In Required' : 'No Organization', 18, 'Semi Bold', colors.foreground);
  promptCard.appendChild(title);

  const desc = createText(message, 14, 'Regular', colors.mutedForeground);
  promptCard.appendChild(desc);

  const actionBtn = createButton(icon === 'alert' ? 'Sign In' : 'Select Organization', 'default', colors);
  promptCard.appendChild(actionBtn);

  centerContainer.appendChild(promptCard);
  frame.appendChild(centerContainer);
}

/**
 * Generate empty state wireframe
 */
function generateEmptyState(
  frame: FrameNode,
  config: WireframeGeneratorConfig
): void {
  const { colors, radius, frameWidth, frameHeight, branding, navItems } = config;

  createNavBar(frame, frameWidth, colors, branding, navItems);

  const centerContainer = createAutoLayoutFrame('CenterContainer', 'VERTICAL', 0, 0);
  centerContainer.resize(frameWidth, frameHeight - 64);
  centerContainer.x = 0;
  centerContainer.y = 64;
  centerContainer.paddingLeft = 80;
  centerContainer.paddingRight = 80;
  centerContainer.primaryAxisAlignItems = 'CENTER';
  centerContainer.counterAxisAlignItems = 'CENTER';

  const emptyCard = createCard(null, 600, 250, colors, radius);
  emptyCard.primaryAxisAlignItems = 'CENTER';
  emptyCard.counterAxisAlignItems = 'CENTER';

  const iconPlaceholder = createRect(48, 48, colors.muted, 24);
  emptyCard.appendChild(iconPlaceholder);

  const title = createText('No Projects Found', 18, 'Semi Bold', colors.foreground);
  emptyCard.appendChild(title);

  const desc = createText('Create a project and complete setup to start calculating waterfall distributions.', 14, 'Regular', colors.mutedForeground);
  emptyCard.appendChild(desc);

  const createBtn = createButton('Create Project →', 'default', colors);
  emptyCard.appendChild(createBtn);

  centerContainer.appendChild(emptyCard);
  frame.appendChild(centerContainer);
}

/**
 * Generate settings page wireframe
 */
function generateSettingsPage(
  frame: FrameNode,
  config: WireframeGeneratorConfig
): void {
  const { colors, radius, frameWidth, frameHeight, branding, navItems } = config;

  createNavBar(frame, frameWidth, colors, branding, navItems);

  const content = createAutoLayoutFrame('Content', 'VERTICAL', 24, 24);
  content.x = 0;
  content.y = 64;
  content.resize(frameWidth, frameHeight - 64);
  content.paddingLeft = 80;
  content.paddingRight = 80;
  content.paddingTop = 32;

  // Header
  const header = createAutoLayoutFrame('Header', 'VERTICAL', 0, 4);
  const pageTitle = createText('Settings', 30, 'Bold', colors.foreground);
  header.appendChild(pageTitle);
  const pageSubtitle = createText('Manage your organization settings and team members', 14, 'Regular', colors.mutedForeground);
  header.appendChild(pageSubtitle);
  content.appendChild(header);

  // Tabs
  const tabs = createTabs(['Team', 'Organization', 'Preferences'], 0, colors);
  content.appendChild(tabs);

  // Team Card
  const teamCard = createCard(null, frameWidth - 160, 450, colors, radius);

  const cardHeader = createAutoLayoutFrame('CardHeader', 'HORIZONTAL', 0, 0);
  cardHeader.resize(frameWidth - 208, 50);
  cardHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  cardHeader.counterAxisAlignItems = 'CENTER';

  const cardTitleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 4);
  const cardTitle = createText('Team Members', 18, 'Semi Bold', colors.foreground);
  cardTitleCol.appendChild(cardTitle);
  const cardDesc = createText('Manage who has access to this organization', 14, 'Regular', colors.mutedForeground);
  cardTitleCol.appendChild(cardDesc);
  cardHeader.appendChild(cardTitleCol);

  const inviteBtn = createButton('+ Invite Member', 'default', colors);
  cardHeader.appendChild(inviteBtn);
  teamCard.appendChild(cardHeader);

  const memberHeaders = ['Member', 'Email', 'Role', 'Actions'];
  const memberRows = generateMockRows(memberHeaders, { rowCount: 4 });
  const memberTable = createTable(
    memberHeaders,
    memberRows,
    frameWidth - 208,
    colors
  );
  teamCard.appendChild(memberTable);

  content.appendChild(teamCard);
  frame.appendChild(content);
}

/**
 * Generate profile page wireframe
 */
function generateProfilePage(
  frame: FrameNode,
  config: WireframeGeneratorConfig
): void {
  const { colors, radius, frameWidth, frameHeight, branding, navItems } = config;

  createNavBar(frame, frameWidth, colors, branding, navItems);

  const content = createAutoLayoutFrame('Content', 'VERTICAL', 24, 24);
  content.x = 0;
  content.y = 64;
  content.resize(frameWidth, frameHeight - 64);
  content.paddingLeft = 80;
  content.paddingRight = 80;
  content.paddingTop = 32;

  // Breadcrumb
  const breadcrumb = createAutoLayoutFrame('Breadcrumb', 'HORIZONTAL', 0, 8);
  const bc1 = createText('Dashboard', 14, 'Regular', colors.mutedForeground);
  breadcrumb.appendChild(bc1);
  const bcSep = createText('/', 14, 'Regular', colors.mutedForeground);
  breadcrumb.appendChild(bcSep);
  const bc2 = createText('Profile', 14, 'Regular', colors.foreground);
  breadcrumb.appendChild(bc2);
  content.appendChild(breadcrumb);

  // Header with avatar
  const header = createAutoLayoutFrame('Header', 'HORIZONTAL', 0, 16);
  header.counterAxisAlignItems = 'CENTER';
  const avatar = createRect(80, 80, colors.muted, 40);
  header.appendChild(avatar);
  const titleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 4);
  const pageTitle = createText('Profile Settings', 30, 'Bold', colors.foreground);
  titleCol.appendChild(pageTitle);
  const pageSubtitle = createText('Manage your account information and preferences', 14, 'Regular', colors.mutedForeground);
  titleCol.appendChild(pageSubtitle);
  header.appendChild(titleCol);
  content.appendChild(header);

  // Tabs
  const tabs = createTabs(['General', 'Business', 'Security', 'Billing'], 0, colors);
  content.appendChild(tabs);

  // Personal Info Card
  const infoCard = createCard('Personal Information', frameWidth - 160, 280, colors, radius);
  const infoDesc = createText('Update your personal details and contact information', 14, 'Regular', colors.mutedForeground);
  infoCard.appendChild(infoDesc);

  const nameRow = createAutoLayoutFrame('NameRow', 'HORIZONTAL', 0, 16);
  const firstField = createInputField('First Name', 'John', 280, colors);
  nameRow.appendChild(firstField);
  const lastField = createInputField('Last Name', 'Doe', 280, colors);
  nameRow.appendChild(lastField);
  infoCard.appendChild(nameRow);

  const contactRow = createAutoLayoutFrame('ContactRow', 'HORIZONTAL', 0, 16);
  const emailField = createInputField('Email', 'john@example.com', 280, colors);
  contactRow.appendChild(emailField);
  const phoneField = createInputField('Phone', '+1 (555) 123-4567', 280, colors);
  contactRow.appendChild(phoneField);
  infoCard.appendChild(contactRow);

  content.appendChild(infoCard);

  // Save button
  const saveRow = createAutoLayoutFrame('SaveRow', 'HORIZONTAL', 0, 0);
  saveRow.resize(frameWidth - 160, 50);
  saveRow.primaryAxisAlignItems = 'MAX';
  const saveBtn = createButton('Save Changes', 'default', colors);
  saveRow.appendChild(saveBtn);
  content.appendChild(saveRow);

  frame.appendChild(content);
}

/**
 * Generate project config page wireframe
 */
function generateProjectConfigPage(
  frame: FrameNode,
  config: WireframeGeneratorConfig,
  activeTab: string
): void {
  const { colors, radius, frameWidth, frameHeight, branding, navItems } = config;

  createNavBar(frame, frameWidth, colors, branding, navItems);

  const content = createAutoLayoutFrame('Content', 'VERTICAL', 24, 24);
  content.x = 0;
  content.y = 64;
  content.resize(frameWidth, frameHeight - 64);
  content.paddingLeft = 80;
  content.paddingRight = 80;
  content.paddingTop = 32;

  // Header with back button
  const header = createAutoLayoutFrame('Header', 'HORIZONTAL', 0, 0);
  header.resize(frameWidth - 160, 60);
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';

  const leftHeader = createAutoLayoutFrame('Left', 'HORIZONTAL', 0, 12);
  leftHeader.counterAxisAlignItems = 'CENTER';
  const backBtn = createText('←', 20, 'Regular', colors.foreground);
  leftHeader.appendChild(backBtn);
  const titleCol = createAutoLayoutFrame('TitleCol', 'VERTICAL', 0, 2);
  const pageTitle = createText('Oakwood Apartments', 24, 'Semi Bold', colors.foreground);
  titleCol.appendChild(pageTitle);
  const pageSubtitle = createText('Configure project details and entities', 14, 'Regular', colors.mutedForeground);
  titleCol.appendChild(pageSubtitle);
  leftHeader.appendChild(titleCol);
  header.appendChild(leftHeader);

  const editBtn = createButton('Edit', 'default', colors);
  header.appendChild(editBtn);
  content.appendChild(header);

  // Tabs
  const tabNames = ['Project Details', 'Entities', 'Waterfall Tiers'];
  const activeIndex = tabNames.findIndex(t => t.toLowerCase().includes(activeTab.toLowerCase()));
  const tabs = createTabs(tabNames, activeIndex >= 0 ? activeIndex : 0, colors);
  content.appendChild(tabs);

  // Content based on active tab
  if (activeTab === 'Details' || activeTab === 'Project Details') {
    const formCard = createCard('Basic Information', frameWidth - 160, 300, colors, radius);

    const fieldsRow = createAutoLayoutFrame('Fields', 'HORIZONTAL', 0, 24);
    const nameField = createInputField('Project Name', 'Oakwood Apartments', 400, colors);
    fieldsRow.appendChild(nameField);
    formCard.appendChild(fieldsRow);

    const datesRow = createAutoLayoutFrame('Dates', 'HORIZONTAL', 0, 24);
    const closeField = createInputField('Closing Date', 'Jan 15, 2024', 280, colors);
    datesRow.appendChild(closeField);
    const saleField = createInputField('Sale Date', 'Dec 31, 2026', 280, colors);
    datesRow.appendChild(saleField);
    formCard.appendChild(datesRow);

    content.appendChild(formCard);
  } else if (activeTab === 'Entities') {
    const entitiesCard = createCard('Project Entities', frameWidth - 160, 400, colors, radius);
    const entitiesHeaders = ['Name', 'Type', 'Category', 'Contribution', 'Ownership %'];
    const entitiesRows = generateMockRows(entitiesHeaders, { rowCount: 3 });
    const entitiesTable = createTable(
      entitiesHeaders,
      entitiesRows,
      frameWidth - 208,
      colors
    );
    entitiesCard.appendChild(entitiesTable);
    content.appendChild(entitiesCard);
  } else if (activeTab === 'Waterfall') {
    const waterfallCard = createCard('Waterfall Tiers', frameWidth - 160, 400, colors, radius);
    const waterfallHeaders = ['Tier', 'Name', 'Threshold', 'Multiple', 'Rate %'];
    const waterfallRows = generateMockRows(waterfallHeaders, { rowCount: 4 });
    const waterfallTable = createTable(
      waterfallHeaders,
      waterfallRows,
      frameWidth - 208,
      colors
    );
    waterfallCard.appendChild(waterfallTable);
    content.appendChild(waterfallCard);
  }

  frame.appendChild(content);
}

// ============================================
// MAIN GENERATOR
// ============================================

/**
 * Generate all wireframes
 */
export async function generateAllWireframes(
  config: WireframeGeneratorConfig
): Promise<FrameNode[]> {
  const { colors, frameWidth, frameHeight, spacing, columns, radius, branding, navItems } = config;

  // Load fonts
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' })
  ]);

  const frames: FrameNode[] = [];
  let frameIndex = 0;
  let updatedCount = 0;
  let createdCount = 0;

  function getPosition(): { x: number; y: number } {
    const col = frameIndex % columns;
    const row = Math.floor(frameIndex / columns);
    frameIndex++;
    return {
      x: col * (frameWidth + spacing),
      y: row * (frameHeight + spacing)
    };
  }

  // Get predefined pages
  const pages = getPredefinedPages();

  for (const pageConfig of pages) {
    const { frame, isNew } = findOrCreateFrame(pageConfig.name, frameWidth, frameHeight, colors);

    if (isNew) {
      const pos = getPosition();
      frame.x = pos.x;
      frame.y = pos.y;
      createdCount++;
    } else {
      updatedCount++;
    }

    // Generate content based on page type and state
    const pageName = pageConfig.name.toLowerCase();

    if (pageName.includes('login') || pageName.includes('sign up')) {
      generateLoginPage(frame, config);
    } else if (pageName.includes('loading')) {
      generateLoadingState(frame, config);
    } else if (pageName.includes('not signed in')) {
      generateAuthPromptState(frame, config, 'Please sign in to access this page.', 'alert');
    } else if (pageName.includes('no organization')) {
      generateAuthPromptState(frame, config, 'Please select or create an organization.', 'building');
    } else if (pageName.includes('no projects') || pageName.includes('empty')) {
      generateEmptyState(frame, config);
    } else if (pageName.includes('dashboard') || pageName === 'dashboard') {
      generateDashboardPage(frame, config);
    } else if (pageName.includes('waterfall') && (pageName.includes('summary') || !pageName.includes('detail'))) {
      generateWaterfallSummaryPage(frame, config);
    } else if (pageName.includes('settings')) {
      generateSettingsPage(frame, config);
    } else if (pageName.includes('profile')) {
      generateProfilePage(frame, config);
    } else if (pageName.includes('config')) {
      const tabMatch = pageName.match(/(\w+)\s+tab$/i);
      const activeTab = tabMatch ? tabMatch[1] : 'Details';
      generateProjectConfigPage(frame, config, activeTab);
    } else {
      // Generic page with navigation
      createNavBar(frame, frameWidth, colors, branding, navItems);
      const content = createAutoLayoutFrame('Content', 'VERTICAL', 24, 24);
      content.x = 0;
      content.y = 64;
      content.resize(frameWidth, frameHeight - 64);
      content.paddingLeft = 80;
      content.paddingRight = 80;
      content.paddingTop = 32;

      const title = createText(pageConfig.name.split('/').pop() || 'Page', 30, 'Bold', colors.foreground);
      content.appendChild(title);

      frame.appendChild(content);
    }

    frames.push(frame);
  }

  // Position new frames in grid
  frames.filter((_, i) => i >= frames.length - createdCount).forEach((frame, idx) => {
    if (frame.x === 0 && frame.y === 0) {
      const pos = getPosition();
      frame.x = pos.x;
      frame.y = pos.y;
    }
  });

  console.log(`Generated ${createdCount} new wireframes, updated ${updatedCount} existing`);

  return frames;
}
