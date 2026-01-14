import { useCallback } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { useSnackbar } from 'notistack';
import orderBy from 'lodash/orderBy';
// @mui
import Stack from '@mui/material/Stack';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { useBoolean } from 'src/hooks/use-boolean';
import { useDownloadPdf } from 'src/hooks/use-download-pdf';
import { useRouter } from 'src/routes/hooks';
// components
import GQLTable from 'src/components/table/gql/table';
import Iconify from 'src/components/iconify';
// types
import { paths } from 'src/routes/paths';
import { IncidentForm } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
import { GET_INCIDENT_SUBMISSIONS } from 'src/api/incidentForm';
import { docusignStatusColor, docusignStatusLabel, DocusignStatus } from 'src/utils/docusign';
import { ShiftActivityDialog } from './shift-activitiy-dialog';
import { VoidSubmissionDialog } from './void-submission-dialog';

interface Props {
  incidents: IncidentForm[];
}

export function EventCardIncidents({ incidents }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const { user } = useAuthContext();
  const { dateFormat, timeFormat } = useDateFormats();
  const downloadLoading = useBoolean<IncidentForm>();
  const menuOpen = useBoolean<IncidentForm>();
  const activityDialogOpen = useBoolean<IncidentForm>();
  const voidDialogOpen = useBoolean<IncidentForm>();
  const { download } = useDownloadPdf({
    fileName: 'incident-submission',
  });

  const downloadDocuments = useCallback(
    async (incidentSubmission: IncidentForm) => {
      try {
        downloadLoading.onTrue(incidentSubmission);
        if (incidentSubmission?.docusignEvent?.documentUrls) {
          const pdfDoc = await PDFDocument.create();
          // eslint-disable-next-line no-restricted-syntax
          for (const url of incidentSubmission?.docusignEvent?.documentUrls || []) {
            // download overtime slip
            const slipPdfBytes = await fetch(url as string).then((response) =>
              response.arrayBuffer()
            );
            // load/convert the slip into a PDFDocument object
            const slipPdfDoc = await PDFDocument.load(slipPdfBytes);
            // iterate over slip's pages
            const slipPages = await pdfDoc.copyPages(slipPdfDoc, slipPdfDoc.getPageIndices());
            // add pages to main pdf
            slipPages.forEach((page) => pdfDoc.addPage(page));
          }

          // Add watermark if status is voided or declined
          const status = incidentSubmission?.docusignEvent?.status?.toUpperCase();
          const shouldWatermark = status === 'VOIDED' || status === 'DECLINED';

          if (shouldWatermark) {
            const watermarkText = status === 'VOIDED' ? 'VOID' : 'DECLINED';
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pages = pdfDoc.getPages();
            pages.forEach((page) => {
              const { width, height } = page.getSize();
              const fontSize = Math.min(width, height) * 0.15;
              const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

              // For rotated text, pdf-lib rotates around the x,y coordinate (baseline start)
              // To center, we need to offset by half the text width considering rotation
              // At 45 degrees, we shift back by half the text width in the rotated coordinate system
              const angle = Math.PI / 4; // 45 degrees in radians
              const offsetX = (textWidth / 2) * Math.cos(angle);
              const offsetY = (textWidth / 2) * Math.sin(angle);

              page.drawText(watermarkText, {
                x: width / 2 - offsetX,
                y: height / 2 - offsetY,
                size: fontSize,
                font,
                color: rgb(1, 0, 0),
                opacity: 0.35,
                rotate: degrees(45),
              });
            });
          }

          // convert pdf into file buffer
          const pdfDocBuffer = await pdfDoc.save();

          download(pdfDocBuffer, `${incidentSubmission.event?.name || 'incident-submission'}`);
        }
      } catch (error) {
        enqueueSnackbar('Failed to download document', { variant: 'error' });
      } finally {
        downloadLoading.onFalse();
      }
    },
    [downloadLoading, enqueueSnackbar, download]
  );

  const getStartTime = useCallback(
    (incident: IncidentForm): string => {
      const rdo = incident.timekeeping?.rdo;
      const isRdo = rdo?.toLowerCase() === 'yes';

      // If RDO is 'yes', only use overtimeTimeIn
      const timeIn = !isRdo ? incident.timekeeping?.timeIn : null;
      const overtimeTimeIn = incident.timekeeping?.overtimeTimeIn;

      if (!timeIn && !overtimeTimeIn) return '-';
      if (!timeIn) return convertDate({ date: overtimeTimeIn!, user }).format(timeFormat);
      if (!overtimeTimeIn) return convertDate({ date: timeIn, user }).format(timeFormat);

      // Compare dates using dayjs with timezone awareness
      const timeInDayjs = convertDate({ date: timeIn, user });
      const overtimeTimeInDayjs = convertDate({ date: overtimeTimeIn, user });
      const earliestTime = timeInDayjs.isBefore(overtimeTimeInDayjs) ? timeIn : overtimeTimeIn;

      return convertDate({ date: earliestTime, user }).format(timeFormat);
    },
    [user, timeFormat]
  );

  const getEndTime = useCallback(
    (incident: IncidentForm): string => {
      const rdo = incident.timekeeping?.rdo;
      const isRdo = rdo?.toLowerCase() === 'yes';

      // If RDO is 'yes', only use overtimeTimeOut
      const timeOut = !isRdo ? incident.timekeeping?.timeOut : null;
      const overtimeTimeOut = incident.timekeeping?.overtimeTimeOut;

      if (!timeOut && !overtimeTimeOut) return '-';
      if (!timeOut) return convertDate({ date: overtimeTimeOut!, user }).format(timeFormat);
      if (!overtimeTimeOut) return convertDate({ date: timeOut, user }).format(timeFormat);

      // Compare dates using dayjs with timezone awareness
      const timeOutDayjs = convertDate({ date: timeOut, user });
      const overtimeTimeOutDayjs = convertDate({ date: overtimeTimeOut, user });
      const latestTime = timeOutDayjs.isAfter(overtimeTimeOutDayjs) ? timeOut : overtimeTimeOut;

      return convertDate({ date: latestTime, user }).format(timeFormat);
    },
    [user, timeFormat]
  );

  const config: TableConfig<IncidentForm> = {
    header: {
      title: 'Submissions',
      titleVariant: 'body1',
      buttons: [],
    },
    table: {
      denseHeight: 1,
      sx: {
        minWidth: 'inherit',
      },
    },
    search: {
      data: incidents || [],
      query: GET_INCIDENT_SUBMISSIONS,
      processResult: (data: any, options) => {
        const res = {
          total: data.length,
          items: incidents || [],
        };

        return {
          ...res,
          items: orderBy<any>(res.items, [options?.orderBy], [options?.order || ('asc' as any)]),
        };
      },
    },
    rowActions: [],
    columns: [
      {
        id: 'status',
        label: 'Status',
        columnType: 'string',
        renderValue: (_v: any, _i: any, incident: IncidentForm) =>
          docusignStatusLabel(incident.docusignEvent?.status || '') || '-',
        getLabelColor: (incident: IncidentForm) =>
          docusignStatusColor(incident.docusignEvent?.status || '') || 'default',
        width: '15%',
      },
      {
        id: 'operationalPeriod.date',
        label: 'Operational Date',
        columnType: 'string',
        renderValue: (_v: any, _i: any, incident: IncidentForm) =>
          incident.operationalPeriod?.date
            ? convertDate({ date: incident.operationalPeriod.date, user }).format(dateFormat)
            : '-',
        width: '25%',
      },
      {
        id: 'startTime',
        label: 'Start Time',
        columnType: 'string',
        noSort: true,
        renderValue: (_v: any, _i: any, incident: IncidentForm) => getStartTime(incident),
        width: '15%',
      },
      {
        id: 'endTime',
        label: 'End Time',
        columnType: 'string',
        noSort: true,
        renderValue: (_v: any, _i: any, incident: IncidentForm) => getEndTime(incident),
        width: '15%',
      },
      {
        id: '',
        width: '30%',
        columnType: 'action',
        label: '',
        renderValue: (_v, _i, incident) => (
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
            <LoadingButton
              loading={downloadLoading.value && downloadLoading.attribute?.id === incident.id}
              disabled={
                !['completed', 'voided', 'declined'].includes(incident.docusignEvent?.status || '')
              }
              size="small"
              startIcon={<Iconify icon="ic:baseline-arrow-circle-down" />}
              onClick={(e: any) => {
                e.stopPropagation();
                downloadDocuments(incident);
              }}
              sx={{ flex: '0 0 auto' }}
              variant="outlined"
            >
              Download Document
            </LoadingButton>
            <IconButton
              size="small"
              id={`shift-actions-${incident.id}`}
              aria-controls={menuOpen.value ? `shift-menu-${incident.id}` : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen.value ? 'true' : undefined}
              onClick={(e: any) => {
                e.stopPropagation();
                menuOpen.onTrue(incident);
              }}
              sx={{ flex: '0 0 auto' }}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    filters: [],
  };

  return (
    <>
      <GQLTable config={config} />

      <Menu
        id={`shift-menu-${menuOpen.attribute?.id}`}
        anchorEl={
          menuOpen.value ? document.getElementById(`shift-actions-${menuOpen.attribute?.id}`) : null
        }
        open={menuOpen.value}
        onClose={menuOpen.onFalse}
        MenuListProps={{
          'aria-labelledby': `shift-actions-${menuOpen.attribute?.id}`,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            router.push(
              `${paths.dashboard.incidents.form.replace(':id', menuOpen.attribute?.event?.id || '')}?submissionId=${menuOpen.attribute?.id}`
            );
            menuOpen.onFalse();
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:pen-2-bold-duotone" />
          </ListItemIcon>
          <ListItemText>Modify Submission</ListItemText>
        </MenuItem>

        <MenuItem
          disabled={
            !menuOpen.attribute?.docusignEvent?.status ||
            ![DocusignStatus.SENT, DocusignStatus.COMPLETED].includes(
              menuOpen.attribute.docusignEvent.status.toUpperCase() as DocusignStatus
            )
          }
          onClick={() => {
            menuOpen.onFalse();
            voidDialogOpen.onTrue(menuOpen.attribute);
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:close-circle-bold-duotone" />
          </ListItemIcon>
          <ListItemText>Void Submission</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            menuOpen.onFalse();
            activityDialogOpen.onTrue(menuOpen.attribute);
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:history-bold" />
          </ListItemIcon>
          <ListItemText>View Activity</ListItemText>
        </MenuItem>
      </Menu>

      <ShiftActivityDialog
        opener={activityDialogOpen}
        userId={activityDialogOpen.attribute?.userId}
        entityKey="incidentFormId"
        entityId={(activityDialogOpen.attribute as any)?.id}
      />

      <VoidSubmissionDialog opener={voidDialogOpen} />
    </>
  );
}
