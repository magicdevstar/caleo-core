// Helper function to round up to nearest 15 minutes and format in decimal hours
export const calculateAndFormatHours = (startTime: Date, endTime: Date) => {
  // Normalize dates to be within 24 hours while preserving time
  const normalizedStartTime = new Date(startTime);
  const normalizedEndTime = new Date(endTime);
  
  // If end time is before start time (next day scenario), add a day to end time
  if (normalizedEndTime.getTime() <= normalizedStartTime.getTime()) {
    normalizedEndTime.setDate(normalizedEndTime.getDate() + 1);
  }
  
  // If the difference is more than 24 hours, adjust the end time to be within 24 hours
  const diffInMs = normalizedEndTime.getTime() - normalizedStartTime.getTime();
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
  
  if (diffInMs > twentyFourHoursInMs) {
    // Set end time to be on the same day as start time but preserve the time
    normalizedEndTime.setFullYear(normalizedStartTime.getFullYear());
    normalizedEndTime.setMonth(normalizedStartTime.getMonth());
    normalizedEndTime.setDate(normalizedStartTime.getDate());
    
    // If this makes end time before start time, add a day
    if (normalizedEndTime.getTime() <= normalizedStartTime.getTime()) {
      normalizedEndTime.setDate(normalizedEndTime.getDate() + 1);
    }
  }

  const finalDiffInMs = normalizedEndTime.getTime() - normalizedStartTime.getTime();
  const diffInMinutes = Math.max(0, finalDiffInMs / (1000 * 60));
  
  // Round up to nearest 15 minutes
  const roundedMinutes = Math.ceil(diffInMinutes / 15) * 15;
  
  const decimalHours = roundedMinutes / 60;
  
  return {
    // numeric: decimalHours,
    numeric: roundedMinutes / 60, // For form validation/submission
    formatted: `${decimalHours.toFixed(2)}` // For display in 0.25-hour increments
  };
};
