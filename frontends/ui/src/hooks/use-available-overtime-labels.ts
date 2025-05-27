import { useMemo } from "react"
// types
import { EventStatus, Shift } from "src/__generated__/resolvers-types";
import { LabelVariant } from "src/components/label";

export const useAvailableOvertimeLabels = () => {
  const labels = useMemo(() => [
    {
      key: 'shift-event-status',
      variant: 'soft' as LabelVariant,
      getHidden: (shift: Shift) =>
        ![
          EventStatus.FirstComeFirstServe,
          EventStatus.InterestList,
        ].includes(
          shift?.event?.status
        ),
      getColor: (shift: Shift) => {
        if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
          return 'success';
        }
        if (shift?.event?.status === EventStatus.InterestList && shift.shiftInterestRequest?.id) {
          return 'default';
        }
        return 'primary';
      },
      getLabel: (shift: Shift) => {
        if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
          return 'First Come First Serve';
        }
        if (shift?.event?.status === EventStatus.InterestList) {
          if (shift.shiftInterestRequest?.id) {
            return 'Interest List (Requested)';
          }
          return 'Interest List';
        }
        return '';
      },
    },
  ], []);

  return {
    labels
  };
}