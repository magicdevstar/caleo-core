import { useMemo } from "react"
import { useAuthContext } from "src/auth/hooks";
// types
import { EventStatus, Shift } from "src/__generated__/resolvers-types";
import { LabelVariant } from "src/components/label";
// hooks
import { useLotteryCounterOptions } from "./use-lottery-counter-options";
import { convertDate, useDateFormats } from "./use-datejs";

export const useUpcomingOvertimeLabels = () => {
  const { user } = useAuthContext();
  const { dateTimeFormat } = useDateFormats();
  const { options: lotteryCounterOptions } = useLotteryCounterOptions({
    org: user.member.org!,
  });

  const labels = useMemo(() => [
    {
      key: 'shift-post-date',
      variant: 'soft' as LabelVariant,
      sx: {
        border: 'none',
        background: 'none',
      },
      getHidden: (shift: Shift) =>
        ![
          EventStatus.ReadyForLottery,
          EventStatus.FirstComeFirstServe,
          EventStatus.InterestList,
        ].includes(
          shift?.event?.status
        ),
      getLabel: (shift: Shift) => {
        if (shift?.event?.status === EventStatus.ReadyForLottery) {
          const foundCounter = lotteryCounterOptions.find(
            (c) => c.counter === shift?.event?.lotteryNumber
          );
          if (!foundCounter) {
            return '';
          }
          return foundCounter?.time;
        }
        if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
          const fcfsDate = convertDate({
            date: shift?.event?.scheduledFirstComeFirstServe || '',
            user,
          });
          return `${fcfsDate.format(dateTimeFormat)}`;
        }
        if (shift?.event?.status === EventStatus.InterestList) {
          const interestDate = convertDate({
            date: shift?.event?.scheduledInterestList || '',
            user,
          });
          return `${interestDate.format(dateTimeFormat)}`;
        }
        return '';
      },
    },
    {
      key: 'shift-event-status',
      variant: 'soft' as LabelVariant,
      getHidden: (shift: Shift) =>
        ![
          EventStatus.ReadyForLottery,
          EventStatus.FirstComeFirstServe,
          EventStatus.InterestList,
        ].includes(
          shift?.event?.status
        ),
      getColor: (shift: Shift) => {
        if (shift?.event?.status === EventStatus.ReadyForLottery) {
          return 'success';
        }
        if ([
          EventStatus.FirstComeFirstServe,
          EventStatus.InterestList,
        ].includes(shift?.event?.status || '')) {
          return 'primary';
        }
        return 'default';
      },
      getLabel: (shift: Shift) => {
        if (shift?.event?.status === EventStatus.ReadyForLottery) {
          return 'Pre-Lottery';
        }
        if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
          return 'Pre-First Come First Serve';
        }
        if (shift?.event?.status === EventStatus.InterestList) {
          return 'Pre-Interest List';
        }
        return '';
      },
    },
  ], [
    dateTimeFormat,
    user,
    lotteryCounterOptions,
  ]);

  return {
    labels
  };
}