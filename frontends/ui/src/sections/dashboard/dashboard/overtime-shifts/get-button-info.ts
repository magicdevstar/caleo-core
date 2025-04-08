import { isAfter, isBefore, subHours } from 'date-fns';
import {
  Organization,
  Shift,
  ShiftBufferRequest,
  ShiftStatus,
} from 'src/__generated__/resolvers-types';

export const getButtonInfo = (organization: Organization, shift: Shift | ShiftBufferRequest) => {
  if (shift.__typename === 'ShiftBufferRequest') {
    return {
      icon: 'mdi:close-thick',
      title: 'Cancel Buffer Request',
      disabled: false,
    };
  }

  if (!organization?.settings?.userRelinquishShift?.enabled) {
    return {
      icon: 'mdi:check',
      title: 'Secured',
      disabled: true,
    };
  }
  const startDate = new Date(shift.startTime);
  const endDate = new Date(shift.endTime);
  const numberOfHoursBeforeShift =
    organization?.settings?.userRelinquishShift?.numberOfHoursBeforeShift;
  const disableDate = subHours(startDate, numberOfHoursBeforeShift || 0);
  const now = new Date();
  const disabled = isAfter(now, disableDate);

  if (isAfter(now, startDate) && isBefore(now, endDate)) {
    return {
      icon: 'mdi:clock-alert',
      title: 'In Progress',
      disabled,
    };
  }
  if (isAfter(now, endDate)) {
    return {
      icon: 'mdi:check',
      title: 'Secured',
      disabled,
    };
  }
  if (shift.status === ShiftStatus.Locked) {
    return {
      icon: 'mdi:lock',
      title: 'Locked',
      disabled: true,
    };
  }
  return {
    icon: 'mdi:close-thick',
    title: 'Scratch',
    disabled,
  };
};
