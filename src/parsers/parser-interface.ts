/**
 * Parser Interface
 *
 * Defines the contract for framework-specific parsers.
 * Each framework (React, Vue, Angular, HTML) implements this interface
 * to provide consistent parsing capabilities.
 */

import type {
  FrameworkPreset,
  ParsedPageInfo,
  ParsedComponentInfo,
  PageState,
  PageType
} from '../config/framework-presets';

/**
 * Framework parser interface
 *
 * Implementations handle framework-specific file parsing and detection.
 */
export interface FrameworkParser {
  /**
   * The framework preset this parser handles
   */
  readonly preset: FrameworkPreset;

  /**
   * Check if a file should be included as a page/wireframe
   * @param filePath Path to the file
   * @returns true if the file should be parsed as a page
   */
  shouldIncludePage(filePath: string): boolean;

  /**
   * Parse a page file and extract wireframe information
   * @param filePath Path to the page file
   * @param content File contents
   * @returns Parsed page info or null if not a valid page
   */
  parsePage(filePath: string, content: string): ParsedPageInfo | null;

  /**
   * Detect page states (loading, auth, empty, tabs, etc.)
   * @param content File contents
   * @returns Array of detected page states
   */
  detectPageStates(content: string): PageState[];

  /**
   * Detect the page type based on path and content
   * @param filePath Path to the file
   * @param content File contents
   * @returns Detected page type
   */
  detectPageType(filePath: string, content: string): PageType;

  /**
   * Check if a file should be included as a component
   * @param filePath Path to the file
   * @param content File contents
   * @returns true if the file should be parsed as a component
   */
  shouldIncludeComponent(filePath: string, content: string): boolean;

  /**
   * Parse a component file and extract variant information
   * @param filePath Path to the component file
   * @param content File contents
   * @returns Parsed component info or null if not a valid component
   */
  parseComponent(filePath: string, content: string): ParsedComponentInfo | null;

  /**
   * Extract variant definitions from component content
   * @param content File contents
   * @returns Map of variant names to their options
   */
  extractVariants(content: string): Record<string, string[]>;

  /**
   * Check if a route/path is dynamic (has parameters)
   * @param filePath Path to check
   * @returns true if the path contains dynamic segments
   */
  isDynamicRoute(filePath: string): boolean;

  /**
   * Extract route parameters from a path
   * @param filePath Path to extract from
   * @returns Array of parameter names
   */
  extractRouteParams(filePath: string): string[];

  /**
   * Generate a wireframe name from a file path
   * @param filePath Path to the file
   * @param pageType Detected page type
   * @returns Human-readable wireframe name
   */
  generateWireframeName(filePath: string, pageType: PageType): string;
}

/**
 * Parser configuration options
 */
export interface ParserOptions {
  /** Include files matching these additional patterns */
  includePatterns?: string[];
  /** Exclude files matching these patterns */
  excludePatterns?: string[];
  /** Custom page type detection overrides */
  pageTypeOverrides?: Record<string, PageType>;
}
