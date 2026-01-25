/**
 * React / Next.js Parser
 *
 * Parses React components and Next.js pages to extract
 * wireframe and component information.
 */

import { reactNextjsPreset } from '../config/presets';
import type { ParsedPageInfo, PageState } from '../config/framework-presets';
import { BaseParser } from './base-parser';
import type { ParserOptions } from './parser-interface';

/**
 * React/Next.js specific parser implementation
 */
export class ReactParser extends BaseParser {
  constructor(options?: ParserOptions) {
    super(reactNextjsPreset, options);
  }

  /**
   * Detect page states with React-specific patterns
   */
  detectPageStates(content: string): PageState[] {
    const states = super.detectPageStates(content);

    // Detect wizard steps (STEPS constant pattern)
    const stepsMatch = content.match(/const\s+STEPS\s*=\s*\[([^\]]+)\]/);
    if (stepsMatch) {
      const stepsContent = stepsMatch[1];
      const stepMatches = stepsContent.matchAll(/['"]([^'"]+)['"]/g);
      for (const match of stepMatches) {
        states.push({
          type: 'wizard',
          value: match[1],
          label: this.capitalize(match[1].replace(/[-_]/g, ' '))
        });
      }
    }

    // Detect React Query / SWR loading states
    if (/useQuery|useSWR|useInfiniteQuery/.test(content)) {
      if (/isLoading|isFetching|isValidating/.test(content)) {
        if (!states.some(s => s.type === 'loading')) {
          states.push({ type: 'loading', value: 'loading', label: 'Loading' });
        }
      }
    }

    // Detect suspense boundaries
    if (/<Suspense|React\.Suspense/.test(content)) {
      if (!states.some(s => s.type === 'loading')) {
        states.push({ type: 'loading', value: 'suspense', label: 'Loading (Suspense)' });
      }
    }

    return states;
  }

  /**
   * Parse page with React-specific enhancements
   */
  parsePage(filePath: string, content: string): ParsedPageInfo | null {
    const baseResult = super.parsePage(filePath, content);
    if (!baseResult) return null;

    // Detect additional React-specific features
    return {
      ...baseResult,
      hasTable: this.detectTable(content),
      hasForm: this.detectForm(content),
      hasCards: this.detectCards(content)
    };
  }

  /**
   * Extract CVA variants from component content
   */
  extractVariants(content: string): Record<string, string[]> {
    const variants: Record<string, string[]> = {};

    // Match cva() call and extract variants object
    const cvaMatch = content.match(/cva\s*\(\s*[^,]+,\s*\{([^}]+variants\s*:\s*\{[^}]*\}[^}]*)\}/s);
    if (!cvaMatch) return variants;

    const cvaContent = cvaMatch[1];

    // Extract variants block
    const variantsMatch = cvaContent.match(/variants\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (!variantsMatch) return variants;

    const variantsContent = variantsMatch[1];

    // Parse individual variant definitions
    const variantRegex = /(\w+)\s*:\s*\{([^}]+)\}/g;
    let match;

    while ((match = variantRegex.exec(variantsContent)) !== null) {
      const variantName = match[1];
      const optionsContent = match[2];

      // Extract option keys
      const optionKeys = optionsContent.match(/(\w+)\s*:/g);
      if (optionKeys) {
        variants[variantName] = optionKeys.map(k => k.replace(':', '').trim());
      }
    }

    return variants;
  }

  /**
   * Extract props from TypeScript interface/type
   */
  protected extractProps(content: string): string[] {
    const props: string[] = [];

    // Match interface Props or type Props
    const propsMatch = content.match(
      /(?:interface|type)\s+(?:\w+)?Props\s*(?:=\s*)?\{([^}]+)\}/
    );
    if (propsMatch) {
      const propsContent = propsMatch[1];
      const propNames = propsContent.matchAll(/(\w+)\s*[?:]?\s*:/g);
      for (const match of propNames) {
        props.push(match[1]);
      }
    }

    // Also check for destructured props in function signature
    const funcMatch = content.match(
      /function\s+\w+\s*\(\s*\{([^}]+)\}/
    );
    if (funcMatch) {
      const params = funcMatch[1].split(',');
      for (const param of params) {
        const name = param.trim().split(/[=:]/)[0].trim();
        if (name && !props.includes(name)) {
          props.push(name);
        }
      }
    }

    return props;
  }

  /**
   * Detect table with React-specific patterns
   */
  protected detectTable(content: string): boolean {
    return (
      super.detectTable(content) ||
      /useReactTable|@tanstack\/react-table|<DataTable|<TableHead|<TableBody/i.test(content)
    );
  }

  /**
   * Detect form with React-specific patterns
   */
  protected detectForm(content: string): boolean {
    return (
      super.detectForm(content) ||
      /useForm|react-hook-form|formik|Formik|useFormik/i.test(content)
    );
  }

  /**
   * Detect cards with React-specific patterns
   */
  protected detectCards(content: string): boolean {
    return (
      super.detectCards(content) ||
      /<Card\s|<CardContent|<CardHeader|<CardFooter|<CardTitle/i.test(content)
    );
  }

  /**
   * Check if component has Radix asChild prop
   */
  protected hasAsChildSupport(content: string): boolean {
    return /asChild|Slot\s*\/>|<Slot/i.test(content);
  }
}
