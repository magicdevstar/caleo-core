/**
 * Calculates the number of hours between two date strings.
 * @param startDate The start date string
 * @param endDate The end date string
 * @param [decimalPlaces=2] The number of decimal places to round (Defaults to 2)
 * @returns The number of hours between the specified date strings
 */
export function calculateHoursBetweenDateStrings (startDate: string, endDate: string, decimalPlaces: number = 2): number {
  const milliseconds = new Date(endDate).getTime() - new Date(startDate).getTime();
  const hours = milliseconds / (1000 * 60 * 60);
  return parseFloat(hours.toFixed(decimalPlaces))
}
