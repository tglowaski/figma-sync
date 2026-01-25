/**
 * Framework Presets
 *
 * Defines preset configurations for supported frontend frameworks.
 * Each preset includes file patterns, detection rules, and default paths.
 */

import type { FrameworkPreset, FrameworkType } from '../framework-presets';

/**
 * React / Next.js preset
 *
 * Supports:
 * - Next.js App Router (app/page.tsx)
 * - Next.js Pages Router (pages/*.tsx)
 * - React components with CVA variants
 * - CSS custom properties (globals.css)
 */
export const reactNextjsPreset: FrameworkPreset = {
  id: 'react-nextjs',
  name: 'React / Next.js',
  description: 'React components with Next.js App Router or Pages Router',
  patterns: {
    pages: ['app/**/page.tsx', 'app/**/page.jsx', 'pages/**/*.tsx', 'pages/**/*.jsx'],
    components: ['components/**/*.tsx', 'components/**/*.jsx', 'src/components/**/*.tsx'],
    tokens: ['**/globals.css', 'app/globals.css', 'styles/globals.css']
  },
  extensions: {
    component: ['.tsx', '.jsx'],
    style: ['.css', '.scss', '.sass']
  },
  detection: {
    componentExport: 'export\\s+(default\\s+)?function\\s+([A-Z][a-zA-Z0-9]*)|export\\s+const\\s+([A-Z][a-zA-Z0-9]*)\\s*=',
    variantSystem: 'cva\\s*\\(',
    statePatterns: {
      tabs: '<TabsContent[^>]*value=["\']([^"\']+)["\']',
      loading: '(isLoading|loading|pending)\\s*[?&|]|<Skeleton|<Loader|<Spinner|Loading\\.\\.\\.',
      auth: '(isAuthenticated|user|session)\\s*[?&|!]|<AuthGuard|requireAuth|useAuth',
      empty: '(data|items|results)\\s*\\.\\s*length\\s*===?\\s*0|isEmpty|<EmptyState|No\\s+(items|data|results)',
      error: '(error|isError)\\s*[?&|]|<ErrorBoundary|<Alert[^>]*variant=["\']destructive'
    },
    pageTypePatterns: {
      auth: '(login|signin|signup|register|password|forgot|reset|verify)',
      list: '(list|index|browse|search|\\[.*\\])',
      form: '(new|create|edit|add|form)',
      detail: '\\[(id|slug|.*Id)\\]|detail|view',
      dashboard: '(dashboard|overview|home|analytics)'
    }
  },
  defaults: {
    tokensPath: 'app/globals.css',
    componentsPath: 'components',
    pagesPath: 'app'
  }
};

/**
 * Vue / Nuxt preset
 *
 * Supports:
 * - Nuxt 3 pages directory
 * - Vue SFC components
 * - Scoped CSS and Tailwind
 * - defineProps for variants
 */
export const vueNuxtPreset: FrameworkPreset = {
  id: 'vue-nuxt',
  name: 'Vue / Nuxt',
  description: 'Vue 3 SFC components with Nuxt or Vue Router',
  patterns: {
    pages: ['pages/**/*.vue', 'src/pages/**/*.vue', 'src/views/**/*.vue'],
    components: ['components/**/*.vue', 'src/components/**/*.vue'],
    tokens: ['assets/**/*.css', 'assets/css/**/*.css', 'src/assets/**/*.css']
  },
  extensions: {
    component: ['.vue'],
    style: ['.css', '.scss', '.sass', '.less']
  },
  detection: {
    componentExport: '<script[^>]*setup|export\\s+default\\s+defineComponent|defineComponent\\s*\\(',
    variantSystem: 'defineProps|withDefaults|type Props',
    statePatterns: {
      tabs: 'v-if=["\'][^"\']*===?\\s*["\']([^"\']+)["\']|:is=["\']([^"\']+)',
      loading: '(isLoading|loading|pending)\\s*[?&|:]|v-if=["\']loading|<n-skeleton|<el-skeleton',
      auth: '(isAuthenticated|user|useAuth)\\s*[?&|:]|v-if=["\']user|definePageMeta.*auth',
      empty: 'v-if=["\'][^"\']*\\.length\\s*===?\\s*0|v-if=["\']isEmpty|<n-empty|<el-empty',
      error: '(error|isError)\\s*[?&|:]|<n-alert|<el-alert'
    },
    pageTypePatterns: {
      auth: '(login|signin|signup|register|password|forgot|reset|verify)',
      list: '(list|index|browse|search|\\[.*\\])',
      form: '(new|create|edit|add|form)',
      detail: '\\[.*\\]|detail|view',
      dashboard: '(dashboard|overview|home|analytics|index)'
    }
  },
  defaults: {
    tokensPath: 'assets/css/main.css',
    componentsPath: 'components',
    pagesPath: 'pages'
  }
};

/**
 * Angular preset
 *
 * Supports:
 * - Angular standalone components
 * - NgModule-based components
 * - @Input decorators for variants
 * - SCSS/CSS component styles
 */
export const angularPreset: FrameworkPreset = {
  id: 'angular',
  name: 'Angular',
  description: 'Angular components with standalone or NgModule architecture',
  patterns: {
    pages: ['src/app/**/*.component.ts', 'src/app/**/page.component.ts'],
    components: ['src/app/shared/**/*.component.ts', 'src/app/components/**/*.component.ts'],
    tokens: ['src/styles/**/*.scss', 'src/styles/**/*.css', 'src/styles.scss']
  },
  extensions: {
    component: ['.component.ts'],
    style: ['.scss', '.css', '.sass', '.less']
  },
  detection: {
    componentExport: '@Component\\s*\\(|standalone:\\s*true',
    variantSystem: '@Input\\s*\\(|input\\s*<|signal\\s*<',
    statePatterns: {
      tabs: '\\*ngIf=["\'][^"\']*===?\\s*["\']([^"\']+)["\']|\\[ngSwitch\\]|@switch',
      loading: '(isLoading|loading\\$?)\\s*[?|:]|\\*ngIf=["\']!?loading|<mat-spinner|<mat-progress',
      auth: '(isAuthenticated|user|authService)\\s*[?|:]|canActivate|AuthGuard|\\*ngIf=["\']user',
      empty: '\\*ngIf=["\'][^"\']*\\.length\\s*===?\\s*0|\\*ngIf=["\']isEmpty|<mat-card[^>]*empty',
      error: '(error|hasError)\\s*[?|:]|<mat-error'
    },
    pageTypePatterns: {
      auth: '(login|signin|signup|register|password|forgot|reset|verify)',
      list: '(list|index|browse|search|:id)',
      form: '(new|create|edit|add|form)',
      detail: ':id|detail|view',
      dashboard: '(dashboard|overview|home|analytics)'
    }
  },
  defaults: {
    tokensPath: 'src/styles.scss',
    componentsPath: 'src/app/shared',
    pagesPath: 'src/app'
  }
};

/**
 * Plain HTML/CSS preset
 *
 * Supports:
 * - Static HTML pages
 * - CSS files with custom properties
 * - Component templates in separate files
 */
export const htmlStaticPreset: FrameworkPreset = {
  id: 'html-static',
  name: 'Plain HTML/CSS',
  description: 'Static HTML pages with CSS custom properties',
  patterns: {
    pages: ['**/*.html', 'pages/**/*.html', 'src/**/*.html'],
    components: ['components/**/*.html', 'partials/**/*.html', 'templates/**/*.html'],
    tokens: ['**/*.css', 'css/**/*.css', 'styles/**/*.css']
  },
  extensions: {
    component: ['.html'],
    style: ['.css']
  },
  detection: {
    componentExport: '<template|data-component=["\']([^"\']+)',
    variantSystem: 'data-variant|class=["\'][^"\']*variant-',
    statePatterns: {
      tabs: 'data-tab=["\']([^"\']+)|role=["\']tabpanel',
      loading: 'class=["\'][^"\']*loading|data-loading|aria-busy=["\']true',
      auth: 'data-auth-required|data-protected|login-required',
      empty: 'class=["\'][^"\']*empty-state|data-empty|no-results',
      error: 'class=["\'][^"\']*error|data-error|alert-error'
    },
    pageTypePatterns: {
      auth: '(login|signin|signup|register|password|forgot|reset|verify)',
      list: '(list|index|browse|search|catalog)',
      form: '(new|create|edit|add|form|contact)',
      detail: '(detail|view|product|article|post)',
      dashboard: '(dashboard|overview|home|admin)'
    }
  },
  defaults: {
    tokensPath: 'css/variables.css',
    componentsPath: 'components',
    pagesPath: '.'
  }
};

/**
 * All available framework presets
 */
export const FRAMEWORK_PRESETS: Record<FrameworkType, FrameworkPreset> = {
  'react-nextjs': reactNextjsPreset,
  'vue-nuxt': vueNuxtPreset,
  'angular': angularPreset,
  'html-static': htmlStaticPreset
};

/**
 * Get a framework preset by ID
 */
export function getFrameworkPreset(framework: FrameworkType): FrameworkPreset {
  const preset = FRAMEWORK_PRESETS[framework];
  if (!preset) {
    throw new Error(`Unknown framework: ${framework}. Valid options: ${Object.keys(FRAMEWORK_PRESETS).join(', ')}`);
  }
  return preset;
}

/**
 * List all available framework types
 */
export function getAvailableFrameworks(): FrameworkType[] {
  return Object.keys(FRAMEWORK_PRESETS) as FrameworkType[];
}

/**
 * Get framework display names for UI
 */
export function getFrameworkDisplayNames(): Array<{ id: FrameworkType; name: string; description: string }> {
  return Object.values(FRAMEWORK_PRESETS).map(preset => ({
    id: preset.id,
    name: preset.name,
    description: preset.description
  }));
}
