/**
 * Mock Data Generator
 *
 * Generates realistic sample data for tables based on column headers.
 * Automatically infers data types from header names and generates appropriate values.
 */

import { detectColumnType, detectColumnTypes, type ColumnType } from './patterns';
import { getSampleValue, SAMPLE_POOLS } from './samples';

/**
 * Configuration options for mock data generation
 */
export interface MockDataConfig {
  /** Number of rows to generate (default: 4) */
  rowCount?: number;
  /** Starting index for sample selection (for variation) */
  startIndex?: number;
  /** Whether to shuffle values within each column */
  shuffle?: boolean;
  /** Seed for deterministic random shuffling */
  seed?: number;
}

const DEFAULT_CONFIG: Required<MockDataConfig> = {
  rowCount: 4,
  startIndex: 0,
  shuffle: false,
  seed: 42,
};

/**
 * Simple seeded random number generator for consistent shuffling
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Shuffle an array with optional seed for determinism
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  const random = seed !== undefined ? seededRandom(seed) : Math.random;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Generate mock rows based on column headers
 *
 * @param headers Array of column header strings
 * @param config Optional configuration
 * @returns 2D array of string values (rows × columns)
 *
 * @example
 * const rows = generateMockRows(['Name', 'Status', 'Amount', 'Date']);
 * // Returns:
 * // [
 * //   ['Alpha Corp', 'Active', '$125,000', 'Jan 15, 2024'],
 * //   ['Beta LLC', 'Pending', '$89,500', 'Feb 3, 2024'],
 * //   ['Gamma Inc', 'Complete', '$234,000', 'Mar 22, 2024'],
 * //   ['Delta Group', 'Active', '$67,800', 'Apr 10, 2024']
 * // ]
 */
export function generateMockRows(
  headers: string[],
  config: MockDataConfig = {}
): string[][] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { rowCount, startIndex, shuffle, seed } = mergedConfig;

  // Detect column types from headers
  const columnTypes = detectColumnTypes(headers);

  // Generate rows
  const rows: string[][] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const row: string[] = [];

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const type = columnTypes[colIndex];

      // Add variation based on column index to avoid identical patterns across columns
      const variation = colIndex * 3;
      const value = getSampleValue(type, startIndex + rowIndex, variation);

      row.push(value);
    }

    rows.push(row);
  }

  // Optionally shuffle rows
  if (shuffle) {
    return shuffleArray(rows, seed);
  }

  return rows;
}

/**
 * Generate a single mock row based on column headers
 *
 * @param headers Array of column header strings
 * @param rowIndex Index of the row (affects value selection)
 * @returns Array of string values
 */
export function generateMockRow(headers: string[], rowIndex: number = 0): string[] {
  return generateMockRows(headers, { rowCount: 1, startIndex: rowIndex })[0];
}

/**
 * Generate mock data for a specific column type
 *
 * @param type The column data type
 * @param count Number of values to generate
 * @returns Array of string values
 */
export function generateColumnValues(type: ColumnType, count: number): string[] {
  const values: string[] = [];
  for (let i = 0; i < count; i++) {
    values.push(getSampleValue(type, i));
  }
  return values;
}

/**
 * Get the detected type for a column header
 * Useful for debugging or understanding the detection logic
 *
 * @param header Column header string
 * @returns Detected column type
 */
export function getColumnType(header: string): ColumnType {
  return detectColumnType(header);
}

/**
 * Get all detected types for multiple headers
 *
 * @param headers Array of column header strings
 * @returns Array of detected column types
 */
export function getColumnTypes(headers: string[]): ColumnType[] {
  return detectColumnTypes(headers);
}

/**
 * Check if a value pool exists for a given type
 *
 * @param type Column type to check
 * @returns True if the type has a sample pool
 */
export function hasValuePool(type: ColumnType): boolean {
  return type in SAMPLE_POOLS;
}

/**
 * Get the available sample values for a type
 *
 * @param type Column type
 * @returns Array of all sample values for that type
 */
export function getValuePool(type: ColumnType): string[] {
  return SAMPLE_POOLS[type] || SAMPLE_POOLS.text;
}
