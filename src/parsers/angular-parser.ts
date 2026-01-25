/**
 * Angular Parser
 *
 * Parses Angular components (standalone and NgModule-based)
 * to extract wireframe and component information.
 */

import { angularPreset } from '../config/presets';
import type { ParsedPageInfo, PageState, ParsedComponentInfo } from '../config/framework-presets';
import { BaseParser } from './base-parser';
import type { ParserOptions } from './parser-interface';

/**
 * Angular specific parser implementation
 */
export class AngularParser extends BaseParser {
  constructor(options?: ParserOptions) {
    super(angularPreset, options);
  }

  /**
   * Check if content is a valid Angular component
   */
  shouldIncludeComponent(filePath: string, content: string): boolean {
    // Must be a .component.ts file with @Component decorator
    if (!filePath.endsWith('.component.ts')) {
      return false;
    }

    return /@Component\s*\(/.test(content);
  }

  /**
   * Detect page states with Angular-specific patterns
   */
  detectPageStates(content: string): PageState[] {
    const states = super.detectPageStates(content);

    // Detect *ngIf conditional tab patterns
    const ngIfTabRegex = /\*ngIf=["'][^"']*===?\s*['"](\w+)['"]/g;
    let match;
    while ((match = ngIfTabRegex.exec(content)) !== null) {
      const value = match[1];
      if (!states.some(s => s.type === 'tab' && s.value === value)) {
        states.push({
          type: 'tab',
          value,
          label: this.capitalize(value)
        });
      }
    }

    // Detect [ngSwitch] patterns
    const ngSwitchRegex = /\*ngSwitchCase=["']([^"']+)['"]/g;
    while ((match = ngSwitchRegex.exec(content)) !== null) {
      const value = match[1].replace(/['"]/g, '');
      if (!states.some(s => s.type === 'tab' && s.value === value)) {
        states.push({
          type: 'tab',
          value,
          label: this.capitalize(value)
        });
      }
    }

    // Detect Angular 17+ @switch patterns
    const switchRegex = /@case\s*\((['"]?)(\w+)\1\)/g;
    while ((match = switchRegex.exec(content)) !== null) {
      const value = match[2];
      if (!states.some(s => s.type === 'tab' && s.value === value)) {
        states.push({
          type: 'tab',
          value,
          label: this.capitalize(value)
        });
      }
    }

    // Detect RxJS loading states
    if (/\|\s*async|subscribe\s*\(/.test(content)) {
      if (/isLoading\$?|loading\$?/.test(content)) {
        if (!states.some(s => s.type === 'loading')) {
          states.push({ type: 'loading', value: 'loading', label: 'Loading' });
        }
      }
    }

    // Detect NgRx store loading states
    if (/Store|select\s*\(/.test(content)) {
      if (/selectLoading|isLoading/.test(content)) {
        if (!states.some(s => s.type === 'loading')) {
          states.push({ type: 'loading', value: 'loading', label: 'Loading' });
        }
      }
    }

    return states;
  }

  /**
   * Parse page with Angular-specific enhancements
   */
  parsePage(filePath: string, content: string): ParsedPageInfo | null {
    if (!this.shouldIncludePage(filePath)) {
      return null;
    }

    const pageType = this.detectPageType(filePath, content);
    const states = this.detectPageStates(content);

    // Extract component metadata
    const metadata = this.extractComponentMetadata(content);

    return {
      filePath,
      name: this.generateWireframeName(filePath, pageType),
      pageType,
      states,
      hasNavigation: pageType !== 'auth' && !metadata.standalone,
      hasTabs: states.some(s => s.type === 'tab') || /<mat-tab-group|<mat-tab/.test(content),
      hasTable: this.detectTable(content),
      hasForm: this.detectForm(content),
      hasCards: this.detectCards(content),
      isDynamic: this.isDynamicRoute(filePath),
      routeParams: this.extractRouteParams(filePath)
    };
  }

  /**
   * Extract @Input variants from Angular component
   */
  extractVariants(content: string): Record<string, string[]> {
    const variants: Record<string, string[]> = {};

    // Match @Input() with union type
    const inputRegex = /@Input\s*\(\s*\)\s*(\w+)\s*[!?]?\s*:\s*(['"][^'"]+['"](?:\s*\|\s*['"][^'"]+['"])+)/g;
    let match;

    while ((match = inputRegex.exec(content)) !== null) {
      const propName = match[1];
      const unionValues = match[2];

      // Extract individual values from union
      const values = unionValues.match(/['"]([^'"]+)['"]/g);
      if (values) {
        variants[propName] = values.map(v => v.replace(/['"]/g, ''));
      }
    }

    // Match Angular 16+ input() signal with union type
    const signalInputRegex = /(\w+)\s*=\s*input\s*<\s*(['"][^'"]+['"](?:\s*\|\s*['"][^'"]+['"])+)\s*>/g;
    while ((match = signalInputRegex.exec(content)) !== null) {
      const propName = match[1];
      const unionValues = match[2];

      const values = unionValues.match(/['"]([^'"]+)['"]/g);
      if (values) {
        variants[propName] = values.map(v => v.replace(/['"]/g, ''));
      }
    }

    return variants;
  }

  /**
   * Extract Angular component metadata
   */
  private extractComponentMetadata(content: string): {
    selector?: string;
    standalone?: boolean;
    template?: string;
  } {
    const metadata: {
      selector?: string;
      standalone?: boolean;
      template?: string;
    } = {};

    const componentMatch = content.match(/@Component\s*\(\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\s*\)/s);
    if (componentMatch) {
      const decoratorContent = componentMatch[1];

      // Extract selector
      const selectorMatch = decoratorContent.match(/selector\s*:\s*['"]([^'"]+)['"]/);
      if (selectorMatch) {
        metadata.selector = selectorMatch[1];
      }

      // Extract standalone flag
      metadata.standalone = /standalone\s*:\s*true/.test(decoratorContent);

      // Extract template (inline or templateUrl)
      const templateMatch = decoratorContent.match(/template\s*:\s*`([^`]+)`/s);
      if (templateMatch) {
        metadata.template = templateMatch[1];
      }
    }

    return metadata;
  }

  /**
   * Extract props (inputs) from Angular component
   */
  protected extractProps(content: string): string[] {
    const props: string[] = [];

    // @Input() decorator pattern
    const inputRegex = /@Input\s*\(\s*(?:['"][^'"]*['"]\s*)?\)\s*(\w+)/g;
    let match;
    while ((match = inputRegex.exec(content)) !== null) {
      props.push(match[1]);
    }

    // Angular 16+ input() signal pattern
    const signalInputRegex = /(\w+)\s*=\s*input\s*[<(]/g;
    while ((match = signalInputRegex.exec(content)) !== null) {
      if (!props.includes(match[1])) {
        props.push(match[1]);
      }
    }

    return props;
  }

  /**
   * Check for dynamic routes in Angular (uses :param syntax)
   */
  isDynamicRoute(filePath: string): boolean {
    // Angular uses :param syntax in routes, but file paths usually don't contain this
    // Check for common patterns like [id] folders or route configs
    return /\[(\w+)\]|_(\w+)_/.test(filePath);
  }

  /**
   * Detect table with Angular-specific patterns
   */
  protected detectTable(content: string): boolean {
    return (
      super.detectTable(content) ||
      /<mat-table|<cdk-table|<ngx-datatable|<p-table|MatTableModule/i.test(content)
    );
  }

  /**
   * Detect form with Angular-specific patterns
   */
  protected detectForm(content: string): boolean {
    return (
      super.detectForm(content) ||
      /FormGroup|FormControl|ReactiveFormsModule|FormsModule|\[formGroup\]|\(ngSubmit\)/i.test(content)
    );
  }

  /**
   * Detect cards with Angular-specific patterns
   */
  protected detectCards(content: string): boolean {
    return (
      super.detectCards(content) ||
      /<mat-card|<nz-card|<p-card|MatCardModule/i.test(content)
    );
  }

  /**
   * Generate wireframe name with Angular conventions
   */
  generateWireframeName(filePath: string, pageType: string): string {
    // Remove Angular-specific suffixes
    const name = filePath
      .replace(/\.component\.ts$/, '')
      .replace(/\.page\.ts$/, '');

    return super.generateWireframeName(name, pageType as any);
  }
}
