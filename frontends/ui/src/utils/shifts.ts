import { Shift } from "src/__generated__/resolvers-types";

export const groupShiftsByEvent = (shifts?: Shift[]) =>
  (shifts || []).reduce((acc: Record<string, Shift[]>, shift: Shift) => {
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