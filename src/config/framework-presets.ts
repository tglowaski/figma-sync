/**
 * Framework Presets - Type Definitions
 *
 * Defines the structure for framework-specific configurations,
 * enabling the plugin to work with React, Vue, Angular, and plain HTML projects.
 */

/**
 * Supported frontend frameworks
 */
export type FrameworkType = 'react-nextjs' | 'vue-nuxt' | 'angular' | 'html-static';

/**
 * Token output formats
 */
export type TokenFormat = 'css' | 'style-dictionary';

/**
 * Page type classification
 */
export type PageType = 'auth' | 'list' | 'form' | 'detail' | 'dashboard' | 'generic';

/**
 * Page state types
 */
export interface PageState {
  type: 'tab' | 'loading' | 'auth' | 'empty' | 'error' | 'wizard';
  value: string;
  label?: string;
}

/**
 * Parsed page information
 */
export interface ParsedPageInfo {
  filePath: string;
  name: string;
  pageType: PageType;
  states: PageState[];
  hasNavigation: boolean;
  hasTabs: boolean;
  hasTable: boolean;
  hasForm: boolean;
  hasCards: boolean;
  isDynamic: boolean;
  routeParams: string[];
}

/**
 * Parsed component information
 */
export interface ParsedComponentInfo {
  name: string;
  filePath: string;
  variants: Record<string, string[]>;
  props: string[];
  category: string;
  hasAsChild?: boolean;
}

/**
 * Framework-specific detection patterns
 */
export interface DetectionPatterns {
  /** Pattern for detecting component exports (regex string) */
  componentExport: string;
  /** Pattern for variant system (cva, defineProps, @Input, etc.) */
  variantSystem: string;
  /** Patterns for detecting page states */
  statePatterns: {
    tabs: string;
    loading: string;
    auth: string;
    empty: string;
    error: string;
  };
  /** Patterns for detecting page types */
  pageTypePatterns: {
    auth: string;
    list: string;
    form: string;
    detail: string;
    dashboard: string;
  };
}

/**
 * Framework preset configuration
 */
export interface FrameworkPreset {
  /** Unique identifier */
  id: FrameworkType;
  /** Human-readable name */
  name: string;
  /** Display description */
  description: string;
  /** Glob patterns for finding files */
  patterns: {
    /** Page file patterns */
    pages: string[];
    /** Component file patterns */
    components: string[];
    /** Token file patterns */
    tokens: string[];
  };
  /** File extensions for different file types */
  extensions: {
    /** Component file extensions */
    component: string[];
    /** Style file extensions */
    style: string[];
  };
  /** Detection patterns for parsing */
  detection: DetectionPatterns;
  /** Default paths for project structure */
  defaults: {
    /** Default token source path */
    tokensPath: string;
    /** Default components directory */
    componentsPath: string;
    /** Default pages directory */
    pagesPath: string;
  };
}

/**
 * Source path overrides for configuration
 */
export interface SourceOverrides {
  /** Custom token source path */
  tokens?: string;
  /** Custom components directory */
  components?: string;
  /** Custom pages directory */
  pages?: string;
}
