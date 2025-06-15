import { useLazyQuery } from "@apollo/client";
import { PDFDocument } from 'pdf-lib';
import { useSnackbar } from "notistack";
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
      const shifts = rawShifts
        .filter((shift: Shift) => shift.user)
        .sort((a: Shift, b: Shift) => {
          const aName = `${a.user?.lastName}, ${a.user?.firstName}`;
          const bName = `${b.user?.lastName}, ${b.user?.firstName}`;

          return aName.localeCompare(bName) || a.id.localeCompare(b.id);
        });
      if (shifts.length === 0) {
        enqueueSnackbar("No shifts available for end of shift form.", { variant: "warning", autoHideDuration: 5000 });
        return;
      }

      const mergedPdf = await PDFDocument.create();
      await Promise.allSettled(shifts.map(async (shift: Shift, index: number) => {
        const pdf = await downloadEndOfShiftPDF(shift.id, false);
        if (pdf) {
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
      }));
      const mergedPdfFile = await mergedPdf.save();

      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventName}.pdf`;
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
