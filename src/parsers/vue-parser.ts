/**
 * Vue / Nuxt Parser
 *
 * Parses Vue Single File Components (SFC) and Nuxt pages
 * to extract wireframe and component information.
 */

import { vueNuxtPreset } from '../config/presets';
import type { ParsedPageInfo, PageState, ParsedComponentInfo } from '../config/framework-presets';
import { BaseParser } from './base-parser';
import type { ParserOptions } from './parser-interface';

/**
 * Vue/Nuxt specific parser implementation
 */
export class VueParser extends BaseParser {
  constructor(options?: ParserOptions) {
    super(vueNuxtPreset, options);
  }

  /**
   * Check if content is a valid Vue SFC
   */
  shouldIncludeComponent(filePath: string, content: string): boolean {
    // Must be a .vue file with <template> or <script setup>
    if (!filePath.endsWith('.vue')) {
      return false;
    }

    return /<template>|<script\s+setup/.test(content);
  }

  /**
   * Detect page states with Vue-specific patterns
   */
  detectPageStates(content: string): PageState[] {
    const states = super.detectPageStates(content);

    // Detect v-if tab patterns
    const vIfTabRegex = /v-if=["'][^"']*===?\s*["'](\w+)["']/g;
    let match;
    while ((match = vIfTabRegex.exec(content)) !== null) {
      const value = match[1];
      if (!states.some(s => s.type === 'tab' && s.value === value)) {
        states.push({
          type: 'tab',
          value,
          label: this.capitalize(value)
        });
      }
    }

    // Detect component :is bindings for dynamic tabs
    const isBindingRegex = /:is=["'](\w+)["']/g;
    while ((match = isBindingRegex.exec(content)) !== null) {
      const value = match[1];
      if (!states.some(s => s.type === 'tab' && s.value === value)) {
        states.push({
          type: 'tab',
          value,
          label: this.capitalize(value)
        });
      }
    }

    // Detect Nuxt/Vue async data loading
    if (/useFetch|useAsyncData|useLazyFetch|useLazyAsyncData/.test(content)) {
      if (/pending|status\s*===?\s*['"]pending/.test(content)) {
        if (!states.some(s => s.type === 'loading')) {
          states.push({ type: 'loading', value: 'loading', label: 'Loading' });
        }
      }
    }

    // Detect Pinia store loading states
    if (/useStore|defineStore/.test(content)) {
      if (/isLoading|loading/.test(content)) {
        if (!states.some(s => s.type === 'loading')) {
          states.push({ type: 'loading', value: 'loading', label: 'Loading' });
        }
      }
    }

    return states;
  }

  /**
   * Parse page with Vue-specific enhancements
   */
  parsePage(filePath: string, content: string): ParsedPageInfo | null {
    if (!this.shouldIncludePage(filePath)) {
      return null;
    }

    const baseResult = super.parsePage(filePath, content);
    if (!baseResult) return null;

    // Extract page meta for additional context
    const pageMeta = this.extractPageMeta(content);

    return {
      ...baseResult,
      hasNavigation: pageMeta.layout !== 'blank' && baseResult.pageType !== 'auth'
    };
  }

  /**
   * Extract defineProps variants from Vue SFC
   */
  extractVariants(content: string): Record<string, string[]> {
    const variants: Record<string, string[]> = {};

    // Match defineProps with type annotation
    const definePropsMatch = content.match(
      /defineProps\s*<\s*\{([^}]+)\}\s*>\s*\(\)|defineProps\s*\(\s*\{([^}]+)\}\s*\)/s
    );

    if (!definePropsMatch) {
      // Try withDefaults pattern
      const withDefaultsMatch = content.match(
        /withDefaults\s*\(\s*defineProps\s*<\s*\{([^}]+)\}\s*>\s*\(\)/s
      );
      if (withDefaultsMatch) {
        return this.parsePropsToVariants(withDefaultsMatch[1]);
      }
      return variants;
    }

    const propsContent = definePropsMatch[1] || definePropsMatch[2];
    return this.parsePropsToVariants(propsContent);
  }

  /**
   * Parse TypeScript props definition to variants
   */
  private parsePropsToVariants(propsContent: string): Record<string, string[]> {
    const variants: Record<string, string[]> = {};

    // Match union type props (variant?: 'primary' | 'secondary')
    const unionRegex = /(\w+)\s*\??\s*:\s*(['"][^'"]+['"](?:\s*\|\s*['"][^'"]+['"])+)/g;
    let match;

    while ((match = unionRegex.exec(propsContent)) !== null) {
      const propName = match[1];
      const unionValues = match[2];

      // Extract individual values from union
      const values = unionValues.match(/['"]([^'"]+)['"]/g);
      if (values) {
        variants[propName] = values.map(v => v.replace(/['"]/g, ''));
      }
    }

    return variants;
  }

  /**
   * Extract page meta from definePageMeta
   */
  private extractPageMeta(content: string): { layout?: string; middleware?: string[] } {
    const meta: { layout?: string; middleware?: string[] } = {};

    const pageMetaMatch = content.match(/definePageMeta\s*\(\s*\{([^}]+)\}\s*\)/s);
    if (pageMetaMatch) {
      const metaContent = pageMetaMatch[1];

      // Extract layout
      const layoutMatch = metaContent.match(/layout\s*:\s*['"](\w+)['"]/);
      if (layoutMatch) {
        meta.layout = layoutMatch[1];
      }

      // Extract middleware
      const middlewareMatch = metaContent.match(/middleware\s*:\s*\[([^\]]+)\]/);
      if (middlewareMatch) {
        const middlewares = middlewareMatch[1].match(/['"](\w+)['"]/g);
        if (middlewares) {
          meta.middleware = middlewares.map(m => m.replace(/['"]/g, ''));
        }
      }
    }

    return meta;
  }

  /**
   * Extract props from Vue SFC
   */
  protected extractProps(content: string): string[] {
    const props: string[] = [];

    // defineProps<{ ... }>() pattern
    const definePropsMatch = content.match(
      /defineProps\s*<\s*\{([^}]+)\}\s*>/s
    );
    if (definePropsMatch) {
      const propsContent = definePropsMatch[1];
      const propNames = propsContent.matchAll(/(\w+)\s*[?:]/g);
      for (const match of propNames) {
        props.push(match[1]);
      }
    }

    // defineProps({ ... }) pattern (runtime)
    const runtimePropsMatch = content.match(
      /defineProps\s*\(\s*\{([^}]+)\}\s*\)/s
    );
    if (runtimePropsMatch) {
      const propsContent = runtimePropsMatch[1];
      const propNames = propsContent.matchAll(/(\w+)\s*:/g);
      for (const match of propNames) {
        props.push(match[1]);
      }
    }

    return props;
  }

  /**
   * Detect table with Vue-specific patterns
   */
  protected detectTable(content: string): boolean {
    return (
      super.detectTable(content) ||
      /<n-data-table|<el-table|<v-data-table|<q-table/i.test(content)
    );
  }

  /**
   * Detect form with Vue-specific patterns
   */
  protected detectForm(content: string): boolean {
    return (
      super.detectForm(content) ||
      /<n-form|<el-form|<v-form|<q-form|vee-validate|useForm/i.test(content)
    );
  }

  /**
   * Detect cards with Vue-specific patterns
   */
  protected detectCards(content: string): boolean {
    return (
      super.detectCards(content) ||
      /<n-card|<el-card|<v-card|<q-card/i.test(content)
    );
  }
}
