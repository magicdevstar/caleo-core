import orderBy from 'lodash/orderBy';
// @mui
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
// hooks
import { useBoolean } from "src/hooks/use-boolean";
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
  const menuOpen = useBoolean<IncidentForm>();
  const activityDialogOpen = useBoolean<IncidentForm>();

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
          docusignStatusLabel(incident.docusignEvent?.status || ''),
        getLabelColor: (incident: IncidentForm) =>
          docusignStatusColor(incident.docusignEvent?.status || ''),
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
            <Button
              disabled
              // disabled={incident.docusignEvent?.status !== 'completed'}
              size="small"
              startIcon={<Iconify icon="ic:baseline-arrow-circle-down" />}
              onClick={(e: any) => {
                e.stopPropagation();
              }}
              sx={{ flex: '0 0 auto' }}
              variant="outlined"
            >Download Document (COMING SOON)</Button>
            <Button
              disabled
              size="small"
              startIcon={<Iconify icon="ic:baseline-view-timeline" />}
              onClick={(e: any) => {
                e.stopPropagation();
                activityDialogOpen.onTrue(incident);
              }}
              sx={{ flex: '0 0 auto' }}
              variant="outlined"
            >View Activity (COMING SOON)</Button>
          </Stack>
        ),
      },
    ],
    filters: []
  };

  return (
    <>
      <GQLTable config={config} />

      <ShiftActivityDialog
        opener={activityDialogOpen}
        userId={menuOpen.attribute?.userId}
        entityKey='incidentFormId'
        entityId={(menuOpen.attribute as any)?.id}
      />
    </>
  );
}
