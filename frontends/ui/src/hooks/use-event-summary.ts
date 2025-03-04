import { useCallback, useState } from "react";
import prettyMilliseconds from 'pretty-ms';
import { useSnackbar } from "notistack";
import { useAuthContext } from "src/auth/hooks";
import { client } from "src/utils/apollo";
import { GET_EVENT_FOR_SUMMARY } from "src/api/event";
import { Assignment, Shift } from "src/__generated__/resolvers-types";
import { useDownloadCsv } from "./use-download-csv";
import { convertDate, dateFormat, dateTimeFormat } from "./use-datejs";
import { useFeatures } from "./use-features";
import { usePNumberLabel } from "./use-pNumber-label";

export const useEventSummary = () => {
  const { pNumberLabel } = usePNumberLabel();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { eventCheckIn, equipment, lasdEventFields } = useFeatures();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'event-summary',
    ext: 'csv',
  });

  const generateEventDownload = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      const { data: res } = await client.query({
        query: GET_EVENT_FOR_SUMMARY,
        variables: {
          id: eventId,
        },
      });
      const { event } = res;
      if (!event) {
        throw new Error('Event not found');
      }

      const shifts: Shift[] = (event.assignments || []).reduce((a: any[], assignment: Assignment) => {
        const aShifts = (assignment.shifts || []).map((shift, index) => ({
          ...shift,
          slotNumber: index + 1,
          assignment,
          event,
        }));
        return [
          ...a,
          ...aShifts,
        ];
      }, []);

      const formattedJson = shifts.map((shift: Shift) => {
        const checkInData: any = {};
        if (eventCheckIn) {
          const checkInTime = shift.shiftCheckInOut?.checkInTime ? convertDate({date: shift.shiftCheckInOut?.checkInTime, user}) : undefined;
          const checkOutTime = shift.shiftCheckInOut?.checkOutTime ? convertDate({date: shift.shiftCheckInOut?.checkOutTime, user}) : undefined;
          checkInData['Shift check in time'] = checkInTime ? checkInTime.format(dateTimeFormat) : '-';
          checkInData['Shift check out time'] = checkOutTime ? checkOutTime.format(dateTimeFormat) : '-';
          checkInData['Shift duration'] = checkOutTime && checkInTime ? prettyMilliseconds(checkOutTime.diff(checkInTime, 'milliseconds')) : '-';

          checkInData['Shift check in lat'] = shift.shiftCheckInOut?.checkInCoords?.latitude ? shift.shiftCheckInOut?.checkInCoords?.latitude : '-';
          checkInData['Shift check in long'] = shift.shiftCheckInOut?.checkInCoords?.longitude ? shift.shiftCheckInOut?.checkInCoords?.longitude : '-';
          checkInData['Shift check out lat'] = shift.shiftCheckInOut?.checkOutCoords?.latitude ? shift.shiftCheckInOut?.checkOutCoords?.latitude : '-';
          checkInData['Shift check out long'] = shift.shiftCheckInOut?.checkOutCoords?.longitude ? shift.shiftCheckInOut?.checkOutCoords?.longitude : '-';

          checkInData['Shift check in note'] = shift.shiftCheckInOut?.checkInNote ? shift.shiftCheckInOut?.checkInNote : '-';
          checkInData['Shift check out note'] = shift.shiftCheckInOut?.checkOutNote ? shift.shiftCheckInOut?.checkOutNote : '-';
        }

        return {
          [`Event Created By ${pNumberLabel}`]: shift.event.createdBy?.member?.pNumber || '',
          'Event Ref. #': shift.event.referenceId,
          ...(lasdEventFields ? {
            'OCN': shift.event.ocn || '-',
          } : {}),
          'Event Name': shift.event.name,
          'Venue Name': shift.event.venue?.name || '',
          'Event Start Date': shift.event.startTime ? convertDate({date: event.startTime, user}).format(dateFormat) : '',
          'Event End Date': shift.event.endTime ? convertDate({date: event.endTime, user}).format(dateFormat) : '',
          'Assignment Name': shift.assignment.name,
          'Shift Start': shift.startTime ? convertDate({date: shift.startTime, user}).format(dateTimeFormat) : '',
          'Shift End': shift.endTime ? convertDate({date: shift.endTime, user}).format(dateTimeFormat) : '',
          'Status': shift.status,
          'Required Skills': (shift.assignment.requiredSkills || [])?.map(({ name }: any) => name).join(','),
          'Ranks': (shift.assignment.ranks || [])?.map(({ name }: any) => name).join(','),
          'Equipment Needed': shift.assignment.bwNeeded ? 'yes' : 'no',
          ...(equipment ? {
            'Required Equipment': (shift.assignment.requiredEquipment || [{name: 'N/A'}])?.map(({ name }: any) => name).join(','),
          } : {}),
          [`Assignee Officer ${pNumberLabel}`]: shift.user?.member?.pNumber || '',
          'Assignee Officer First Name': shift.user?.firstName || '',
          'Assignee Officer Last Name': shift.user?.lastName || '',
          'Assignee Primary Phone Number': shift.user?.member?.contactInfo?.primaryPhone?.number || '',
          'Assignee Officer Primary Email Address': shift.user?.member?.contactInfo?.primaryEmail?.address || '',
          ...checkInData,
        };
      });
      download(formattedJson);
    } catch(error) {
      enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    eventCheckIn,
    lasdEventFields,
    equipment,
    pNumberLabel,
    enqueueSnackbar,
    download
  ]);

  return {
    generateEventDownload,
    loading,
  };
};
