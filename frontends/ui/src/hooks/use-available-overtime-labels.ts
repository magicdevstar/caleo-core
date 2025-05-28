import { useTheme, rgbToHex } from "@mui/material/styles";
import { useMemo } from "react"
// types
import { EventStatus, Shift } from "src/__generated__/resolvers-types";
import { LabelVariant } from "src/components/label";

const getColor = (shift: Shift) => {
  if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
    return 'success';
  }
  if (shift?.event?.status === EventStatus.InterestList && shift.shiftInterestRequest?.id) {
    return 'default';
  }
  return 'primary';
};

export const useAvailableOvertimeLabels = () => {
  const theme = useTheme();
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
      getHex: (shift: Shift) => {
        const value = getColor(shift);

        return rgbToHex(theme.palette[value as 'primary' | 'success' | 'error']?.main || theme.palette.background.default);
      },
      getColor,
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
  ], [theme]);

  return {
    labels
  };
}