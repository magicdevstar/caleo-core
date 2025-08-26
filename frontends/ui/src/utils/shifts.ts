import { Shift } from "src/__generated__/resolvers-types";

export const groupShiftsByEvent = (shifts?: Shift[]) => {
  
  const grouped = (shifts || []).reduce((acc: Record<string, Shift[]>, shift: Shift) => {
    const eventId = shift.event?.id;
    if (!acc[eventId]) {
      acc[eventId] = [];
      }
      acc[eventId].push(shift);

      acc[eventId].sort((a, b) => {
        if (a.id < b.id) {
          return 1;
        }
        if (a.id > b.id) {
          return -1;
        }
        return 0;
      });
      return acc;
    }, {} as Record<string, Shift[]>);

  // Sort events by start date (latest first) and create a new ordered object
  const sortedEntries = Object.entries(grouped).sort(([, shiftsA], [, shiftsB]) => {
    const dateA = new Date(shiftsA[0]?.event?.startTime || 0);
    const dateB = new Date(shiftsB[0]?.event?.startTime || 0);
    return dateB.getTime() - dateA.getTime(); // Latest first
  });

  // Convert back to Record maintaining the sorted order
  return Object.fromEntries(sortedEntries);
}