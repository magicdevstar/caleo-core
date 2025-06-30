import { useState, useCallback } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { client } from 'src/utils/apollo';
import ExcelJS from 'exceljs';
import { GET_EVENT_FOR_SUMMARY } from 'src/api/event';
import { useSnackbar } from 'notistack';
import { Assignment, Shift, Event } from 'src/__generated__/resolvers-types';
import { useDownloadExcel } from './use-download-excel';
import { convertDate, useDateFormats } from './use-datejs';

export const useLasdEventSummary = () => {
  const [loading, setLoading] = useState(false);
  const { dateFormat } = useDateFormats();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadExcel({ fileName: 'event-summary' });

  const generateLasdEventDownload = useCallback(
    async (eventId: string) => {
      try {
        setLoading(true);
        const { data: res } = await client.query({
          query: GET_EVENT_FOR_SUMMARY,
          variables: {
            id: eventId,
          },
        });
        const { event } = res as { event: Event };
        if (!event) {
          throw new Error('Event not found');
        }

        // get all shifts from event
        const shifts: Shift[] = (event.assignments || []).reduce(
          (a: any[], assignment: Assignment) => {
            (assignment.shifts || []).forEach((shift, index) => {
              if (!shift?.user) {
                // skip if shift is not filled/assigned
                return;
              }
              a.push({
                ...shift,
                slotNumber: index + 1,
                assignment,
                event,
              });
            });
            return a;
          },
          []
        );

        // sort shifts by custom id alphabetically, but with numbers in order (1a, 1b, 2, 3a, etc.)
        shifts.sort((shifta, shiftb) => {
          const customIDa = shifta.customId || '';
          const customIDb = shiftb.customId || '';
          return customIDa.localeCompare(customIDb, undefined, { numeric: true });
        });

        // return if no shifts with assigned users were found
        if (!shifts.length) {
          enqueueSnackbar('No assigned shifts were found for this Event.', {
            variant: 'info',
            autoHideDuration: 3000,
          });
          return;
        }

        // read template file
        const templateFile = await fetch(
          `${process.env.PUBLIC_URL}/report-templates/lasd-event-summary.xlsx`
        );
        const templateFileBuffer = await templateFile.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(templateFileBuffer);
        const worksheet = workbook.worksheets[0];

        // insert event details in header
        worksheet.getCell('C2').value = event.name || '';
        worksheet.getCell('C3').value = event.startTime
          ? convertDate({ date: event.startTime, user }).format(dateFormat)
          : '';

        // reset original columns widths since Exceljs does not preserve them upon importing
        const tableColumnWidthMap = [47, 135, 200, 200, 132, 113, 183, 216, 216, 105, 175];
        tableColumnWidthMap.forEach((width, i) => {
          worksheet.getColumn(i + 1).width = width / 7;
        });

        // remove image values and insert images
        worksheet.getCell('A1').value = null;
        worksheet.getCell('K1').value = null;
        worksheet.addImage(0, {
          tl: { col: 0.9, row: 0 },
          ext: { width: 132, height: 145 },
        });
        worksheet.addImage(0, {
          tl: { col: 10.9, row: 0 },
          ext: { width: 132, height: 145 },
        });

        // remove original table and recreate it since Exceljs does not preserve table data upon importing
        const originalTable = worksheet.getTable('Table1');
        const tableProps = (originalTable as any).table;
        const tableConfig: ExcelJS.TableProperties = {
          name: 'ShiftsTable',
          ref: tableProps.tableRef.split(':')[0],
          headerRow: true,
          totalsRow: false,
          style: {
            ...tableProps.style,
          },
          columns: tableProps.columns.map((col: any, i: number) => ({
            name: col.name,
            filterButton: true,
          })),
          rows: [],
        };
        worksheet.removeTable('Table1');
        const table = worksheet.addTable(tableConfig);

        // add shift data to table
        shifts.forEach((shift) => {
          table.addRow([
            // id
            shift.customId || '',
            // call sign
            shift.callSign || shift.assignment?.callSign || '',
            // Assignment Name
            shift.assignment?.name || '',
            // Assignment Location
            shift.assignment?.reportingLocation || shift?.event?.venue?.city || '',
            // Assignment Supervisor
            shift.assignment?.supervisorAssignment?.shifts?.[0]?.user?.name || shift.event?.supervisor?.name || '',
            // Start Time
            shift.startTime
              ? convertDate({ date: shift.startTime, user }).format('MM/DD - HH:mm')
              : '',
            // Rank
            shift.user?.member?.rank?.name || '',
            // First Name
            shift.user?.firstName || '',
            // Last Name
            shift.user?.lastName || '',
            // Employee
            shift.user?.member?.pNumber || '',
            // Phone Number
            shift.user?.member?.contactInfo?.primaryPhone?.number || '',
          ]);
        });

        // commit changes for all added rows
        table.commit();

        const downloadBuffer = await workbook.xlsx.writeBuffer();
        download(downloadBuffer);
      } catch (error) {
        enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar, user, download, dateFormat]
  );

  return {
    generateLasdEventDownload,
    loading,
  };
};
