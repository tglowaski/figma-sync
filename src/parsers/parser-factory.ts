/**
 * Parser Factory
 *
 * Creates framework-specific parsers based on configuration.
 * Provides a single entry point for obtaining the correct parser.
 */

import type { FrameworkType } from '../config/framework-presets';
import type { FrameworkParser, ParserOptions } from './parser-interface';
import { getFrameworkPreset } from '../config/presets';
import { ReactParser } from './react-parser';
import { VueParser } from './vue-parser';
import { AngularParser } from './angular-parser';
import { HtmlParser } from './html-parser';

/**
 * Parser constructor type
 */
type ParserConstructor = new (options?: ParserOptions) => FrameworkParser;

/**
 * Registry of parser constructors by framework
 */
const PARSER_REGISTRY: Record<FrameworkType, ParserConstructor> = {
  'react-nextjs': ReactParser,
  'vue-nuxt': VueParser,
  'angular': AngularParser,
  'html-static': HtmlParser
};

/**
 * Create a parser for the specified framework
 *
 * @param framework Framework type to create parser for
 * @param options Optional parser configuration
 * @returns Framework-specific parser instance
 *
 * @example
 * ```typescript
 * const parser = createParser('react-nextjs');
 * const pageInfo = parser.parsePage('app/dashboard/page.tsx', content);
 * ```
 */
export function createParser(
  framework: FrameworkType,
  options?: ParserOptions
): FrameworkParser {
  const ParserClass = PARSER_REGISTRY[framework];

  if (!ParserClass) {
    throw new Error(
      `No parser registered for framework: ${framework}. ` +
      `Available frameworks: ${Object.keys(PARSER_REGISTRY).join(', ')}`
    );
  }

  return new ParserClass(options);
}

/**
 * Check if a parser exists for the given framework
 *
 * @param framework Framework type to check
 * @returns true if a parser is registered
 */
export function hasParser(framework: string): framework is FrameworkType {
  return framework in PARSER_REGISTRY;
}

/**
 * Get list of supported frameworks
 *
 * @returns Array of framework types with parser support
 */
export function getSupportedFrameworks(): FrameworkType[] {
  return Object.keys(PARSER_REGISTRY) as FrameworkType[];
}

/**
 * Auto-detect framework from project files
 *
 * @param fileList List of file paths in the project
 * @returns Detected framework type or 'react-nextjs' as default
 */
export function detectFramework(fileList: string[]): FrameworkType {
  const hasVue = fileList.some(f => f.endsWith('.vue'));
  const hasAngular = fileList.some(f => f.endsWith('.component.ts'));
  const hasReact = fileList.some(f =>
    f.endsWith('.tsx') || f.endsWith('.jsx') ||
    f.includes('package.json') // Will need to check contents
  );
  const hasNextjs = fileList.some(f =>
    f.includes('app/') && f.endsWith('page.tsx') ||
    f.includes('pages/') && f.endsWith('.tsx')
  );

  // Priority order: Next.js > Vue > Angular > React > HTML
  if (hasNextjs) return 'react-nextjs';
  if (hasVue) return 'vue-nuxt';
  if (hasAngular) return 'angular';
  if (hasReact) return 'react-nextjs';

  return 'html-static';
}
