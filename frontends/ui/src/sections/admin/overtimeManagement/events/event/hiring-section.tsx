import { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
// @mui
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
// components
import { RHFSelect, RHFSwitch } from "src/components/hook-form";
import { EditSection } from "src/sections/admin/overtimeManagement/events/common/section";
// hooks
import { useAuthContext } from 'src/auth/hooks';
import { useLotteryCounterOptions } from 'src/hooks/use-lottery-counter-options';
import { useDateFormats } from 'src/hooks/use-datejs';
// types
import { EventStatus, Event } from 'src/__generated__/resolvers-types';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  disabled?: boolean; // eslint-disable-line react/no-unused-prop-types
  currentEvent?: Event; // eslint-disable-line react/no-unused-prop-types
}

export const EventHiringSection = ({
  disabled,
  currentEvent,
}: Props) => {
  const { getValues } = useFormContext();
  const currentFormValues = getValues();

  return (
    <EditSection title="Hiring" description="Hiring Details">
      {
        currentFormValues.status === EventStatus.InterestList && (
          <EventHiringInterestList
            currentEvent={currentEvent}
            disabled={disabled}
            currentFormValues={currentFormValues}
          />
        )
      }
      {
        currentFormValues.status === EventStatus.FirstComeFirstServe && (
          <EventFCFSSection
            disabled={disabled}
            currentFormValues={currentFormValues}
          />
        )
      }
      {
        currentFormValues.status === EventStatus.ReadyForLottery && (
          <EventLotterySection
            disabled={disabled}
            currentEvent={currentEvent}
          />
        )
      }

      <RHFSwitch disabled={disabled} name="notifyWhenFullyStaffed" label="Notify when fully staffed" />
    </EditSection>
  );
}

export const EventLotterySection = ({
  disabled,
  currentEvent,
}: Props) => {
  const { setValue, watch } = useFormContext();
  const status = watch("status");
  const lotteryNumber = watch("lotteryNumber");
  const { dateTimeFormat } = useDateFormats();
  const { user } = useAuthContext();
  const { options } = useLotteryCounterOptions({
    org: user.member.org!,
    countValue: currentEvent?.lotteryCounter,
    dateLimit: currentEvent?.endTime || undefined,
  });

  // Auto select the first lottery option if none is selected
  useEffect(() => {
    if(!lotteryNumber) {
      setValue('lotteryNumber', options[0]?.counter);
    }
  }, [options, status, lotteryNumber, setValue]);

  return (
    <RHFSelect
      fullWidth
      disabled={disabled}
      name="lotteryNumber"
      label="Lottery Date"
      InputLabelProps={{ shrink: true }}
      PaperPropsSx={{ textTransform: 'capitalize' }}
      helperText={`FCFS: ${options
        .find(({ counter }) => counter === lotteryNumber)
        ?.endDate.add(user?.member?.org?.settings?.lottery?.fcfsShiftsDelay || 1, 'hours')?.format(dateTimeFormat)
      }`}
    >
      {options.map((option) => (
        <MenuItem key={option.counter} value={option.counter}>
          {option.time}
        </MenuItem>
      ))}
    </RHFSelect>
  )
}

export const EventFCFSSection = ({
  disabled,
  currentFormValues,
}: Props & { currentFormValues: any }) => {
  const { setValue } = useFormContext();
  const { user } = useAuthContext();
  return (
    <>
      <DateTimePicker
        label="First come first serve start time"
        ampm={false}
        disabled={disabled}
        timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
        timezone={user.member.org?.timezone}
        value={currentFormValues?.scheduledFirstComeFirstServe ? dayjs(new Date(currentFormValues?.scheduledFirstComeFirstServe)) : dayjs(new Date())}
        onChange={(date) => {
          setValue('scheduledFirstComeFirstServe', date ? dayjs(date).toISOString() : '')
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            margin: 'normal'
          },
        }}
      />

      <RHFSwitch disabled={disabled} name="notifyOnFirstComeFirstServe" label="Notify when first come first serve is available" />
    </>
  );
}

export const EventHiringInterestList = ({
  disabled,
  currentFormValues,
  currentEvent,
}: Props & { currentFormValues: any }) => {
  const { setValue } = useFormContext();
  const { user } = useAuthContext();

  const autoHireEndTime = useMemo(() => {
    if (currentFormValues?.interestListAutoAssignCutoff) {
      return dayjs(new Date(currentFormValues?.interestListAutoAssignCutoff));
    }

    const proposedEndTime = dayjs(
      currentEvent?.startTime ? new Date(currentEvent.startTime) : new Date()
    ).subtract(
      user.member.org?.settings?.interestList?.defaultAutoHireCutoff || 7,
      'days'
    );

    if (dayjs(Date.now()).isAfter(proposedEndTime)) {
      return dayjs(new Date(currentEvent?.startTime || Date.now())).add(24, 'hours');
    }

    return proposedEndTime;
  }, [
    currentEvent,
    currentFormValues?.interestListAutoAssignCutoff,
    user.member.org?.settings?.interestList?.defaultAutoHireCutoff
  ]);

  const autoHireStartTime = useMemo(() => {
    if (currentFormValues?.scheduledCloseInterestList) {
      return dayjs(new Date(currentFormValues?.scheduledCloseInterestList));
    }

    const proposedStartTime = dayjs(autoHireEndTime).subtract(24, 'hours');

    if (dayjs(Date.now()).isAfter(proposedStartTime)) {
      return dayjs(Date.now());
    }

    return proposedStartTime;
  },
  [
    currentFormValues?.scheduledCloseInterestList,
    autoHireEndTime
  ]);

  return (
    <>
      <DateTimePicker
        label="Interest list start time"
        ampm={false}
        disabled={disabled}
        timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
        timezone={user.member.org?.timezone}
        value={
          currentFormValues?.scheduledInterestList ?
          dayjs(new Date(currentFormValues?.scheduledInterestList)) :
          dayjs(new Date())
        }
        onChange={(date) => {
          setValue('scheduledInterestList', date ? dayjs(date).toISOString() : '')
        }}
        slotProps={{
          textField: {
            helperText: 'Date officers are able to express interest in the shifts.',
            fullWidth: true,
            margin: 'normal',
          },
        }}
      />
      <RHFSwitch disabled={disabled} name="autoAssignInterestList" label="Auto assign shifts" />
      {
        currentFormValues.autoAssignInterestList && (
          <Stack direction="row" spacing={2} alignItems="center">
            <DateTimePicker
              label="Auto Hire Start Time"
              ampm={false}
              disabled={disabled}
              timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
              timezone={user.member.org?.timezone}
              minDate={currentFormValues?.scheduledInterestList ? dayjs(new Date(currentFormValues?.scheduledInterestList)) : dayjs(new Date())}
              value={autoHireStartTime}
              onChange={(date) => {
                setValue('scheduledCloseInterestList', date ? dayjs(date).toISOString() : '')
              }}
              slotProps={{
                textField: {
                  helperText: 'Date the interest list automatically begins assigning shifts.',
                  fullWidth: true,
                  margin: 'normal',
                },
              }}
            />
            <Typography variant="body1">-</Typography>
            <DateTimePicker
              label="Auto Hire End Time"
              ampm={false}
              disabled={disabled}
              minDate={autoHireStartTime}
              timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
              timezone={user.member.org?.timezone}
              value={autoHireEndTime}
              onChange={(date) => {
                setValue('interestListAutoAssignCutoff', date ? dayjs(date).toISOString() : '')
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  helperText: 'Date the interest list stops assigning available shifts.'
                },
              }}
            />
          </Stack>
        )
      }
    </>
  )
};
