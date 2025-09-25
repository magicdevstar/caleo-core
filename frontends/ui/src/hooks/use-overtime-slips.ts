/* eslint-disable no-await-in-loop */
import { useCallback, useState } from "react";
import sortBy from "lodash/sortBy";
import { useSnackbar } from "notistack";
import { PDFDocument } from "pdf-lib";
import { client } from "src/utils/apollo";
import { GET_EVENT_FOR_REPORT } from "src/api/event";
import { Assignment, Shift } from "src/__generated__/resolvers-types";
import { useDownloadPdf } from "./use-download-pdf";

export const useOvertimeSlips = () => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadPdf({
    fileName: 'overtime-slips'
  });

  const generateOvertimeSlipsDownload = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      const { data: res } = await client.query({
        query: GET_EVENT_FOR_REPORT,
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

      // get overtime slip urls sorted by last name
      const shiftsWithOvertimeSlips = shifts.filter(shift => !!shift.docusignEvent?.documentUrl);
      const overtimeSlipUrls = sortBy(shiftsWithOvertimeSlips, ['user.lastName', 'startTime'])
        .map(shift => shift.docusignEvent?.documentUrl);

      if (!overtimeSlipUrls.length) {
        enqueueSnackbar('No shifts with overtime slips found', { variant: 'info', autoHideDuration: 3000 });
        return;
      }

      // create main pdf
      const pdfDoc = await PDFDocument.create();

      // eslint-disable-next-line no-restricted-syntax
      for (const url of overtimeSlipUrls) {
        // download overtime slip
        const slipPdfBytes = await fetch(url as string).then(response => response.arrayBuffer());
        // load/convert the slip into a PDFDocument object
        const slipPdfDoc = await PDFDocument.load(slipPdfBytes);
        // iterate over slip's pages
        const slipPages = await pdfDoc.copyPages(slipPdfDoc, slipPdfDoc.getPageIndices());
        // add pages to main pdf
        slipPages.forEach((page) => pdfDoc.addPage(page));
      }

      // convert pdf into file buffer
      const pdfDocBuffer = await pdfDoc.save();

      download(pdfDocBuffer);
    } catch(error) {
      enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    enqueueSnackbar,
    download,
  ]);

  return {
    generateOvertimeSlipsDownload,
    loading,
  };
};
