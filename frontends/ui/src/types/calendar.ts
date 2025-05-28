import { Shift, ShiftBufferRequest, ShiftLotteryRequest } from "src/__generated__/resolvers-types";

// ----------------------------------------------------------------------

export type ICalendarDate = string | number;

export type ICalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export type CalendarShift = (Shift | ShiftBufferRequest | ShiftLotteryRequest) & {
  color?: string;
};

export type ICalendarEvent = {
  id: string;
  color: string;
  title: string | any;
  allDay?: boolean;
  description?: string;
  end: ICalendarDate;
  start: ICalendarDate;
  extendedProps?: CalendarShift;
};
