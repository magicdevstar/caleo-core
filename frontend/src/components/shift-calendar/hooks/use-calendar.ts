import FullCalendar from '@fullcalendar/react';
import { useState, useCallback, useRef } from 'react';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// types
import { ICalendarView } from 'src/types/calendar';

// ----------------------------------------------------------------------

export default function useCalendar() {
  const calendarRef = useRef<FullCalendar>(null);

  const smUp = useResponsive('up', 'sm');

  const [date, setDate] = useState(new Date());

  const [view, setView] = useState<ICalendarView>(smUp ? 'dayGridMonth' : 'listWeek');

  const onInitialView = useCallback(() => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      const newView = smUp ? 'dayGridMonth' : 'listWeek';
      calendarApi.changeView(newView);
      setView(newView);
    }
  }, [smUp]);

  const onChangeView = useCallback((newView: ICalendarView) => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.changeView(newView);
      setView(newView);
    }
  }, []);

  const onDateToday = useCallback(() => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  }, []);

  const onDatePrev = useCallback(() => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.prev();
      setDate(calendarApi.getDate());
    }
  }, []);

  const onDateNext = useCallback(() => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.next();
      setDate(calendarApi.getDate());
    }
  }, []);

  return {
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
  };
}
