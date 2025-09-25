import { useCallback } from "react";
import { useSnackbar } from "notistack";
import { useEventSummary } from "src/hooks/use-event-summary";
import { PDFDocument } from "pdf-lib";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Event, EventStatus, FinanceShift } from "src/__generated__/resolvers-types";
import { useDownloadPdf } from "src/hooks/use-download-pdf";
import { useIncidentSummary } from "src/hooks/use-incident-summary";
import { useBillingByEvent } from "src/hooks/use-billing-by-event";
import ReportLink from "./report-link";

interface Props {
  event: Event;
  data: FinanceShift[];
}

export default function ReportDetails({
  event,
  data,
}: Props) {
  const isIncident = event?.status === EventStatus.Incident;
  const eventName = event.name || 'Event';
  const { downloadSummary } = useIncidentSummary();
  const overtimeSlipDocumentIndex = isIncident ? 1 : 0;
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadPdf({
    fileName: 'docusign-bundle',
  });
  const { generateEventDownload } = useEventSummary();
  const { downloadReport } = useBillingByEvent({ eventId: event.id });

  // Download documentBundle
  const downloadDocuments = useCallback((
    documentName:string,
    documentIndex: number
  ) => async () => {
    try {
      enqueueSnackbar(`Preparing PDF bundle: ${documentName}...`, {
        variant: 'info',
        autoHideDuration: 3000,
      });
      const documentUrls = data
        .map((item) => item.docusignEvent?.documentUrls?.[documentIndex])
        .filter(Boolean);

      if (documentUrls.length > 0) {
        const pdfDoc = await PDFDocument.create();
        // eslint-disable-next-line no-restricted-syntax
        for (const url of documentUrls) {
          // download overtime slip
          const slipPdfBytes = await fetch(url as string).then(response => response.arrayBuffer()); // eslint-disable-line no-await-in-loop
          // load/convert the slip into a PDFDocument object
          const slipPdfDoc = await PDFDocument.load(slipPdfBytes); // eslint-disable-line no-await-in-loop
          // iterate over slip's pages
          const slipPages = await pdfDoc.copyPages(slipPdfDoc, slipPdfDoc.getPageIndices()); // eslint-disable-line no-await-in-loop
          // add pages to main pdf
          slipPages.forEach((page) => pdfDoc.addPage(page));
        }

        // convert pdf into file buffer
        const pdfDocBuffer = await pdfDoc.save();

        download(pdfDocBuffer, `${eventName}: ${documentName}.pdf`);
      }
    } catch(error) {
      enqueueSnackbar(`Failed to download PDF bundle: ${documentName}. Please try again.`, {
        variant: 'error',
        autoHideDuration: 5000,
      });
    }
  }, [
    eventName,
    data,
    download,
    enqueueSnackbar,
  ]);

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h4" component="h2">
          Reports
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <ReportLink title="Incident/Event Report" subtitle="CSV Download" onClick={() => {
          enqueueSnackbar(`Preparing summary for ${eventName}...`, {
            variant: 'info',
            autoHideDuration: 3000,
          });
          if (isIncident) {
            downloadSummary({ event });
            return;
          }
          generateEventDownload(event.id);
        }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ReportLink title="Overtime Slip" subtitle="PDF Bundle" onClick={downloadDocuments('Overtime Slip', overtimeSlipDocumentIndex)} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ReportLink
          icon="mdi:google-spreadsheet"
          title="Billing Report"
          subtitle="Excel Download"
          disabled={event.status === EventStatus.Incident}
          disabledTooltip="Billing reports are only available for pre planned events."
          onClick={() => downloadReport(event.id)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ReportLink
          title="Form 214"
          subtitle="PDF Bundle"
          disabled={event.status !== EventStatus.Incident}
          disabledTooltip="Form 214 is only available for Incident events."
          onClick={downloadDocuments('Form 214', 0)}
        />
      </Grid>
    </>
  );
}