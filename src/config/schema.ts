/**
 * Plugin Configuration Schema
 *
 * Defines the configuration structure for the Figma sync plugin.
 * This allows the plugin to be reused across different projects.
 */

/**
 * Content section configuration for wireframe generation.
 * Sections are rendered in order by registered section renderers.
 */
export interface ContentSection {
  /** Section type - maps to a registered section renderer */
  type: string;
  /** Optional title override for the section */
  title?: string;
  /** Optional subtitle for headers */
  subtitle?: string;
  /** Section-specific configuration properties */
  properties?: Record<string, unknown>;
}

/**
 * Page configuration for wireframe generation
 */
export interface PageConfig {
  /** Display name for the wireframe (e.g., "Auth / Login") */
  name: string;
  /** Page type determines generation logic */
  type: 'auth' | 'dashboard' | 'loading' | 'auth-prompt' | 'org-prompt' | 'empty' | 'waterfall' | 'config' | 'wizard' | 'settings' | 'profile' | 'generic';
  /** Optional state variant (e.g., "Summary", "Detail") */
  state?: string | null;
  /** Content sections to render - drives configuration-based generation */
  contentSections?: (ContentSection | string)[];
  /** Whether to show navigation bar (default: true for non-auth pages) */
  hasNavigation?: boolean;
}

/**
 * Navigation items for the nav bar
 */
export interface NavItem {
  /** Display label */
  label: string;
  /** Optional route path */
  path?: string;
}

/**
 * Branding configuration
 */
export interface BrandingConfig {
  /** Text displayed next to logo icon (e.g., "MyApp") */
  logoText: string;
  /** Optional tagline for marketing pages */
  tagline?: string;
  /** Optional description for metadata */
  description?: string;
}

/**
 * Main plugin configuration interface
 */
export interface PluginConfig {
  /** Project name (used in UI and documentation) */
  name: string;
  /** Variable prefix for Figma collections (e.g., "MyApp Colors") */
  prefix: string;
  /** Frame width for wireframes */
  frameWidth: number;
  /** Frame height for wireframes */
  frameHeight: number;
  /** Spacing between frames in grid layout */
  spacing: number;
  /** Number of columns in grid layout */
  columns: number;
  /** Branding configuration */
  branding: BrandingConfig;
  /** Navigation items for nav bar */
  navItems?: NavItem[];
  /** Custom wireframe pages (optional, uses defaults if not provided) */
  pages?: PageConfig[];
}

/**
 * Default navigation items
 */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Projects', path: '/projects' },
  { label: 'Settings', path: '/settings' }
];

/**
 * Default wireframe pages (generic set that works for most apps)
 */
export const DEFAULT_PAGES: PageConfig[] = [
  // Auth Pages
  { name: 'Auth / Login', type: 'auth', state: null },
  { name: 'Auth / Sign Up', type: 'auth', state: null },

  // Dashboard
  { name: 'Dashboard', type: 'dashboard', state: null },

  // Loading State
  { name: 'Loading', type: 'loading', state: null },

  // Auth States
  { name: 'Not Signed In', type: 'auth-prompt', state: null },
  { name: 'No Organization', type: 'org-prompt', state: null },
  { name: 'Empty State', type: 'empty', state: null },

  // Settings & Profile
  { name: 'Settings', type: 'settings', state: null },
  { name: 'Profile', type: 'profile', state: null }
];

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: PluginConfig = {
  name: 'MyApp',
  prefix: 'MyApp',
  frameWidth: 1440,
  frameHeight: 900,
  spacing: 100,
  columns: 3,
  branding: {
    logoText: 'MyApp',
    tagline: 'Your application tagline',
    description: 'Application description'
  },
  navItems: DEFAULT_NAV_ITEMS,
  pages: DEFAULT_PAGES
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: Partial<PluginConfig>): PluginConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    branding: {
      ...DEFAULT_CONFIG.branding,
      ...(userConfig.branding || {})
    },
    navItems: userConfig.navItems || DEFAULT_CONFIG.navItems,
    pages: userConfig.pages || DEFAULT_CONFIG.pages
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: PluginConfig): string[] {
  const errors: string[] = [];

  if (!config.name || config.name.trim() === '') {
    errors.push('Config "name" is required');
  }
  if (!config.prefix || config.prefix.trim() === '') {
    errors.push('Config "prefix" is required');
  }
  if (!config.branding?.logoText || config.branding.logoText.trim() === '') {
    errors.push('Config "branding.logoText" is required');
  }
  if (config.frameWidth < 320 || config.frameWidth > 4096) {
    errors.push('Config "frameWidth" must be between 320 and 4096');
  }
  if (config.frameHeight < 320 || config.frameHeight > 4096) {
    errors.push('Config "frameHeight" must be between 320 and 4096');
  }

  return errors;
}
