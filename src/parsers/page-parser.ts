/**
 * Page Parser
 *
 * Parses Next.js page files to extract wireframe structure and states
 */

import {
  detectPageStates,
  detectWizardSteps,
  detectPageType,
  generateWireframeName,
  shouldIncludeWireframe,
  isDynamicRoute,
  extractRouteParams,
  PageState,
  WizardStep
} from '../rules/classification-rules';

// ============================================
// TYPES
// ============================================

export interface ParsedPage {
  filePath: string;
  name: string;
  pageType: 'auth' | 'list' | 'form' | 'detail' | 'dashboard' | 'generic';
  states: PageState[];
  wizardSteps: WizardStep[];
  hasNavigation: boolean;
  hasTabs: boolean;
  hasTable: boolean;
  hasForm: boolean;
  hasCards: boolean;
  isDynamic: boolean;
  routeParams: string[];
  components: UsedComponent[];
}

export interface UsedComponent {
  name: string;
  importPath: string;
  count: number;
}

export interface WireframeConfig {
  name: string;
  pagePath: string;
  state?: string;
  pageType: string;
  structure: WireframeStructure;
}

export interface WireframeStructure {
  hasNavigation: boolean;
  hasSidebar: boolean;
  hasPageHeader: boolean;
  hasTabs: boolean;
  hasTable: boolean;
  hasForm: boolean;
  hasCards: boolean;
  hasMetrics: boolean;
  contentSections: string[];
}

// ============================================
// PAGE PARSING
// ============================================

/**
 * Parse a page file and extract structure information
 */
export function parsePage(filePath: string, content: string): ParsedPage | null {
  // Check if page should be included
  if (!shouldIncludeWireframe(filePath)) {
    return null;
  }

  // Extract page name
  const name = generateWireframeName(filePath);

  // Detect page type
  const pageType = detectPageType(filePath, content);

  // Detect states
  const states = detectPageStates(content);

  // Detect wizard steps
  const wizardSteps = detectWizardSteps(content);

  // Check for common components
  const hasNavigation = /NavigationBar|<nav|Navbar/.test(content);
  const hasTabs = /<Tabs|TabsContent|TabsList/.test(content);
  const hasTable = /<Table|TableBody|TableRow/.test(content);
  const hasForm = /<Form|<form|useForm/.test(content);
  const hasCards = /<Card|CardContent|CardHeader/.test(content);

  // Check for dynamic route
  const isDynamic = isDynamicRoute(filePath);
  const routeParams = isDynamic ? extractRouteParams(filePath) : [];

  // Extract used components
  const components = extractUsedComponents(content);

  return {
    filePath,
    name,
    pageType,
    states,
    wizardSteps,
    hasNavigation,
    hasTabs,
    hasTable,
    hasForm,
    hasCards,
    isDynamic,
    routeParams,
    components
  };
}

/**
 * Extract used component imports from content
 */
function extractUsedComponents(content: string): UsedComponent[] {
  const components: UsedComponent[] = [];
  const seen = new Set<string>();

  // Match import statements
  const importPattern = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const imports = match[1];
    const path = match[2];

    // Skip non-component imports
    if (!path.includes('components/') && !path.includes('@/components')) {
      continue;
    }

    // Extract individual component names
    const componentNames = imports.split(',').map(s => s.trim().split(' ')[0]);

    for (const name of componentNames) {
      if (!name || seen.has(name)) continue;
      seen.add(name);

      // Count occurrences in the file
      const occurrencePattern = new RegExp(`<${name}[\\s/>]`, 'g');
      const occurrences = (content.match(occurrencePattern) || []).length;

      if (occurrences > 0) {
        components.push({
          name,
          importPath: path,
          count: occurrences
        });
      }
    }
  }

  return components;
}

// ============================================
// WIREFRAME GENERATION
// ============================================

/**
 * Generate wireframe configurations for a page
 */
export function generateWireframeConfigs(page: ParsedPage): WireframeConfig[] {
  const configs: WireframeConfig[] = [];

  // Determine structure
  const structure: WireframeStructure = {
    hasNavigation: page.hasNavigation,
    hasSidebar: page.pageType === 'dashboard' || page.filePath.includes('settings'),
    hasPageHeader: true,
    hasTabs: page.hasTabs,
    hasTable: page.hasTable,
    hasForm: page.hasForm,
    hasCards: page.hasCards,
    hasMetrics: page.pageType === 'dashboard',
    contentSections: []
  };

  // Add content sections based on detected patterns
  if (structure.hasMetrics) {
    structure.contentSections.push('metrics');
  }
  if (structure.hasTabs) {
    structure.contentSections.push('tabs');
  }
  if (structure.hasTable) {
    structure.contentSections.push('table');
  }
  if (structure.hasForm) {
    structure.contentSections.push('form');
  }
  if (structure.hasCards) {
    structure.contentSections.push('cards');
  }

  // Generate config for main state if no tabs
  if (page.states.length === 0 || !page.hasTabs) {
    configs.push({
      name: page.name,
      pagePath: page.filePath,
      pageType: page.pageType,
      structure
    });
  }

  // Generate configs for each state
  for (const state of page.states) {
    // Skip error states by default
    if (state.trigger === 'error') continue;

    const stateName = generateWireframeName(page.filePath, state.name);
    configs.push({
      name: stateName,
      pagePath: page.filePath,
      state: state.name,
      pageType: page.pageType,
      structure: { ...structure }
    });
  }

  // Generate configs for wizard steps
  if (page.wizardSteps.length > 0) {
    for (const step of page.wizardSteps) {
      const stepName = `${page.name} / Step ${step.index + 1} - ${step.label}`;
      configs.push({
        name: stepName,
        pagePath: page.filePath,
        state: step.label,
        pageType: 'form',
        structure: {
          ...structure,
          hasForm: true,
          contentSections: ['wizard-step', 'form']
        }
      });
    }
  }

  return configs;
}

// ============================================
// PREDEFINED PAGE CONFIGURATIONS
// ============================================

/**
 * Get predefined page configurations for DealApp
 */
export function getPredefinedPages(): WireframeConfig[] {
  return [
    // Auth Pages
    {
      name: 'Auth / Login',
      pagePath: 'app/auth/login/page.tsx',
      pageType: 'auth',
      structure: {
        hasNavigation: false,
        hasSidebar: false,
        hasPageHeader: false,
        hasTabs: false,
        hasTable: false,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['auth-card', 'form']
      }
    },
    {
      name: 'Auth / Sign Up',
      pagePath: 'app/auth/signup/page.tsx',
      pageType: 'auth',
      structure: {
        hasNavigation: false,
        hasSidebar: false,
        hasPageHeader: false,
        hasTabs: false,
        hasTable: false,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['auth-card', 'form']
      }
    },

    // Dashboard
    {
      name: 'Dashboard',
      pagePath: 'app/page.tsx',
      pageType: 'dashboard',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: false,
        hasTable: true,
        hasForm: false,
        hasCards: true,
        hasMetrics: true,
        contentSections: ['metrics', 'table', 'chart']
      }
    },

    // Waterfall Page States
    {
      name: 'Waterfall / Loading',
      pagePath: 'app/waterfall/page.tsx',
      state: 'Loading',
      pageType: 'generic',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: false,
        hasTabs: false,
        hasTable: false,
        hasForm: false,
        hasCards: false,
        hasMetrics: false,
        contentSections: ['loading-spinner']
      }
    },
    {
      name: 'Waterfall / Not Signed In',
      pagePath: 'app/waterfall/page.tsx',
      state: 'Not Signed In',
      pageType: 'generic',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: false,
        hasTabs: false,
        hasTable: false,
        hasForm: false,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['auth-prompt']
      }
    },
    {
      name: 'Waterfall / No Organization',
      pagePath: 'app/waterfall/page.tsx',
      state: 'No Organization',
      pageType: 'generic',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: false,
        hasTabs: false,
        hasTable: false,
        hasForm: false,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['org-prompt']
      }
    },
    {
      name: 'Waterfall / No Projects',
      pagePath: 'app/waterfall/page.tsx',
      state: 'Empty State',
      pageType: 'generic',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: false,
        hasTabs: false,
        hasTable: false,
        hasForm: false,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['empty-state']
      }
    },
    {
      name: 'Waterfall / Summary',
      pagePath: 'app/waterfall/page.tsx',
      state: 'Summary',
      pageType: 'list',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: true,
        hasTable: true,
        hasForm: false,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['header', 'project-selector', 'tabs', 'summary-table']
      }
    },
    {
      name: 'Waterfall / Detail',
      pagePath: 'app/waterfall/page.tsx',
      state: 'Detail',
      pageType: 'list',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: true,
        hasTable: true,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['header', 'project-selector', 'tabs', 'sales-input', 'contributions-table', 'distributions-table']
      }
    },

    // Project Config States
    {
      name: 'Projects / [id] / Config / Details Tab',
      pagePath: 'app/projects/[id]/config/page.tsx',
      state: 'Details',
      pageType: 'form',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: true,
        hasTable: false,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['header', 'back-button', 'tabs', 'form-card']
      }
    },
    {
      name: 'Projects / [id] / Config / Entities Tab',
      pagePath: 'app/projects/[id]/config/page.tsx',
      state: 'Entities',
      pageType: 'list',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: true,
        hasTable: true,
        hasForm: false,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['header', 'back-button', 'tabs', 'entity-table']
      }
    },
    {
      name: 'Projects / [id] / Config / Waterfall Tab',
      pagePath: 'app/projects/[id]/config/page.tsx',
      state: 'Waterfall',
      pageType: 'list',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: true,
        hasTable: true,
        hasForm: false,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['header', 'back-button', 'tabs', 'waterfall-table']
      }
    },

    // Project Setup Wizard
    {
      name: 'Projects / [id] / Setup / Step 1 - Sale Proceeds',
      pagePath: 'app/projects/[id]/setup/page.tsx',
      state: 'Sale Proceeds',
      pageType: 'form',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: false,
        hasTable: false,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['wizard-progress', 'form-card']
      }
    },
    {
      name: 'Projects / [id] / Setup / Step 2 - Contributions',
      pagePath: 'app/projects/[id]/setup/page.tsx',
      state: 'Contributions',
      pageType: 'form',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: false,
        hasTable: true,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['wizard-progress', 'form-card', 'table']
      }
    },
    {
      name: 'Projects / [id] / Setup / Step 3 - Review Entities',
      pagePath: 'app/projects/[id]/setup/page.tsx',
      state: 'Review Entities',
      pageType: 'list',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: false,
        hasTable: true,
        hasForm: false,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['wizard-progress', 'entity-table']
      }
    },
    {
      name: 'Projects / [id] / Setup / Step 4 - Waterfall Rules',
      pagePath: 'app/projects/[id]/setup/page.tsx',
      state: 'Waterfall Rules',
      pageType: 'form',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: false,
        hasTable: true,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['wizard-progress', 'waterfall-config']
      }
    },

    // Settings
    {
      name: 'Settings',
      pagePath: 'app/settings/page.tsx',
      pageType: 'form',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: true,
        hasTable: true,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['header', 'tabs', 'settings-form']
      }
    },

    // Profile
    {
      name: 'Profile',
      pagePath: 'app/profile/page.tsx',
      pageType: 'form',
      structure: {
        hasNavigation: true,
        hasSidebar: false,
        hasPageHeader: true,
        hasTabs: true,
        hasTable: false,
        hasForm: true,
        hasCards: true,
        hasMetrics: false,
        contentSections: ['breadcrumb', 'avatar-header', 'tabs', 'form-card']
      }
    }
  ];
}

// ============================================
// PAGE CONTENT EXTRACTION
// ============================================

/**
 * Extract title from page content
 */
export function extractPageTitle(content: string): string | null {
  // Try to find h1 or page title
  const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1Match) return h1Match[1];

  // Try to find text content in title pattern
  const titleMatch = content.match(/["']([^"']+)["']\s*<\/h1>|<h1[^>]*>\s*{?["']?([^"'<}]+)/);
  if (titleMatch) return titleMatch[1] || titleMatch[2];

  // Try to find createText with title pattern
  const createTextMatch = content.match(/className="[^"]*text-3xl[^"]*"[^>]*>([^<]+)/);
  if (createTextMatch) return createTextMatch[1];

  return null;
}

/**
 * Extract subtitle/description from page content
 */
export function extractPageSubtitle(content: string): string | null {
  // Try to find subtitle pattern
  const subtitleMatch = content.match(/className="[^"]*text-muted-foreground[^"]*"[^>]*>([^<]+)/);
  if (subtitleMatch) return subtitleMatch[1];

  return null;
}
