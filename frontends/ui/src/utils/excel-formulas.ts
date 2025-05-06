/**
 * Creates a SUM range excel formula based on a row range on a column.
 * @param minRange minimum row range
 * @param maxRange maximum row range
 * @param column column letter
 * @returns SUM range excel formula
 */
export function getColSumRangeFormula (minRange: number, maxRange: number, column: string): string {
  const noRange = minRange === maxRange;
  const min = `${column.toUpperCase()}${minRange}`;
  // only add if range exists to avoid formula error
  const max = noRange ? '' : `:${column.toUpperCase()}${maxRange}`;
  return `SUM(${min}${max})`;
}

/**
 * Creates a cell-based SUM excel formula based on a column and row numbers.
 * @param rows array of row numbers
 * @param column column letter
 * @returns SUM excel formula
 */
export function getCellSumByColumnFormula (rows: number[], column: string): string {
  const cells = rows.map(r => `${column.toUpperCase()}${r}`).join(',')
  return `SUM(${cells})`
}
