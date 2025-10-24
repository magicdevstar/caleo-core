import { useSnackbar } from "notistack";
import { client } from "src/utils/apollo";
import ExcelJS from 'exceljs';
// hooks
import { useAuthContext } from "src/auth/hooks";
import { useDateFormats } from "src/hooks/use-datejs";
import { useDownloadExcel } from "src/hooks/use-download-excel";
import {
  generateContractLawVehicleWorksheet,
  generateContractLawWorksheet,
  generatePayAndLeaveWorksheet,
  modifyReportHeader
} from 'src/utils/excel-billing-event-builder';
// types
import { GET_EVENT_FOR_REPORT } from "src/api/event";
import { Event, Assignment, Shift } from "src/__generated__/resolvers-types";

export const useBillingByEvent = ({ eventId }: { eventId: string }) => {
  const { user } = useAuthContext();
  const { miniDateFormat, timeFormat } = useDateFormats();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadExcel({ fileName: 'event-billing-by-event' });

  const downloadReport = async (id?: string) => {
    try {
      enqueueSnackbar('Preparing Excel report...', {
        variant: 'info',
        autoHideDuration: 3000,
      });
      // I guess I could have just done a search for shifts but for whatever reason this feels more efficient 🤷‍♂️
      const { data: res } = await client.query({
        query: GET_EVENT_FOR_REPORT,
        variables: {
          id: id || eventId,
        },
      });
      const { event } = res as { event: Event };
      if (!event) {
        throw new Error('Event not found');
      }

      // create shift lists
      const shifts: Shift[] = [];
      const shiftsByRank: Record<string, Shift[]> = {};
      const shiftsByVehicle: Record<string, Shift[]> = {};
      (event.assignments || []).forEach((assignment: Assignment) => {
        (assignment.shifts || []).forEach((shift) => {
          if (!shift?.user || shift.shiftCheckInOut?.noShow) {
            // skip if user is not assigned or was a no show
            return;
          }
          const newShift = {...shift, assignment, event} as Shift;
          // add to shift list
          shifts.push(newShift);

          // add to shifts by rank grouping
          const rankKey = shift?.user?.member?.rankId;
          if (rankKey) {
            shiftsByRank[rankKey] = [...(shiftsByRank[rankKey] || []), newShift];
          }

          // add to shifts by vehicle grouping
          const vehicleKey = shift?.shiftCheckInOut?.equipmentDetails?.vehicleCategory?.name || 'default';
          if (vehicleKey && shift?.docusignEvent?.signerDetails?.[0]?.data?.startingMilage) {
            if (!shiftsByVehicle[vehicleKey]) {
              shiftsByVehicle[vehicleKey] = [];
            }
            shiftsByVehicle[vehicleKey] = [...(shiftsByVehicle[vehicleKey]), newShift];
          }
        });
      });

      // return if no shifts with assigned users were found
      if (!shifts.length) {
        enqueueSnackbar('No valid shifts were found for this Event. Please try a different Event.', {
          variant: 'info',
          autoHideDuration: 3000,
        });
        return;
      }

      // read template file
      const templateFile = await fetch(`${process.env.PUBLIC_URL}/report-templates/event-billing.xlsx`);
      const templateFileBuffer = await templateFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateFileBuffer);

      // Pay and Leave Worksheet
      const payAndLeaveWorksheet = workbook.worksheets[0];
      modifyReportHeader(event, payAndLeaveWorksheet, user);
      generatePayAndLeaveWorksheet(shifts, payAndLeaveWorksheet, user, miniDateFormat, timeFormat);

      // reports that were skipped due to empty shift groupings
      const skippedReports: string[] = [];

      // Contract Law Worksheet
      const contractLawWorksheet = workbook.worksheets[1];
      modifyReportHeader(event, contractLawWorksheet, user);
      if (Object.keys(shiftsByRank).length > 0) {
        generateContractLawWorksheet(shiftsByRank, contractLawWorksheet, user, miniDateFormat, timeFormat);
      } else {
        skippedReports.push('Contract Law');
      }

      // Contract Law Worksheet (TODO: figure out which property to group shifts by)
      const contractLawVehicleWorksheet = workbook.worksheets[2];
      modifyReportHeader(event, contractLawVehicleWorksheet, user);
      if (Object.keys(shiftsByVehicle).length > 0) {
        generateContractLawVehicleWorksheet(shiftsByVehicle, contractLawVehicleWorksheet);
      } else {
        skippedReports.push('Contract Law Vehicle');
      }

      // Show warning if reports were skipped
      if (skippedReports.length) {
        enqueueSnackbar(`No valid shifts were found for the following reports: ${skippedReports.join(',')}`, {
          variant: 'info',
          autoHideDuration: 6000,
        });
      }

      const downloadBuffer = await workbook.xlsx.writeBuffer();
      download(downloadBuffer);
    } catch (error) {
      enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    }
  }

  return {
    downloadReport
  };
};
