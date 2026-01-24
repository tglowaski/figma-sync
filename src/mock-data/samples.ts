/**
 * Generic Sample Value Pools
 *
 * Domain-agnostic sample data that works for any application context.
 * Uses abstract naming (Alpha, Beta, etc.) to avoid domain-specific assumptions.
 */

import type { ColumnType } from './patterns';

/**
 * Sample value pools organized by data type
 */
export const SAMPLE_POOLS: Record<ColumnType, string[]> = {
  // Generic company/entity names using Greek letters
  name: [
    'Alpha Corp',
    'Beta LLC',
    'Gamma Inc',
    'Delta Group',
    'Epsilon Partners',
    'Zeta Holdings',
    'Eta Ventures',
    'Theta Capital',
    'Iota Systems',
    'Kappa Industries',
    'Lambda Tech',
    'Mu Solutions',
  ],

  // Generic person names (gender-neutral)
  person: [
    'Alex Johnson',
    'Jordan Smith',
    'Casey Williams',
    'Morgan Brown',
    'Taylor Davis',
    'Riley Wilson',
    'Quinn Miller',
    'Avery Anderson',
    'Cameron Moore',
    'Drew Martinez',
    'Finley Thomas',
    'Harper Lee',
  ],

  // Email addresses
  email: [
    'alex@example.com',
    'jordan@example.com',
    'casey@example.com',
    'morgan@example.com',
    'taylor@example.com',
    'riley@example.com',
    'info@alpha-corp.com',
    'contact@beta-llc.com',
  ],

  // Phone numbers
  phone: [
    '+1 (555) 100-1001',
    '+1 (555) 200-2002',
    '+1 (555) 300-3003',
    '+1 (555) 400-4004',
    '+1 (555) 500-5005',
    '+1 (555) 600-6006',
  ],

  // URLs
  url: [
    'https://example.com/item-1',
    'https://example.com/item-2',
    'https://example.com/item-3',
    'https://docs.example.com',
    'https://api.example.com',
    'https://app.example.com',
  ],

  // Generic statuses
  status: [
    'Active',
    'Pending',
    'Complete',
    'Draft',
    'In Review',
    'Approved',
    'On Hold',
    'Archived',
  ],

  // Generic types
  type: [
    'Type A',
    'Type B',
    'Type C',
    'Primary',
    'Secondary',
    'Standard',
    'Premium',
    'Basic',
  ],

  // Generic categories
  category: [
    'Category 1',
    'Category 2',
    'Category 3',
    'General',
    'Special',
    'Core',
    'Extended',
    'Custom',
  ],

  // Currency values (varied scales)
  currency: [
    '$1,250',
    '$5,500',
    '$12,500',
    '$45,000',
    '$89,000',
    '$125,000',
    '$234,500',
    '$500,000',
    '$1.2M',
    '$2.5M',
    '$3.5M',
    '$5.0M',
  ],

  // Percentages
  percentage: [
    '5%',
    '8%',
    '12%',
    '15%',
    '20%',
    '25%',
    '33%',
    '45%',
    '50%',
    '65%',
    '75%',
    '100%',
  ],

  // Dates (recent range, varied formats)
  date: [
    'Jan 15, 2024',
    'Feb 3, 2024',
    'Mar 22, 2024',
    'Apr 10, 2024',
    'May 5, 2024',
    'Jun 18, 2024',
    'Jul 8, 2024',
    'Aug 25, 2024',
    'Sep 12, 2024',
    'Oct 30, 2024',
    'Nov 7, 2024',
    'Dec 20, 2024',
  ],

  // Numeric values
  number: [
    '1',
    '3',
    '5',
    '12',
    '24',
    '48',
    '100',
    '250',
    '500',
    '1,000',
    '2,500',
    '10,000',
  ],

  // IDs
  id: [
    '#1001',
    '#1002',
    '#1003',
    '#1004',
    'ABC-001',
    'ABC-002',
    'XYZ-101',
    'XYZ-102',
    'ID-2024-001',
    'ID-2024-002',
    'REF-A1B2',
    'REF-C3D4',
  ],

  // Descriptions (short lorem ipsum)
  description: [
    'Initial setup and configuration completed.',
    'Awaiting review from team lead.',
    'High priority item requiring immediate attention.',
    'Standard processing with no special requirements.',
    'Follow-up scheduled for next week.',
    'Documentation updated and verified.',
    'Pending external approval.',
    'Ready for final review.',
  ],

  // Actions (for action columns)
  actions: [
    'Edit',
    'View',
    'Delete',
    'Archive',
    'Edit | Delete',
    'View | Edit',
    '...',
    '---',
  ],

  // Boolean values
  boolean: [
    'Yes',
    'No',
    'True',
    'False',
    'Enabled',
    'Disabled',
    'Active',
    'Inactive',
  ],

  // Generic text (fallback)
  text: [
    'Item A',
    'Item B',
    'Item C',
    'Item D',
    'Entry 1',
    'Entry 2',
    'Record A',
    'Record B',
    'Value 1',
    'Value 2',
    'Data Point',
    'Sample',
  ],
};

/**
 * Get a sample value for a given column type
 * @param type The column data type
 * @param index The row index (for consistent selection)
 * @param variation Optional variation offset for diversity
 */
export function getSampleValue(
  type: ColumnType,
  index: number,
  variation: number = 0
): string {
  const pool = SAMPLE_POOLS[type] || SAMPLE_POOLS.text;
  const adjustedIndex = (index + variation) % pool.length;
  return pool[adjustedIndex];
}

/**
 * Get multiple sample values for a column type
 * @param type The column data type
 * @param count Number of values to get
 * @param startIndex Starting index for selection
 */
export function getSampleValues(
  type: ColumnType,
  count: number,
  startIndex: number = 0
): string[] {
  const values: string[] = [];
  for (let i = 0; i < count; i++) {
    values.push(getSampleValue(type, startIndex + i));
  }
  return values;
}
