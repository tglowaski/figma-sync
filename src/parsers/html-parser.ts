/**
 * Plain HTML/CSS Parser
 *
 * Parses static HTML pages and CSS files to extract
 * wireframe and component information.
 */

import { htmlStaticPreset } from '../config/presets';
import type { ParsedPageInfo, PageState, PageType } from '../config/framework-presets';
import { BaseParser } from './base-parser';
import type { ParserOptions } from './parser-interface';

/**
 * Plain HTML/CSS specific parser implementation
 */
export class HtmlParser extends BaseParser {
  constructor(options?: ParserOptions) {
    super(htmlStaticPreset, options);
  }

  /**
   * Check if content is a valid HTML component/partial
   */
  shouldIncludeComponent(filePath: string, content: string): boolean {
    if (!filePath.endsWith('.html')) {
      return false;
    }

    // Check for component markers or template tags
    return (
      /data-component=|<template|<!-- component:|class="component-/i.test(content) &&
      !this.isFullPage(content)
    );
  }

  /**
   * Check if HTML is a full page (has doctype/html/body)
   */
  private isFullPage(content: string): boolean {
    return /<!DOCTYPE|<html|<head|<body/i.test(content);
  }

  /**
   * Detect page states with HTML-specific patterns
   */
  detectPageStates(content: string): PageState[] {
    const states = super.detectPageStates(content);

    // Detect tab panels via role="tabpanel"
    const tabPanelRegex = /role=["']tabpanel["'][^>]*(?:id=["']([^"']+)["']|aria-labelledby=["']([^"']+)["'])/g;
    let match;
    while ((match = tabPanelRegex.exec(content)) !== null) {
      const value = match[1] || match[2];
      if (value && !states.some(s => s.type === 'tab' && s.value === value)) {
        states.push({
          type: 'tab',
          value,
          label: this.capitalize(value.replace(/[-_]/g, ' '))
        });
      }
    }

    // Detect data-tab attributes
    const dataTabRegex = /data-tab=["']([^"']+)["']/g;
    while ((match = dataTabRegex.exec(content)) !== null) {
      const value = match[1];
      if (!states.some(s => s.type === 'tab' && s.value === value)) {
        states.push({
          type: 'tab',
          value,
          label: this.capitalize(value.replace(/[-_]/g, ' '))
        });
      }
    }

    // Detect loading states via class or data attributes
    if (/class=["'][^"']*loading|data-loading|aria-busy=["']true/i.test(content)) {
      if (!states.some(s => s.type === 'loading')) {
        states.push({ type: 'loading', value: 'loading', label: 'Loading' });
      }
    }

    // Detect auth-required markers
    if (/data-auth-required|data-protected|class=["'][^"']*auth-required/i.test(content)) {
      if (!states.some(s => s.type === 'auth')) {
        states.push({ type: 'auth', value: 'not-authenticated', label: 'Not Authenticated' });
      }
    }

    // Detect empty state markers
    if (/class=["'][^"']*empty-state|data-empty|no-results/i.test(content)) {
      if (!states.some(s => s.type === 'empty')) {
        states.push({ type: 'empty', value: 'empty', label: 'Empty State' });
      }
    }

    return states;
  }

  /**
   * Parse page with HTML-specific enhancements
   */
  parsePage(filePath: string, content: string): ParsedPageInfo | null {
    if (!this.shouldIncludePage(filePath)) {
      return null;
    }

    // Skip partials/components that don't have full page structure
    if (!this.isFullPage(content) && !this.matchesPattern(filePath, ['pages/**/*'])) {
      return null;
    }

    const pageType = this.detectPageType(filePath, content);
    const states = this.detectPageStates(content);

    return {
      filePath,
      name: this.generateWireframeName(filePath, pageType),
      pageType,
      states,
      hasNavigation: this.detectNavigation(content),
      hasTabs: states.some(s => s.type === 'tab') || this.detectTabs(content),
      hasTable: this.detectTable(content),
      hasForm: this.detectForm(content),
      hasCards: this.detectCards(content),
      isDynamic: false, // Static HTML doesn't have dynamic routes
      routeParams: []
    };
  }

  /**
   * Extract variants from HTML data attributes
   */
  extractVariants(content: string): Record<string, string[]> {
    const variants: Record<string, string[]> = {};

    // Match data-variant-* attributes
    const variantAttrRegex = /data-variant-(\w+)=["']([^"']+)["']/g;
    let match;

    while ((match = variantAttrRegex.exec(content)) !== null) {
      const variantName = match[1];
      const value = match[2];

      if (!variants[variantName]) {
        variants[variantName] = [];
      }
      if (!variants[variantName].includes(value)) {
        variants[variantName].push(value);
      }
    }

    // Match class-based variants (e.g., "btn-primary", "btn-secondary")
    const classRegex = /class=["']([^"']+)["']/g;
    const variantClassPattern = /(\w+)-(primary|secondary|success|danger|warning|info|light|dark|sm|md|lg|xl)/g;

    while ((match = classRegex.exec(content)) !== null) {
      const classes = match[1];
      let classMatch;

      while ((classMatch = variantClassPattern.exec(classes)) !== null) {
        const component = classMatch[1];
        const variant = classMatch[2];

        // Group by likely variant types
        if (['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(variant)) {
          if (!variants['variant']) {
            variants['variant'] = [];
          }
          if (!variants['variant'].includes(variant)) {
            variants['variant'].push(variant);
          }
        }

        if (['sm', 'md', 'lg', 'xl'].includes(variant)) {
          if (!variants['size']) {
            variants['size'] = [];
          }
          if (!variants['size'].includes(variant)) {
            variants['size'].push(variant);
          }
        }
      }
    }

    return variants;
  }

  /**
   * Detect page type with HTML-specific patterns
   */
  detectPageType(filePath: string, content: string): PageType {
    // Check file name patterns first
    const baseType = super.detectPageType(filePath, content);
    if (baseType !== 'generic') {
      return baseType;
    }

    // Check content for type hints
    const contentLower = content.toLowerCase();

    // Auth pages
    if (/<form[^>]*(?:login|signin|auth)|type=["']password["']/i.test(content)) {
      return 'auth';
    }

    // Dashboard pages
    if (/<canvas|chart|dashboard|metric|stat/i.test(content)) {
      return 'dashboard';
    }

    // List pages
    if (/<table|<ul[^>]*class=["'][^"']*list|data-list/i.test(content)) {
      return 'list';
    }

    // Form pages
    if (/<form[^>]*(?:create|edit|new|add)/i.test(content)) {
      return 'form';
    }

    // Detail pages
    if (/class=["'][^"']*detail|data-detail|article|product-page/i.test(content)) {
      return 'detail';
    }

    return 'generic';
  }

  /**
   * Detect navigation in HTML
   */
  private detectNavigation(content: string): boolean {
    return /<nav|role=["']navigation["']|class=["'][^"']*navbar|class=["'][^"']*menu/i.test(content);
  }

  /**
   * Detect tabs in HTML
   */
  private detectTabs(content: string): boolean {
    return /role=["']tablist["']|class=["'][^"']*tabs|data-tabs/i.test(content);
  }

  /**
   * Detect table in HTML
   */
  protected detectTable(content: string): boolean {
    return /<table|<thead|<tbody|role=["']grid["']/i.test(content);
  }

  /**
   * Detect form in HTML
   */
  protected detectForm(content: string): boolean {
    return /<form/i.test(content);
  }

  /**
   * Detect cards in HTML
   */
  protected detectCards(content: string): boolean {
    return /class=["'][^"']*card|data-card/i.test(content);
  }

  /**
   * Generate wireframe name from HTML file path
   */
  generateWireframeName(filePath: string, pageType: PageType): string {
    // Extract title from HTML if available
    const titleMatch = filePath.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    return super.generateWireframeName(filePath, pageType);
  }
}
