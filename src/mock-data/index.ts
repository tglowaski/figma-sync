/**
 * Mock Data Generation Module
 *
 * A generic, reusable system for generating realistic sample data
 * for any database-driven table, regardless of the project domain.
 *
 * @example
 * import { generateMockRows, getColumnType } from './mock-data';
 *
 * // Auto-generate table data from headers
 * const rows = generateMockRows(['Name', 'Status', 'Amount', 'Date']);
 *
 * // Check what type a column was detected as
 * const type = getColumnType('Investment'); // 'currency'
 */

// Core generator functions
export {
  generateMockRows,
  generateMockRow,
  generateColumnValues,
  getColumnType,
  getColumnTypes,
  hasValuePool,
  getValuePool,
  type MockDataConfig,
} from './generator';

// Pattern detection utilities
export {
  detectColumnType,
  detectColumnTypes,
  COLUMN_PATTERNS,
  type ColumnType,
} from './patterns';

// Sample value pools
export {
  SAMPLE_POOLS,
  getSampleValue,
  getSampleValues,
} from './samples';
