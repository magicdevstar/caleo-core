import { useLazyQuery } from "@apollo/client";
import { useSnackbar } from "notistack";
import { zipSync } from 'fflate';
import { Assignment, Shift } from "src/__generated__/resolvers-types";
import { GET_ALL_EVENT_SHIFTS } from "src/api/event";
import { GET_SHIFT_TABS } from "src/api/shifts";
import { generateFilledPDF } from "src/utils/generate-files/end-of-shift";

export const useEndOfShiftDownload = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [getAllShifts] = useLazyQuery(GET_ALL_EVENT_SHIFTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });

  const [getTabs] = useLazyQuery(GET_SHIFT_TABS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });

  const downloadEndOfShiftPDF = async (shiftId: string, openTab: boolean = true) => {
    try {
      const { data: { shiftTabs } } = await getTabs({
        variables: { id: shiftId },
      });
      const tabData: Record<string, any> = JSON.parse(shiftTabs.data);

      const res = await generateFilledPDF({
        data: tabData,
        openTab,
        pdfPath: `${shiftTabs.orgId}/${shiftTabs.templateName || 'shift-close'}`,
      });
      return res;
    } catch(error) {
      enqueueSnackbar("Error end of shift details", { variant: "error", autoHideDuration: 5000 });
    }
    return undefined;
  };

  const downloadAllEventShiftsPDF = async (eventId: string, eventName: string) => {
    try {
      enqueueSnackbar("Generating end of shift reports...", { variant: "info", autoHideDuration: 5000 });
      const res = await getAllShifts({
        variables: { id: eventId },
      });
      const rawShifts = res.data.event?.assignments?.flatMap?.((assignment: Assignment) =>
        assignment.shifts?.map((shift) => ({ ...shift, assignment: { name: assignment.name } }))
      ) || [];
      const shifts = rawShifts.filter((shift: Shift) => shift.user);
      if (shifts.length === 0) {
        enqueueSnackbar("No shifts available for end of shift form.", { variant: "warning", autoHideDuration: 5000 });
        return;
      }

      const files: Record<string, Uint8Array> = {};

      await Promise.allSettled(shifts.map(async (shift: Shift, index: number) => {
        const data = await downloadEndOfShiftPDF(shift.id, false);
        if (data) {
          const fileName = `${eventName}/${shift.assignment.name}/${shift.user?.firstName}-${shift.user?.lastName}-${shift.id}.pdf`;
          files[fileName] = data;
        }
      }));

      const zippedData = zipSync(files);
      const blob = new Blob([zippedData], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventName}.zip`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      enqueueSnackbar("Error generating end of shift reports", { variant: "error", autoHideDuration: 5000 });
    }
  };

  return {
    downloadEndOfShiftPDF,
    downloadAllEventShiftsPDF,
  }
};
