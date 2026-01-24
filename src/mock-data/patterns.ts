/**
 * Column Pattern Matching Rules
 *
 * Maps column header patterns to data types for intelligent mock data generation.
 * Patterns are matched in order of specificity - more specific patterns should be listed first.
 */

export type ColumnType =
  | 'name'
  | 'person'
  | 'email'
  | 'status'
  | 'type'
  | 'category'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'number'
  | 'id'
  | 'description'
  | 'actions'
  | 'boolean'
  | 'url'
  | 'phone'
  | 'text'; // fallback

/**
 * Column name patterns mapped to data types
 * Order matters - more specific patterns should come first
 */
export const COLUMN_PATTERNS: Array<{ pattern: RegExp; type: ColumnType }> = [
  // Actions (most specific)
  { pattern: /^actions?$/i, type: 'actions' },

  // IDs and references
  { pattern: /^id$|^#$|^code$|^ref(erence)?$|^sku$/i, type: 'id' },

  // People (specific to names)
  { pattern: /^(user|member|owner|contact|assigned|author|manager|employee|customer|client|person|responsible|created_by|updated_by|approver|reviewer)$/i, type: 'person' },

  // Email
  { pattern: /email|e-mail|mail_address/i, type: 'email' },

  // Phone
  { pattern: /phone|tel(ephone)?|mobile|cell|fax/i, type: 'phone' },

  // URL
  { pattern: /url|link|website|href|uri/i, type: 'url' },

  // Boolean indicators
  { pattern: /^(active|enabled|disabled|visible|hidden|locked|archived|verified|confirmed|approved|published|featured|default)$/i, type: 'boolean' },
  { pattern: /^is_|^has_|^can_|^should_/i, type: 'boolean' },

  // Status (before type to catch specific statuses)
  { pattern: /^(status|state|stage|phase|progress)$/i, type: 'status' },

  // Type/Kind
  { pattern: /^(type|kind|variant|mode)$/i, type: 'type' },

  // Category/Classification
  { pattern: /^(category|class|group|tier|level|department|team|segment)$/i, type: 'category' },

  // Currency amounts
  { pattern: /amount|value|total|price|cost|revenue|balance|fee|salary|budget|investment|contribution|distribution|payment|income|expense|profit|loss|margin/i, type: 'currency' },

  // Percentages and rates
  { pattern: /percent|%|rate|ratio|share|ownership|allocation|yield|return|irr|roi|growth|discount|commission|margin_pct/i, type: 'percentage' },

  // Dates and times
  { pattern: /date|created|updated|modified|time|when|deadline|due|start|end|expire|birth|joined|hired|closed|completed|scheduled|timestamp/i, type: 'date' },

  // Numeric counts
  { pattern: /count|quantity|number|num|qty|#|total_count|units|items|points|score|rank|order|position|priority|weight|size|age|duration|days|hours|minutes|years/i, type: 'number' },

  // Descriptions and long text
  { pattern: /description|notes|comment|details|summary|bio|about|content|body|message|remarks|feedback|review/i, type: 'description' },

  // Names (catch-all for name-like fields)
  { pattern: /^(name|title|label|entity|company|organization|org|project|product|item|record|entry|account|workspace|team_name|group_name|display_name)$/i, type: 'name' },

  // Name patterns with prefixes/suffixes
  { pattern: /_name$|^name_|_title$|^title_/i, type: 'name' },
];

/**
 * Detect the column type based on header text
 */
export function detectColumnType(header: string): ColumnType {
  const normalized = header.trim();

  for (const { pattern, type } of COLUMN_PATTERNS) {
    if (pattern.test(normalized)) {
      return type;
    }
  }

  // Fallback: use 'text' for unmatched columns
  return 'text';
}

/**
 * Detect types for multiple headers at once
 */
export function detectColumnTypes(headers: string[]): ColumnType[] {
  return headers.map(detectColumnType);
}
