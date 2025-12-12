import { useEffect, useCallback, useMemo } from 'react';
import Calendar from '@fullcalendar/react'; // => request placed at the top
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import { EventClickArg } from '@fullcalendar/core';
import { toZonedTime } from 'date-fns-tz';
// @mui
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import Container, { ContainerProps } from '@mui/material/Container';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// types
import { ICalendarEvent, CalendarShift } from 'src/types/calendar';
import { Shift, ShiftBufferRequest, ShiftLotteryRequest, ShiftStatus } from 'src/__generated__/resolvers-types';
//
import { useCalendar } from './hooks';
import { StyledCalendar } from './styles';
import CalendarToolbar from './calendar-toolbar';

// ----------------------------------------------------------------------

type ShiftCalendarProps = ContainerProps & {
  shifts?: CalendarShift[],
  loading?: boolean;
  timezone?: string;
  startDay?: number;
  onShiftClick?: (shift: CalendarShift) => void;
}

const isShiftType = (shift: CalendarShift) => shift.__typename === 'Shift';

// ----------------------------------------------------------------------

export default function ShiftCalendar({ shifts, loading = false, timezone, startDay = 0, onShiftClick, ...other } : ShiftCalendarProps) {
  const theme = useTheme();

  const smUp = useResponsive('up', 'sm');

  const {
    calendarRef,
    //
    view,
    date,
    //
    onDatePrev,
    onDateNext,
    onDateToday,
    onChangeView,
    onInitialView,
  } = useCalendar();

  useEffect(() => {
    onInitialView();
  }, [onInitialView]);

  const onEventClick = useCallback((arg: EventClickArg) => {
    const { event } = arg;
    onShiftClick?.(event.extendedProps as CalendarShift);
  }, [onShiftClick]);

  const getShiftColor = useCallback((shift: Shift) => {
    const currentTime = new Date().getTime();
    const shiftEndTime = new Date(shift?.endTime).getTime();
    if (currentTime > shiftEndTime) {
      return theme.palette.background.default;
    }
    switch (shift?.status) {
      case ShiftStatus.Assigned:
        return theme.palette.success.main;
      case ShiftStatus.Available:
        return theme.palette.primary.main;
      case ShiftStatus.Relinquished:
        return theme.palette.error.main;
      case ShiftStatus.Unassigned:
        return theme.palette.warning.main;
      case ShiftStatus.Locked:
        return theme.palette.secondary.main;
      case ShiftStatus.Removed:
      default:
        return theme.palette.grey[800];
    }
  }, [theme]);

  const formattedShifts: ICalendarEvent[] = useMemo(() => (shifts || []).map(({color, ...shift}) => {
    const inputShift = isShiftType(shift) ? shift as Shift : (shift as ShiftBufferRequest | ShiftLotteryRequest)?.shift;
    return {
      id: inputShift?.id || '',
      allDay: false,
      color: color || getShiftColor(inputShift as Shift),
      textColor: color || getShiftColor(inputShift as Shift),
      title: `${shift?.event?.name} - ${shift?.assignment?.name}`,
      start: toZonedTime(inputShift?.startTime || 0, timezone || 'America/Los_Angeles').toISOString(),
      end: toZonedTime(inputShift?.endTime || 0, timezone || 'America/Los_Angeles').toISOString(),
      extendedProps: shift,
    };
  }), [shifts, getShiftColor, timezone]);

  return (
    <Container maxWidth={false} {...other}>
      <Card>
        <StyledCalendar>
          <CalendarToolbar
            date={date}
            view={view}
            loading={loading}
            weekStartsOn={startDay}
            onNextDate={onDateNext}
            onPrevDate={onDatePrev}
            onToday={onDateToday}
            onChangeView={onChangeView}
          />

          <Calendar
            weekends
            rerenderDelay={10}
            ref={calendarRef}
            initialDate={date}
            initialView={view}
            firstDay={startDay}
            dayMaxEventRows={3}
            views={{
              timeGridDay: {
                eventMaxStack: 10,
              },
              timeGridWeek: {
                eventMaxStack: 3,
              }
            }}
            eventDisplay="block"
            events={formattedShifts}
            headerToolbar={false}
            eventClick={onEventClick}
            height={smUp ? 720 : 'auto'}
            displayEventTime
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            plugins={[
              listPlugin,
              dayGridPlugin,
              timelinePlugin,
              timeGridPlugin,
              interactionPlugin,
            ]}
          />
        </StyledCalendar>
      </Card>
    </Container>
  );
}
