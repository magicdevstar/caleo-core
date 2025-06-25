import capitalize from "lodash/capitalize";
import { Shift, ShiftStatus } from "src/__generated__/resolvers-types";

export const getShiftStatus = (shift: Shift): string => {
  if (shift.status === ShiftStatus.Relinquished) {
    return 'Scratched';
  }

  if (shift.locked) {
    return 'Locked';
  }

  return capitalize(shift.status);
}

export const formattedStatus = [
  {
    label: 'Assigned',
    value: ShiftStatus.Assigned,
  },
  {
    label: 'Available',
    value: ShiftStatus.Available,
  },
  {
    label: 'Locked',
    value: ShiftStatus.Locked,
  },
  {
    label: 'Scratched',
    value: ShiftStatus.Relinquished,
  },
  {
    label: 'Removed',
    value: ShiftStatus.Removed,
  },
  {
    label: 'Unassigned',
    value: ShiftStatus.Unassigned,
  },
];