/**
 * Main Entry Point
 *
 * Figma Plugin entry point that handles all commands.
 * Configuration-driven to support different projects.
 *
 * v2.0.0 - Framework-agnostic support
 * Supports: React/Next.js, Vue/Nuxt, Angular, Plain HTML
 */

import { extractAllTokens } from './parsers/token-parser';
import { getPredefinedComponents } from './parsers/component-parser';
import { getPredefinedPages } from './parsers/page-parser';
import { generateAllVariables } from './generators/variable-generator';
import { generateAllComponents, defaultColors, defaultRadius, ColorPalette } from './generators/component-generator';
import { generateAllWireframes } from './generators/wireframe-generator';
import { PluginConfig, mergeConfig, DEFAULT_CONFIG } from './config/schema';
import { createParser, getSupportedFrameworks } from './parsers/parser-factory';
import { getFrameworkPreset, getFrameworkDisplayNames } from './config/presets';
import type { FrameworkType } from './config/framework-presets';

// ============================================
// CONFIGURATION
// ============================================

// Load configuration - can be overridden by project-specific config
// For Figma plugins, configuration is embedded at build time
// Users should modify these values for their own project
const USER_CONFIG: Partial<PluginConfig> = {
  // Override with your project values:
  // name: 'MyApp',
  // prefix: 'MyApp',
  // framework: 'react-nextjs', // Options: 'react-nextjs' | 'vue-nuxt' | 'angular' | 'html-static'
  // tokenFormat: 'css',        // Options: 'css' | 'style-dictionary'
  // sources: {
  //   tokens: 'app/globals.css',
  //   components: 'components',
  //   pages: 'app'
  // },
  // branding: {
  //   logoText: 'MyApp',
  //   tagline: 'Your application tagline',
  //   description: 'Your application description'
  // },
  // navItems: [
  //   { label: 'Dashboard', path: '/dashboard' },
  //   { label: 'Projects', path: '/projects' },
  //   { label: 'Settings', path: '/settings' }
  // ]
};

// Merge with defaults
const PLUGIN_CONFIG = mergeConfig(USER_CONFIG);

// Legacy CONFIG object for backwards compatibility
const CONFIG = {
  name: PLUGIN_CONFIG.name,
  prefix: PLUGIN_CONFIG.prefix,
  frameWidth: PLUGIN_CONFIG.frameWidth,
  frameHeight: PLUGIN_CONFIG.frameHeight,
  spacing: PLUGIN_CONFIG.spacing,
  columns: PLUGIN_CONFIG.columns,
  branding: PLUGIN_CONFIG.branding,
  navItems: PLUGIN_CONFIG.navItems,
  framework: PLUGIN_CONFIG.framework || 'react-nextjs',
  tokenFormat: PLUGIN_CONFIG.tokenFormat || 'css'
};

// Create parser for the configured framework
const FRAMEWORK = CONFIG.framework as FrameworkType;
const PARSER = createParser(FRAMEWORK);

// ============================================
// CSS CONTENT (inline for Figma plugin)
// ============================================

// Since Figma plugins can't access the filesystem, we embed the CSS tokens
const CSS_TOKENS = `
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
`;

// ============================================
// COMMAND: CREATE VARIABLES
// ============================================

async function createVariables(): Promise<void> {
  try {
    console.log(`Parsing tokens (format: ${CONFIG.tokenFormat})...`);
    const tokens = extractAllTokens(CSS_TOKENS, CONFIG.tokenFormat as any);

    console.log('Generating Figma variables...');
    const result = await generateAllVariables(tokens, CONFIG.prefix);

    const summary = [
      `Color variables: ${Object.keys(tokens.colors.light).length} (light/dark modes)`,
      `Spacing variables: ${tokens.spacing.length}`,
      `Radius variables: ${tokens.radius.length}`,
      `Typography variables: ${tokens.fontSize.length * 2}`,
      `Component size variables: ${Object.keys(tokens.componentSizes).length}`,
      `Text styles: ${result.textStyles.length}`,
      `Effect styles: ${result.effectStyles.length}`
    ].join('\n');

    console.log(summary);
    figma.notify('Variables and styles created successfully!');
  } catch (error) {
    console.error('Error creating variables:', error);
    figma.notify('Error creating variables. Check console for details.');
  }
}

// ============================================
// COMMAND: CREATE COMPONENTS
// ============================================

async function createComponents(): Promise<void> {
  try {
    console.log('Generating Figma components...');

    const components = await generateAllComponents({
      colors: defaultColors,
      radius: defaultRadius,
      prefix: CONFIG.prefix,
      branding: CONFIG.branding,
      navItems: CONFIG.navItems
    });

    // Select and focus on components
    figma.currentPage.selection = components;
    figma.viewport.scrollAndZoomIntoView(components);

    console.log(`Created ${components.length} components`);
    figma.notify(`Created ${components.length} components!`);
  } catch (error) {
    console.error('Error creating components:', error);
    figma.notify('Error creating components. Check console for details.');
  }
}

// ============================================
// COMMAND: CREATE WIREFRAMES
// ============================================

async function createWireframes(): Promise<void> {
  try {
    console.log('Generating page wireframes...');

    const frames = await generateAllWireframes({
      colors: defaultColors,
      radius: defaultRadius,
      frameWidth: CONFIG.frameWidth,
      frameHeight: CONFIG.frameHeight,
      spacing: CONFIG.spacing,
      columns: CONFIG.columns,
      branding: CONFIG.branding,
      navItems: CONFIG.navItems
    });

    // Select and focus on frames
    figma.currentPage.selection = frames;
    figma.viewport.scrollAndZoomIntoView(frames);

    console.log(`Created/updated ${frames.length} wireframes`);
    figma.notify(`Created/updated ${frames.length} page wireframes!`);
  } catch (error) {
    console.error('Error creating wireframes:', error);
    figma.notify('Error creating wireframes. Check console for details.');
  }
}

// ============================================
// COMMAND: SYNC ALL
// ============================================

async function syncAll(): Promise<void> {
  try {
    figma.notify('Starting full sync...');

    // Step 1: Variables
    console.log('Step 1/3: Creating variables...');
    await createVariables();

    // Step 2: Components
    console.log('Step 2/3: Creating components...');
    await createComponents();

    // Step 3: Wireframes
    console.log('Step 3/3: Creating wireframes...');
    await createWireframes();

    figma.notify('Full sync completed!');
  } catch (error) {
    console.error('Error during sync:', error);
    figma.notify('Error during sync. Check console for details.');
  }
}

// ============================================
// COMMAND: LOAD CONFIG
// ============================================

async function loadConfig(): Promise<void> {
  try {
    // Get framework info
    const frameworkPreset = getFrameworkPreset(FRAMEWORK);
    const supportedFrameworks = getFrameworkDisplayNames();

    // In a real implementation, this would load from project.config.json
    // For now, just show the current configuration
    const configSummary = [
      `Project: ${CONFIG.prefix}`,
      `Framework: ${frameworkPreset.name}`,
      `Token Format: ${CONFIG.tokenFormat}`,
      `Frame size: ${CONFIG.frameWidth}x${CONFIG.frameHeight}`,
      `Grid: ${CONFIG.columns} columns, ${CONFIG.spacing}px spacing`,
      '',
      'Supported Frameworks:',
      ...supportedFrameworks.map(f => `  - ${f.id}: ${f.name}`),
      '',
      'Available commands:',
      '- Create Variables: Design tokens from CSS/JSON',
      '- Create Components: UI component library',
      '- Create Wireframes: Full page designs',
      '- Sync All: Run all commands in sequence'
    ].join('\n');

    console.log('Configuration:', configSummary);
    figma.notify('Configuration loaded. Check console for details.');
  } catch (error) {
    console.error('Error loading config:', error);
    figma.notify('Error loading config. Check console for details.');
  }
}

// ============================================
// MAIN - Command Handler
// ============================================

console.log('Figma Sync plugin loaded, command:', figma.command);

// Handle commands from manifest.json
if (figma.command === 'syncAll') {
  console.log('Running syncAll...');
  syncAll().then(() => {
    console.log('syncAll complete');
    figma.closePlugin();
  }).catch((error) => {
    console.error('syncAll failed:', error);
    figma.closePlugin();
  });
} else if (figma.command === 'createVariables') {
  console.log('Running createVariables...');
  createVariables().then(() => {
    console.log('createVariables complete');
    figma.closePlugin();
  }).catch((error) => {
    console.error('createVariables failed:', error);
    figma.closePlugin();
  });
} else if (figma.command === 'createComponents') {
  console.log('Running createComponents...');
  createComponents().then(() => {
    console.log('createComponents complete');
    figma.closePlugin();
  }).catch((error) => {
    console.error('createComponents failed:', error);
    figma.closePlugin();
  });
} else if (figma.command === 'createWireframes') {
  console.log('Running createWireframes...');
  createWireframes().then(() => {
    console.log('createWireframes complete');
    figma.closePlugin();
  }).catch((error) => {
    console.error('createWireframes failed:', error);
    figma.closePlugin();
  });
} else if (figma.command === 'loadConfig') {
  console.log('Running loadConfig...');
  loadConfig().then(() => {
    console.log('loadConfig complete');
    figma.closePlugin();
  }).catch((error) => {
    console.error('loadConfig failed:', error);
    figma.closePlugin();
  });
} else {
  console.log('Unknown command, closing plugin');
  figma.closePlugin();
}

// Export functions for potential external use
export {
  createVariables,
  createComponents,
  createWireframes,
  syncAll,
  loadConfig,
  CONFIG,
  PARSER,
  FRAMEWORK
};
