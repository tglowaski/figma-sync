/**
 * Classification Rules
 *
 * Defines the ruleset for classifying imports as Variables, Components, or Wireframes
 */

// ============================================
// VARIABLE RULES
// ============================================

export interface VariableRules {
  include: string[];
  exclude: string[];
  colorPatterns: RegExp[];
  spacingPatterns: RegExp[];
  radiusPatterns: RegExp[];
}

export const variableRules: VariableRules = {
  include: [
    'CSS custom properties (--*)',
    'Tailwind theme extensions',
    'Values repeated 3+ times across components',
    'Semantic color names (primary, secondary, muted)',
    'Spacing scale values (0-96px)',
    'Border radius values'
  ],
  exclude: [
    'One-off magic numbers',
    'Calculated/dynamic values',
    'Layout-specific dimensions (container max-width)'
  ],
  colorPatterns: [
    /--(?:color-)?(\w+(?:-\w+)*):\s*(?:oklch|hsl|rgb|#)/,
    /--(\w+(?:-foreground)?(?:-\w+)*):/
  ],
  spacingPatterns: [
    /--spacing-(\w+):/,
    /gap-(\d+)/,
    /p[xytblr]?-(\d+)/,
    /m[xytblr]?-(\d+)/
  ],
  radiusPatterns: [
    /--radius(?:-(\w+))?:/,
    /rounded-(\w+)/
  ]
};

// ============================================
// COMPONENT RULES
// ============================================

export interface ComponentRules {
  include: string[];
  exclude: string[];
  variantPatterns: {
    cva: RegExp;
    variantExtractor: RegExp;
  };
  statePatterns: RegExp[];
}

export const componentRules: ComponentRules = {
  include: [
    'Located in components/ui/',
    'Exported as named export',
    'Uses cva() or className variants',
    'Has defined props interface',
    'File < 300 lines',
    'No direct data fetching (no useEffect with API calls)',
    'Renders within parent container'
  ],
  exclude: [
    'Contains page-level layout',
    'Manages global state (useAuth, useOrganization)',
    'Has route-specific logic',
    'File > 500 lines',
    'Imports server actions'
  ],
  variantPatterns: {
    // Matches cva("base", { variants: { ... } })
    cva: /cva\s*\(\s*["'`][\s\S]*?["'`]\s*,\s*\{[\s\S]*?variants:\s*\{([\s\S]*?)\}\s*(?:,\s*defaultVariants)?/,
    // Matches variant: { option1: "...", option2: "..." }
    variantExtractor: /(\w+):\s*\{([^}]+)\}/g
  },
  statePatterns: [
    /disabled/i,
    /loading/i,
    /focus/i,
    /hover/i,
    /active/i,
    /error/i,
    /success/i,
    /checked/i
  ]
};

// ============================================
// WIREFRAME RULES
// ============================================

export interface PageState {
  name: string;
  trigger: 'tab' | 'loading' | 'auth' | 'empty' | 'error' | 'conditional' | 'wizard';
  content?: string;
  lineNumber?: number;
}

export interface WizardStep {
  id: string;
  label: string;
  index: number;
}

export interface WireframeRules {
  include: string[];
  exclude: string[];
  multiState: string[];
  stateDetection: {
    tabs: RegExp;
    loading: RegExp[];
    auth: RegExp[];
    empty: RegExp[];
    error: RegExp[];
    wizardSteps: RegExp;
  };
  pageTypePatterns: {
    auth: RegExp;
    list: RegExp;
    form: RegExp;
    detail: RegExp;
    dashboard: RegExp;
  };
  dynamicRoutePattern: RegExp;
}

export const wireframeRules: WireframeRules = {
  include: [
    'Located in app/**/page.tsx',
    'Contains NavigationBar or layout wrapper',
    'Has page-level state management',
    'Renders multiple feature components',
    'File > 100 lines',
    'Uses layout props'
  ],
  exclude: [
    'API routes (route.ts)',
    'Loading states (loading.tsx) - parsed for state detection instead',
    'Error boundaries (error.tsx)',
    'Layout files (layout.tsx) - unless explicitly included'
  ],
  multiState: [
    'Contains <Tabs> with multiple <TabsContent>',
    'Has conditional early returns for loading/auth/empty',
    'Uses useState for active view management'
  ],
  stateDetection: {
    // Matches <TabsContent value="summary">
    tabs: /<TabsContent\s+value=["'](\w+)["']/g,

    // Loading state patterns
    loading: [
      /if\s*\(\s*(?:is)?[Ll]oading\s*\)\s*(?:return|{)/,
      /authLoading\s*\|\|\s*orgLoading/,
      /loading:\s*\w+[Ll]oading/
    ],

    // Auth state patterns
    auth: [
      /if\s*\(\s*!user\s*\)/,
      /if\s*\(\s*!currentOrganization\s*\)/,
      /if\s*\(\s*!session\s*\)/
    ],

    // Empty state patterns
    empty: [
      /if\s*\(\s*\w+\.length\s*===?\s*0\s*\)/,
      /if\s*\(\s*!\w+\s*\|\|\s*\w+\.length\s*===?\s*0\s*\)/,
      /projects\.length\s*===\s*0/
    ],

    // Error state patterns
    error: [
      /if\s*\(\s*error\s*\)/,
      /if\s*\(\s*isError\s*\)/,
      /<PageErrorState/
    ],

    // Wizard steps detection - matches STEPS constant
    wizardSteps: /const\s+STEPS?\s*[=:]\s*\[([\s\S]*?)\]/i
  },

  pageTypePatterns: {
    auth: /\/auth\//,
    list: /<Table/,
    form: /<Form|<form|useForm/,
    detail: /\/\[[\w.]+\]\//,
    dashboard: /metrics|chart|dashboard/i
  },

  dynamicRoutePattern: /\[[\w.]+\]/
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a file path is a dynamic route
 */
export function isDynamicRoute(path: string): boolean {
  return wireframeRules.dynamicRoutePattern.test(path);
}

/**
 * Extract route parameters from a dynamic route path
 */
export function extractRouteParams(path: string): string[] {
  return [...path.matchAll(/\[([\w.]+)\]/g)].map(m => m[1]);
}

/**
 * Detect the page type from file path and content
 */
export function detectPageType(filePath: string, content: string): 'auth' | 'list' | 'form' | 'detail' | 'dashboard' | 'generic' {
  if (wireframeRules.pageTypePatterns.auth.test(filePath)) return 'auth';
  if (wireframeRules.pageTypePatterns.list.test(content)) return 'list';
  if (wireframeRules.pageTypePatterns.form.test(content)) return 'form';
  if (wireframeRules.pageTypePatterns.detail.test(filePath)) return 'detail';
  if (wireframeRules.pageTypePatterns.dashboard.test(content)) return 'dashboard';
  return 'generic';
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Detect page states from content
 */
export function detectPageStates(content: string): PageState[] {
  const states: PageState[] = [];

  // Detect tab states
  const tabRegex = new RegExp(wireframeRules.stateDetection.tabs.source, 'g');
  let tabMatch;
  while ((tabMatch = tabRegex.exec(content)) !== null) {
    const tabName = capitalize(tabMatch[1]);
    // Avoid duplicates
    if (!states.some(s => s.name === tabName && s.trigger === 'tab')) {
      states.push({
        name: tabName,
        trigger: 'tab',
        lineNumber: content.substring(0, tabMatch.index).split('\n').length
      });
    }
  }

  // Detect loading states
  for (const pattern of wireframeRules.stateDetection.loading) {
    if (pattern.test(content)) {
      if (!states.some(s => s.trigger === 'loading')) {
        states.push({ name: 'Loading', trigger: 'loading' });
      }
      break;
    }
  }

  // Detect auth states
  for (const pattern of wireframeRules.stateDetection.auth) {
    if (pattern.test(content)) {
      if (!states.some(s => s.trigger === 'auth')) {
        states.push({ name: 'Not Signed In', trigger: 'auth' });
      }
      break;
    }
  }

  // Detect empty states
  for (const pattern of wireframeRules.stateDetection.empty) {
    if (pattern.test(content)) {
      if (!states.some(s => s.trigger === 'empty')) {
        states.push({ name: 'Empty State', trigger: 'empty' });
      }
      break;
    }
  }

  // Detect error states
  for (const pattern of wireframeRules.stateDetection.error) {
    if (pattern.test(content)) {
      if (!states.some(s => s.trigger === 'error')) {
        states.push({ name: 'Error', trigger: 'error' });
      }
      break;
    }
  }

  return states;
}

/**
 * Detect wizard steps from component content
 */
export function detectWizardSteps(content: string): WizardStep[] {
  const steps: WizardStep[] = [];
  const stepsMatch = content.match(wireframeRules.stateDetection.wizardSteps);

  if (stepsMatch) {
    const stepsContent = stepsMatch[1];
    // Match { id: 'step_id', label: 'Step Label' } patterns
    const stepPattern = /\{\s*id:\s*["'](\w+)["'],\s*label:\s*["']([^"']+)["']/g;
    let match;
    let index = 0;
    while ((match = stepPattern.exec(stepsContent)) !== null) {
      steps.push({
        id: match[1],
        label: match[2],
        index: index++
      });
    }
  }

  return steps;
}

/**
 * Check if a component file should be included based on rules
 */
export function shouldIncludeComponent(filePath: string, content: string): boolean {
  // Check location
  if (!filePath.includes('components/ui/')) {
    return false;
  }

  // Check file size (rough estimate: 1 line ~ 50 chars)
  const lineCount = content.split('\n').length;
  if (lineCount > 500) {
    return false;
  }

  // Exclude test files
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return false;
  }

  // Exclude index files
  if (filePath.endsWith('index.ts') || filePath.endsWith('index.tsx')) {
    return false;
  }

  // Check for global state hooks (exclude)
  if (/useAuth|useOrganization|useSession/.test(content)) {
    return false;
  }

  // Check for named export
  if (!/export\s+(?:function|const|class)\s+\w+/.test(content) &&
      !/export\s+\{/.test(content)) {
    return false;
  }

  return true;
}

/**
 * Check if a page file should be included for wireframe generation
 */
export function shouldIncludeWireframe(filePath: string): boolean {
  // Must be a page.tsx file
  if (!filePath.endsWith('page.tsx')) {
    return false;
  }

  // Exclude API routes
  if (filePath.includes('/api/')) {
    return false;
  }

  // Exclude loading and error files
  if (filePath.includes('loading.tsx') || filePath.includes('error.tsx')) {
    return false;
  }

  return true;
}

/**
 * Generate wireframe name from file path
 */
export function generateWireframeName(filePath: string, state?: string): string {
  // Extract path segments
  const segments = filePath
    .replace(/^.*\/app\//, '')  // Remove leading path up to app/
    .replace(/\/page\.tsx$/, '') // Remove page.tsx
    .split('/')
    .filter(Boolean)
    .map(segment => {
      // Handle dynamic routes
      if (/^\[[\w.]+\]$/.test(segment)) {
        return segment; // Keep [id] as-is
      }
      // Capitalize and format
      return capitalize(segment.replace(/-/g, ' '));
    });

  // Build name
  let name = segments.join(' / ');

  // Handle root page
  if (name === '') {
    name = 'Home';
  }

  // Add state if provided
  if (state) {
    name += ' / ' + state;
  }

  return name;
}

/**
 * Extract component name from file content
 */
export function extractComponentName(content: string): string | null {
  // Try to match function component
  const funcMatch = content.match(/(?:export\s+)?function\s+(\w+)/);
  if (funcMatch) {
    return funcMatch[1];
  }

  // Try to match const component
  const constMatch = content.match(/(?:export\s+)?const\s+(\w+)\s*[=:]/);
  if (constMatch) {
    return constMatch[1];
  }

  return null;
}

/**
 * Extract variants from cva() definition
 */
export function extractCvaVariants(content: string): Record<string, string[]> {
  const variants: Record<string, string[]> = {};

  // Find cva definition
  const cvaMatch = content.match(/cva\s*\([\s\S]*?variants:\s*\{([\s\S]*?)\}\s*(?:,|\})/);
  if (!cvaMatch) {
    return variants;
  }

  const variantsBlock = cvaMatch[1];

  // Extract each variant category
  const variantPattern = /(\w+):\s*\{([^}]+)\}/g;
  let match;
  while ((match = variantPattern.exec(variantsBlock)) !== null) {
    const variantName = match[1];
    const variantOptions = match[2];

    // Extract option names
    const optionNames: string[] = [];
    const optionPattern = /(\w+):/g;
    let optionMatch;
    while ((optionMatch = optionPattern.exec(variantOptions)) !== null) {
      optionNames.push(optionMatch[1]);
    }

    variants[variantName] = optionNames;
  }

  return variants;
}
