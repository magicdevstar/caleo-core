import { useCallback, useState } from "react";
import { useSnackbar } from "notistack";
import { useAuthContext } from "src/auth/hooks";
import { client } from "src/utils/apollo";
import { GET_EVENT_FOR_SUMMARY } from "src/api/event";
import { Assignment, Shift } from "src/__generated__/resolvers-types";
import { useDownloadCsv } from "./use-download-csv";
import { convertDate, dateFormat, dateTimeFormat } from "./use-datejs";

export const useEventSummary = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
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

      const formattedJson = shifts.map((shift: Shift) => ({
        'Event Created By P#': shift.event.createdBy?.member?.pNumber || '',
        'Event Ref. #': shift.event.referenceId,
        'Event Name': shift.event.name,
        'Venue Name': shift.event.venue?.name || '',
        'Event Start Date': shift.event.startTime ? convertDate({date: event.startTime, user}).format(dateFormat) : '',
        'Event End Date': shift.event.endTime ? convertDate({date: event.endTime, user}).format(dateFormat) : '',
        'Assignment Name': shift.assignment.name,
        'Shift Start': shift.startTime ? convertDate({date: shift.startTime, user}).format(dateTimeFormat) : '',
        'Shift End': shift.endTime ? convertDate({date: shift.endTime, user}).format(dateTimeFormat) : '',
        'Status': shift.status,
        'Required Skills': `"${(shift.assignment.requiredSkills || [])?.map(({ name }: any) => name).join('\\,')}"`,
        'Ranks': `"${shift.assignment.ranks?.map(({ name }: any) => name).join('\\,')}"`,
        'Equipment Needed': shift.assignment.bwNeeded ? 'yes' : 'no',
        'Assignee Officer P#': shift.user?.member?.pNumber || '',
        'Assignee Officer First Name': shift.user?.firstName || '',
        'Assignee Officer Last Name': shift.user?.lastName || '',
        'Assignee Primary Phone Number': shift.user?.member?.contactInfo?.primaryPhone?.number || '',
        'Assignee Officer Primary Email Address': shift.user?.member?.contactInfo?.primaryEmail?.address || '',
      }));
      download(formattedJson);
    } catch(error) {
      enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, enqueueSnackbar, download]);

  return {
    generateEventDownload,
    loading,
  };
};
