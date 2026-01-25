/**
 * Base Parser
 *
 * Provides shared functionality for all framework parsers.
 * Framework-specific parsers extend this class and implement
 * abstract methods for their detection patterns.
 */

import type {
  FrameworkPreset,
  ParsedPageInfo,
  ParsedComponentInfo,
  PageState,
  PageType
} from '../config/framework-presets';
import type { FrameworkParser, ParserOptions } from './parser-interface';

/**
 * Abstract base parser with shared utilities
 */
export abstract class BaseParser implements FrameworkParser {
  constructor(
    public readonly preset: FrameworkPreset,
    protected readonly options: ParserOptions = {}
  ) {}

  /**
   * Check if file path matches any of the given glob patterns
   * Simple glob matching implementation for common patterns
   */
  protected matchesPattern(filePath: string, patterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');

    return patterns.some(pattern => {
      // Convert glob to regex
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '{{GLOBSTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/{{GLOBSTAR}}/g, '.*');

      const regex = new RegExp(`(^|/)${regexPattern}$`);
      return regex.test(normalizedPath);
    });
  }

  /**
   * Check if file should be included based on patterns
   */
  shouldIncludePage(filePath: string): boolean {
    // Check exclude patterns first
    if (this.options.excludePatterns?.length) {
      if (this.matchesPattern(filePath, this.options.excludePatterns)) {
        return false;
      }
    }

    // Check include patterns (framework defaults + custom)
    const patterns = [
      ...this.preset.patterns.pages,
      ...(this.options.includePatterns || [])
    ];

    return this.matchesPattern(filePath, patterns);
  }

  /**
   * Check if file should be included as a component
   */
  shouldIncludeComponent(filePath: string, content: string): boolean {
    // Check if path matches component patterns
    if (!this.matchesPattern(filePath, this.preset.patterns.components)) {
      return false;
    }

    // Check if content has a valid component export
    const exportPattern = new RegExp(this.preset.detection.componentExport);
    return exportPattern.test(content);
  }

  /**
   * Detect page type from path and content
   */
  detectPageType(filePath: string, content: string): PageType {
    const normalizedPath = filePath.toLowerCase();

    // Check custom overrides first
    if (this.options.pageTypeOverrides) {
      for (const [pattern, type] of Object.entries(this.options.pageTypeOverrides)) {
        if (normalizedPath.includes(pattern)) {
          return type;
        }
      }
    }

    // Check framework-specific patterns
    const { pageTypePatterns } = this.preset.detection;

    if (new RegExp(pageTypePatterns.auth, 'i').test(normalizedPath)) {
      return 'auth';
    }
    if (new RegExp(pageTypePatterns.dashboard, 'i').test(normalizedPath)) {
      return 'dashboard';
    }
    if (new RegExp(pageTypePatterns.form, 'i').test(normalizedPath)) {
      return 'form';
    }
    if (new RegExp(pageTypePatterns.detail, 'i').test(normalizedPath)) {
      return 'detail';
    }
    if (new RegExp(pageTypePatterns.list, 'i').test(normalizedPath)) {
      return 'list';
    }

    return 'generic';
  }

  /**
   * Detect page states from content
   */
  detectPageStates(content: string): PageState[] {
    const states: PageState[] = [];
    const { statePatterns } = this.preset.detection;

    // Detect tabs
    const tabRegex = new RegExp(statePatterns.tabs, 'g');
    let tabMatch;
    while ((tabMatch = tabRegex.exec(content)) !== null) {
      const value = tabMatch[1] || tabMatch[2];
      if (value && !states.some(s => s.type === 'tab' && s.value === value)) {
        states.push({
          type: 'tab',
          value,
          label: this.capitalize(value)
        });
      }
    }

    // Detect loading state
    if (new RegExp(statePatterns.loading).test(content)) {
      states.push({ type: 'loading', value: 'loading', label: 'Loading' });
    }

    // Detect auth state
    if (new RegExp(statePatterns.auth).test(content)) {
      states.push({ type: 'auth', value: 'not-authenticated', label: 'Not Authenticated' });
    }

    // Detect empty state
    if (new RegExp(statePatterns.empty).test(content)) {
      states.push({ type: 'empty', value: 'empty', label: 'Empty State' });
    }

    // Detect error state
    if (new RegExp(statePatterns.error).test(content)) {
      states.push({ type: 'error', value: 'error', label: 'Error State' });
    }

    return states;
  }

  /**
   * Check if route is dynamic
   */
  isDynamicRoute(filePath: string): boolean {
    // Common dynamic route patterns across frameworks
    // [param] for Next.js, :param for Vue Router/Angular
    return /\[([^\]]+)\]|:([^/]+)/.test(filePath);
  }

  /**
   * Extract route parameters
   */
  extractRouteParams(filePath: string): string[] {
    const params: string[] = [];

    // Next.js style: [param], [...param], [[...param]]
    const nextjsMatches = filePath.matchAll(/\[{1,2}\.{0,3}([^\]]+)\]{1,2}/g);
    for (const match of nextjsMatches) {
      params.push(match[1]);
    }

    // Vue Router / Angular style: :param
    const colonMatches = filePath.matchAll(/:([^/]+)/g);
    for (const match of colonMatches) {
      params.push(match[1]);
    }

    return params;
  }

  /**
   * Generate wireframe name from path
   */
  generateWireframeName(filePath: string, pageType: PageType): string {
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Remove common prefixes
    let name = normalizedPath
      .replace(/^(app|pages|src\/app|src\/pages|src\/views)\//i, '')
      .replace(/\/(page|index)\.(tsx?|jsx?|vue|html)$/i, '')
      .replace(/\.(component|page)\.(tsx?|html)$/i, '')
      .replace(/\.(tsx?|jsx?|vue|html)$/i, '');

    // Handle dynamic routes
    name = name
      .replace(/\[{1,2}\.{0,3}([^\]]+)\]{1,2}/g, ':$1')
      .replace(/\/\//g, '/');

    // Convert path to title case
    const parts = name.split('/').filter(Boolean);
    const title = parts
      .map(part => this.capitalize(part.replace(/[-_]/g, ' ')))
      .join(' / ');

    return title || 'Home';
  }

  /**
   * Parse a page file
   * Subclasses should override for framework-specific parsing
   */
  parsePage(filePath: string, content: string): ParsedPageInfo | null {
    if (!this.shouldIncludePage(filePath)) {
      return null;
    }

    const pageType = this.detectPageType(filePath, content);
    const states = this.detectPageStates(content);

    return {
      filePath,
      name: this.generateWireframeName(filePath, pageType),
      pageType,
      states,
      hasNavigation: pageType !== 'auth',
      hasTabs: states.some(s => s.type === 'tab'),
      hasTable: this.detectTable(content),
      hasForm: this.detectForm(content),
      hasCards: this.detectCards(content),
      isDynamic: this.isDynamicRoute(filePath),
      routeParams: this.extractRouteParams(filePath)
    };
  }

  /**
   * Parse a component file
   * Subclasses should override for framework-specific parsing
   */
  parseComponent(filePath: string, content: string): ParsedComponentInfo | null {
    if (!this.shouldIncludeComponent(filePath, content)) {
      return null;
    }

    const name = this.extractComponentName(filePath, content);
    const variants = this.extractVariants(content);
    const props = this.extractProps(content);

    return {
      name,
      filePath,
      variants,
      props,
      category: this.detectComponentCategory(name, content)
    };
  }

  /**
   * Extract variants from content
   * Subclasses should override for framework-specific extraction
   */
  abstract extractVariants(content: string): Record<string, string[]>;

  /**
   * Extract component name from file/content
   */
  protected extractComponentName(filePath: string, content: string): string {
    // Try to extract from export statement
    const exportPattern = new RegExp(this.preset.detection.componentExport);
    const match = content.match(exportPattern);
    if (match) {
      // Return the captured group that contains the name
      for (let i = 1; i < match.length; i++) {
        if (match[i] && /^[A-Z]/.test(match[i])) {
          return match[i];
        }
      }
    }

    // Fall back to file name
    const fileName = filePath.split('/').pop() || '';
    return this.capitalize(
      fileName
        .replace(/\.(component|page)?\.(tsx?|jsx?|vue|html)$/, '')
        .replace(/[-_]/g, '')
    );
  }

  /**
   * Extract props from content
   * Subclasses should override for framework-specific extraction
   */
  protected extractProps(content: string): string[] {
    return [];
  }

  /**
   * Detect component category
   */
  protected detectComponentCategory(name: string, content: string): string {
    const nameLower = name.toLowerCase();
    const contentLower = content.toLowerCase();

    if (/button|btn/i.test(nameLower)) return 'form-controls';
    if (/input|textarea|select|checkbox|radio|switch|slider/i.test(nameLower)) return 'form-controls';
    if (/form|field/i.test(nameLower)) return 'form-controls';
    if (/alert|toast|notification|snackbar/i.test(nameLower)) return 'feedback';
    if (/loading|spinner|skeleton|progress/i.test(nameLower)) return 'feedback';
    if (/nav|menu|breadcrumb|tab|pagination/i.test(nameLower)) return 'navigation';
    if (/table|list|grid|card|badge|avatar|tag/i.test(nameLower)) return 'data-display';
    if (/modal|dialog|drawer|sheet|popover|tooltip|dropdown/i.test(nameLower)) return 'overlay';
    if (/container|layout|stack|flex|grid/i.test(nameLower)) return 'layout';
    if (/text|heading|title|label|paragraph/i.test(nameLower)) return 'typography';

    // Check content for clues
    if (/<form|onSubmit|handleSubmit/i.test(contentLower)) return 'form-controls';
    if (/<table|<thead|<tbody/i.test(contentLower)) return 'data-display';

    return 'general';
  }

  /**
   * Detect if content contains a table
   */
  protected detectTable(content: string): boolean {
    return /<table|<Table|DataTable|TanStackTable|useReactTable/i.test(content);
  }

  /**
   * Detect if content contains a form
   */
  protected detectForm(content: string): boolean {
    return /<form|<Form|useForm|handleSubmit|onSubmit/i.test(content);
  }

  /**
   * Detect if content contains cards
   */
  protected detectCards(content: string): boolean {
    return /<Card|CardContent|CardHeader|<mat-card|n-card|el-card/i.test(content);
  }

  /**
   * Capitalize first letter of a string
   */
  protected capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
