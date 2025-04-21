import capitalize from "lodash/capitalize";
import { ShiftStatus } from "src/__generated__/resolvers-types";

export const getShiftStatus = (status: ShiftStatus): string => {
  if (status === ShiftStatus.Relinquished) {
    return 'Scratched';
  }
  return capitalize(status);
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