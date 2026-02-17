/**
 * Prebuild Salesforce Script
 *
 * Node.js script (run via `npx tsx`) that reads SLDS CSS and Salesforce
 * component sources at build time, then writes TypeScript modules to
 * src/generated/ for embedding in the Figma plugin bundle.
 *
 * Usage: npx tsx scripts/prebuild-salesforce.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIGURATION
// ============================================

interface PrebuildConfig {
  /** Path to Salesforce DX project root */
  projectPath: string;
  /** Package directory within the project */
  packageDirectory: string;
  /** Path to SLDS CSS file (optional, falls back to npm package) */
  sldsCssPath?: string;
  /** Output directory for generated files */
  outputDir: string;
}

function loadConfig(): PrebuildConfig {
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const pluginRoot = path.resolve(scriptDir, '..');
  const outputDir = path.join(pluginRoot, 'src', 'generated');

  // Try to read project.config.json for paths
  let projectPath = '';
  let packageDirectory = 'force-app/main/default';

  const configPath = path.join(pluginRoot, 'src', 'config', 'project.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      if (config.salesforce?.projectPath) {
        projectPath = path.resolve(pluginRoot, config.salesforce.projectPath);
      }
      if (config.salesforce?.packageDirectory) {
        packageDirectory = config.salesforce.packageDirectory;
      }
    } catch (e) {
      console.warn('Warning: Could not parse project.config.json, using defaults');
    }
  }

  // Default: look for sibling Salesforce project
  if (!projectPath) {
    // Check common sibling locations
    const candidates = [
      path.resolve(pluginRoot, '..', 'FigmaSalesforceTest'),
      path.resolve(pluginRoot, 'FigmaSalesforceTest'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(path.join(candidate, 'sfdx-project.json'))) {
        projectPath = candidate;
        break;
      }
    }
  }

  // Resolve SLDS CSS path
  let sldsCssPath: string | undefined;
  const npmSldsPath = path.join(
    pluginRoot, 'node_modules', '@salesforce-ux', 'design-system',
    'assets', 'styles', 'salesforce-lightning-design-system.css'
  );
  if (fs.existsSync(npmSldsPath)) {
    sldsCssPath = npmSldsPath;
  }

  return {
    projectPath,
    packageDirectory,
    sldsCssPath,
    outputDir
  };
}

// ============================================
// SLDS TOKEN EXTRACTION
// ============================================

function readSldsTokens(config: PrebuildConfig): string {
  if (config.sldsCssPath && fs.existsSync(config.sldsCssPath)) {
    console.log(`Reading SLDS CSS from: ${config.sldsCssPath}`);
    const fullCss = fs.readFileSync(config.sldsCssPath, 'utf-8');

    // Extract only :root and :host blocks containing CSS custom properties.
    // The full SLDS CSS is ~1MB which is too large for Figma's JS engine.
    // The token parser only needs the custom property declarations.
    const extracted = extractCssCustomPropertyBlocks(fullCss);
    console.log(`  Full CSS: ${(fullCss.length / 1024).toFixed(0)}KB → Extracted tokens: ${(extracted.length / 1024).toFixed(1)}KB`);
    return extracted;
  }

  console.log('SLDS CSS not found in node_modules, using empty string');
  console.log('Install @salesforce-ux/design-system for full SLDS token support');
  return '';
}

/**
 * Extract only :root { ... } and :host { ... } blocks from CSS content.
 * These blocks contain the CSS custom property declarations that the
 * SLDS token parser needs. Strips everything else (selectors, rules, media queries).
 */
function extractCssCustomPropertyBlocks(css: string): string {
  const blocks: string[] = [];

  // Match :root { ... } blocks (non-greedy, handling nested braces)
  const selectorPattern = /(:root|:host)\s*\{/g;
  let match;

  while ((match = selectorPattern.exec(css)) !== null) {
    const startIndex = match.index;
    const openBrace = match.index + match[0].length - 1;

    // Find matching closing brace (handle nesting)
    let depth = 1;
    let i = openBrace + 1;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }

    const block = css.slice(startIndex, i);

    // Only include blocks that actually contain custom properties (--*)
    if (/--[\w-]+\s*:/.test(block)) {
      blocks.push(block);
    }
  }

  return blocks.join('\n\n');
}

// ============================================
// LWC COMPONENT SCANNING
// ============================================

interface LwcSourceData {
  name: string;
  jsContent: string;
  htmlContent: string;
  cssContent: string;
  metaXml: string;
}

function scanLwcComponents(config: PrebuildConfig): LwcSourceData[] {
  const components: LwcSourceData[] = [];

  if (!config.projectPath) {
    console.log('No Salesforce project path configured, skipping LWC scan');
    return components;
  }

  const lwcDir = path.join(config.projectPath, config.packageDirectory, 'lwc');

  if (!fs.existsSync(lwcDir)) {
    console.log(`LWC directory not found: ${lwcDir}`);
    return components;
  }

  console.log(`Scanning LWC components in: ${lwcDir}`);
  const entries = fs.readdirSync(lwcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const componentName = entry.name;
    const componentDir = path.join(lwcDir, componentName);

    // Read component files
    const jsPath = path.join(componentDir, `${componentName}.js`);
    const htmlPath = path.join(componentDir, `${componentName}.html`);
    const cssPath = path.join(componentDir, `${componentName}.css`);
    const metaPath = path.join(componentDir, `${componentName}.js-meta.xml`);

    // Skip if no JS file (not a valid LWC component)
    if (!fs.existsSync(jsPath)) continue;

    const data: LwcSourceData = {
      name: componentName,
      jsContent: readFileIfExists(jsPath),
      htmlContent: readFileIfExists(htmlPath),
      cssContent: readFileIfExists(cssPath),
      metaXml: readFileIfExists(metaPath)
    };

    components.push(data);
    console.log(`  Found LWC: ${componentName}`);
  }

  return components;
}

// ============================================
// AURA COMPONENT SCANNING
// ============================================

interface AuraSourceData {
  name: string;
  cmpContent: string;
  cssContent: string;
  controllerJs: string;
  helperJs: string;
}

function scanAuraComponents(config: PrebuildConfig): AuraSourceData[] {
  const components: AuraSourceData[] = [];

  if (!config.projectPath) {
    console.log('No Salesforce project path configured, skipping Aura scan');
    return components;
  }

  const auraDir = path.join(config.projectPath, config.packageDirectory, 'aura');

  if (!fs.existsSync(auraDir)) {
    console.log(`Aura directory not found: ${auraDir}`);
    return components;
  }

  console.log(`Scanning Aura components in: ${auraDir}`);
  const entries = fs.readdirSync(auraDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const componentName = entry.name;
    const componentDir = path.join(auraDir, componentName);

    // Read component files
    const cmpPath = path.join(componentDir, `${componentName}.cmp`);
    const cssPath = path.join(componentDir, `${componentName}.css`);
    const controllerPath = path.join(componentDir, `${componentName}Controller.js`);
    const helperPath = path.join(componentDir, `${componentName}Helper.js`);

    // Skip if no .cmp file (not a valid Aura component)
    if (!fs.existsSync(cmpPath)) continue;

    const data: AuraSourceData = {
      name: componentName,
      cmpContent: readFileIfExists(cmpPath),
      cssContent: readFileIfExists(cssPath),
      controllerJs: readFileIfExists(controllerPath),
      helperJs: readFileIfExists(helperPath)
    };

    components.push(data);
    console.log(`  Found Aura: ${componentName}`);
  }

  return components;
}

// ============================================
// FILE GENERATION
// ============================================

function writeSldsTokensFile(outputDir: string, cssContent: string): void {
  const filePath = path.join(outputDir, 'slds-tokens.ts');
  const escaped = cssContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const content = `/**
 * SLDS CSS Tokens (generated by prebuild-salesforce.ts)
 *
 * DO NOT EDIT - This file is auto-generated at build time.
 * Run \`npm run prebuild:salesforce\` to regenerate.
 */

export const SLDS_CSS_TOKENS = \`${escaped}\`;
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Written: ${filePath} (${cssContent.length} chars)`);
}

function writeLwcComponentsFile(outputDir: string, components: LwcSourceData[]): void {
  const filePath = path.join(outputDir, 'lwc-components.ts');

  const serialized = components.map(c => {
    return `  {
    name: ${JSON.stringify(c.name)},
    jsContent: ${JSON.stringify(c.jsContent)},
    htmlContent: ${JSON.stringify(c.htmlContent)},
    cssContent: ${JSON.stringify(c.cssContent)},
    metaXml: ${JSON.stringify(c.metaXml)}
  }`;
  }).join(',\n');

  const content = `/**
 * LWC Component Source Data (generated by prebuild-salesforce.ts)
 *
 * DO NOT EDIT - This file is auto-generated at build time.
 * Run \`npm run prebuild:salesforce\` to regenerate.
 */

export interface LwcSourceData {
  name: string;
  jsContent: string;
  htmlContent: string;
  cssContent: string;
  metaXml: string;
}

export const LWC_COMPONENTS: LwcSourceData[] = [
${serialized}
];
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Written: ${filePath} (${components.length} components)`);
}

function writeAuraComponentsFile(outputDir: string, components: AuraSourceData[]): void {
  const filePath = path.join(outputDir, 'aura-components.ts');

  const serialized = components.map(c => {
    return `  {
    name: ${JSON.stringify(c.name)},
    cmpContent: ${JSON.stringify(c.cmpContent)},
    cssContent: ${JSON.stringify(c.cssContent)},
    controllerJs: ${JSON.stringify(c.controllerJs)},
    helperJs: ${JSON.stringify(c.helperJs)}
  }`;
  }).join(',\n');

  const content = `/**
 * Aura Component Source Data (generated by prebuild-salesforce.ts)
 *
 * DO NOT EDIT - This file is auto-generated at build time.
 * Run \`npm run prebuild:salesforce\` to regenerate.
 */

export interface AuraSourceData {
  name: string;
  cmpContent: string;
  cssContent: string;
  controllerJs: string;
  helperJs: string;
}

export const AURA_COMPONENTS: AuraSourceData[] = [
${serialized}
];
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Written: ${filePath} (${components.length} components)`);
}

// ============================================
// UTILITIES
// ============================================

function readFileIfExists(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ============================================
// MAIN
// ============================================

function main(): void {
  console.log('=== Salesforce Prebuild Script ===\n');

  const config = loadConfig();
  console.log('Configuration:');
  console.log(`  Project path: ${config.projectPath || '(not found)'}`);
  console.log(`  Package dir: ${config.packageDirectory}`);
  console.log(`  SLDS CSS: ${config.sldsCssPath || '(not found)'}`);
  console.log(`  Output dir: ${config.outputDir}`);
  console.log('');

  // Ensure output directory exists
  ensureDir(config.outputDir);

  // Step 1: Read SLDS tokens
  console.log('Step 1: Reading SLDS tokens...');
  const sldsCss = readSldsTokens(config);

  // Step 2: Scan LWC components
  console.log('\nStep 2: Scanning LWC components...');
  const lwcComponents = scanLwcComponents(config);

  // Step 3: Scan Aura components
  console.log('\nStep 3: Scanning Aura components...');
  const auraComponents = scanAuraComponents(config);

  // Step 4: Write generated files
  console.log('\nStep 4: Writing generated files...');
  writeSldsTokensFile(config.outputDir, sldsCss);
  writeLwcComponentsFile(config.outputDir, lwcComponents);
  writeAuraComponentsFile(config.outputDir, auraComponents);

  // Summary
  console.log('\n=== Prebuild Complete ===');
  console.log(`  SLDS tokens: ${sldsCss.length > 0 ? 'loaded' : 'empty (defaults will be used)'}`);
  console.log(`  LWC components: ${lwcComponents.length}`);
  console.log(`  Aura components: ${auraComponents.length}`);
}

main();
