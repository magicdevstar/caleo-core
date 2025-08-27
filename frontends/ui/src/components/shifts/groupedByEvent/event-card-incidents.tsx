import { useCallback } from 'react';
import { PDFDocument } from "pdf-lib";
import { useSnackbar } from 'notistack';
import orderBy from 'lodash/orderBy';
// @mui
import Stack from "@mui/material/Stack";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
// hooks
import { useBoolean } from "src/hooks/use-boolean";
import { useDownloadPdf } from 'src/hooks/use-download-pdf';
// components
import GQLTable from "src/components/table/gql/table";
import Iconify from "src/components/iconify";
// types
import { IncidentForm } from "src/__generated__/resolvers-types";
import { TableConfig } from "src/components/table/table-config";
import { GET_INCIDENT_SUBMISSIONS } from 'src/api/incidentForm';
import { docusignStatusColor, docusignStatusLabel } from 'src/utils/docusign';
import { ShiftActivityDialog } from './shift-activitiy-dialog';

interface Props {
  incidents: IncidentForm[];
}

export function EventCardIncidents({ incidents }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const downloadLoading = useBoolean<IncidentForm>();
  const menuOpen = useBoolean<IncidentForm>();
  const activityDialogOpen = useBoolean<IncidentForm>();
  const { download } = useDownloadPdf({
    fileName: 'incident-submission',
  });

  const downloadDocuments = useCallback(async (incidentSubmission: IncidentForm) => {
    try {
      downloadLoading.onTrue(incidentSubmission);
      if (incidentSubmission?.docusignEvent?.documentUrls) {
        const pdfDoc = await PDFDocument.create();
        // eslint-disable-next-line no-restricted-syntax
        for (const url of incidentSubmission?.docusignEvent?.documentUrls || []) {
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
  
        download(pdfDocBuffer, `${incidentSubmission.event?.name || 'incident-submission'}`);
      }
    } catch(error) {
      enqueueSnackbar('Failed to download document', { variant: 'error' });
    } finally {
      downloadLoading.onFalse();
    }
  }, [downloadLoading, enqueueSnackbar, download]);

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
      }
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
          items: orderBy<any>(res.items, [options?.orderBy], [options?.order || 'asc' as any]),
        }
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
        width: '20%'
      },
      {
        id: 'operationalPeriod.date',
        label: 'Date',
        columnType: 'date',
        width: '60%',
      },
      {
        id: '',
        width: '20%',
        columnType: 'action',
        label: '',
        renderValue: (_v, _i, incident) => (
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
            <LoadingButton
              loading={downloadLoading.value && downloadLoading.attribute?.id === incident.id}
              disabled={!['completed', 'voided', 'declined'].includes(incident.docusignEvent?.status || '')}
              size="small"
              startIcon={<Iconify icon="ic:baseline-arrow-circle-down" />}
              onClick={(e: any) => {
                e.stopPropagation();
                downloadDocuments(incident);
              }}
              sx={{ flex: '0 0 auto' }}
              variant="outlined"
            >Download Document</LoadingButton>
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
    filters: []
  };

  return (
    <>
      <GQLTable config={config} />

      <Menu
        id={`shift-menu-${menuOpen.attribute?.id}`}
        anchorEl={menuOpen.value ? document.getElementById(`shift-actions-${menuOpen.attribute?.id}`) : null}
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
          disabled
          onClick={() => {
            menuOpen.onFalse();
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:pen-2-bold-duotone" />
          </ListItemIcon>
          <ListItemText>Modify Submission (COMING SOON)</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          menuOpen.onFalse();
          activityDialogOpen.onTrue(menuOpen.attribute)
        }}>
          <ListItemIcon>
            <Iconify icon="solar:history-bold" />
          </ListItemIcon>
          <ListItemText>View Activity</ListItemText>
        </MenuItem>
      </Menu>

      <ShiftActivityDialog
        opener={activityDialogOpen}
        userId={activityDialogOpen.attribute?.userId}
        entityKey='incidentFormId'
        entityId={(activityDialogOpen.attribute as any)?.id}
      />
    </>
  );
}
