import FullCalendar from '@fullcalendar/react';
import { useState, useCallback, useRef, useEffect } from 'react';
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

  // Temporary fix to prevent the event overflow popover from being clipped
  useEffect(() => {
    function forceScrollOnPopover(event: MouseEvent) {
      const targetClassName = (event?.target as HTMLElement)?.className;
      if (typeof targetClassName === 'string' && targetClassName.split(' ').includes('fc-more-link')) {
        // wait for popover to render
        setTimeout(() => {
          const popoverBodyEl = Array.from(document.getElementsByClassName('fc-popover') as HTMLCollectionOf<HTMLElement>)[0];
          const calendarEl = Array.from(document.getElementsByClassName('fc') as HTMLCollectionOf<HTMLElement>)[0];
          if (popoverBodyEl && calendarEl) {
            const popoverPos = popoverBodyEl.getBoundingClientRect();
            const calendarPos = calendarEl.getBoundingClientRect();
            console.log(popoverPos, calendarPos);

            if (popoverPos.bottom > calendarPos.bottom) {
              console.log('bottom set');
              popoverBodyEl.style.bottom = '0';
            }
            if (popoverPos.right > calendarPos.right) {
              console.log('right set');
              popoverBodyEl.style.right = '0';
            }
          }
        })
      }
    }
    window.addEventListener('click', forceScrollOnPopover);
    return () => {
      console.log('cleanup');
      window.removeEventListener('click', forceScrollOnPopover);
    }
  });

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
