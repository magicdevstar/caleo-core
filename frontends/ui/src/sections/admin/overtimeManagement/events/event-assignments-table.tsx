import { useMemo, useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import orderBy from 'lodash/orderBy';
import { useRouter } from 'src/routes/hooks';
import { isAfter, isBefore } from 'date-fns';
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSnackbar } from 'src/components/snackbar';
import {
  Assignment,
  Event,
} from 'src/__generated__/resolvers-types';
import { GET_ALL_EVENTS, GET_EVENT } from 'src/api/event';
import { GET_ALL_ASSIGNMENT, REMOVE_ASSIGNMENT } from 'src/api/assignment';
import GQLTable from 'src/components/table/gql/table';
import { TableConfig } from 'src/components/table/table-config';
import PopulateShiftSlots from 'src/components/shifts/populate-shift-slots';

type EventAssignmentsTableProps = {
  currentEvent?: Event;
  eventTemplateView?: boolean;
  basePath: any;
  allDisabled: boolean;
  isComplete: boolean;
  isValid: boolean;
  onSaveEvent: (shouldReroute: boolean) => Promise<string>;
  upsertEventLoading?: boolean;
};

const requiresShiftSlotUpdate = (eventTemplateView: boolean, assignment: Assignment) =>
  eventTemplateView && (assignment?.shiftSlots?.length || 0) > 0;

export default function EventAssignmentsTable({
  currentEvent,
  eventTemplateView,
  basePath,
  allDisabled,
  isComplete,
  isValid,
  onSaveEvent,
  upsertEventLoading,
}: EventAssignmentsTableProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useBoolean();
  const shiftSlotsDialog = useBoolean();
  
  const [removeAssignment, { loading: removeAssignmentLoading }] = useMutation(REMOVE_ASSIGNMENT, {
    refetchQueries: [GET_ALL_EVENTS, {
      query: GET_EVENT,
      variables: {
        id: currentEvent?.id,
      },
    }],
  });
  
  const [removeAssignmentId, setRemoveAssignmentId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const openRemoveAssignment = useCallback((assignmentId: string) => {
    setRemoveAssignmentId(assignmentId);
    deleteConfirm.onTrue();
  }, [deleteConfirm, setRemoveAssignmentId]);
  
  const handleRemoveAssignment = useCallback(async () => {
    await removeAssignment({
      variables: {
        id: removeAssignmentId,
      },
    });
    setRemoveAssignmentId(null);
    deleteConfirm.onFalse();
  }, [removeAssignment, setRemoveAssignmentId, removeAssignmentId, deleteConfirm]);

  const handleOpenShiftSlotsDialog = useCallback((assignment: Assignment) => {
    setSelectedAssignment(assignment);
    shiftSlotsDialog.onTrue();
  }, [shiftSlotsDialog]);

  const handleCloseShiftSlotsDialog = useCallback(() => {
    shiftSlotsDialog.onFalse();
    setSelectedAssignment(null);
  }, [shiftSlotsDialog]);

  const handleShiftSlotsSuccess = useCallback(() => {
    // Refetch event data to update UI
    // This is already handled by the mutation in the PopulateShiftSlots component
  }, []);

  const config: TableConfig<Assignment> = useMemo(() => ({
    header: {
      title: 'Assignments',
      button: {
        text: 'Add Assignment',
        icon: 'ic:baseline-add',
        loading: upsertEventLoading,
        disabled: (!currentEvent?.id && !isValid) || allDisabled || isComplete,
        onClick: async () => {
          let eventId = currentEvent?.id;
          if (!eventId) {
            eventId = await onSaveEvent(false);
            if (eventId) {
              enqueueSnackbar('Created Event!');
            }
          }
          if (eventId) {
            router.push(
              basePath.eventAssignmentDetail
              .replace(':eventId', eventId!)
              .replace(':assignmentId', 'new')
            );
          }
        }
      }
    },
    table: {
      sx: {
        minWidth: 'inherit',
      }
    },
    search: {
      data: (currentEvent?.assignments || []) as any,
      query: GET_ALL_ASSIGNMENT,
      processResult: (data: any, options) => {
        const res = {
          total: data.length,
          items: data.map((assignment: Assignment) => {
            const { shifts, ...rest } = assignment;
            const startTime = (shifts || []).filter(Boolean).reduce((curr: Date | null, shift) => {
              const start = new Date(shift!.startTime);
              if (!curr || isBefore(start, curr)) {
                return start;
              }
              return curr;
            }, null);
            const endTime = (shifts || []).filter(Boolean).reduce((curr: Date | null, shift) => {
              const end = new Date(shift!.endTime);
              if (!curr || isAfter(end, curr)) {
                return end;
              }
              return curr;
            }, null);
            return {
              ...rest,
              startTime,
              endTime,
              shifts,
            };
          }),
        };

        return {
          ...res,
          items: orderBy<any>(res.items, [options?.orderBy], [options?.order || 'asc' as any]),
        }
      },
    },
    rowActions: [
      {
        getName: () => 'Populate Shift Dates',
        getIcon: () => 'mdi:calendar-edit',
        getHidden: (row: Assignment) => !requiresShiftSlotUpdate(!eventTemplateView, row),
        onClick: (row: Assignment) => {
          handleOpenShiftSlotsDialog(row);
        },
      },
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        getDisabled: (row: Assignment) => requiresShiftSlotUpdate(!eventTemplateView, row),
        onClick: (row: Assignment) => {
          router.push(
            basePath.eventAssignmentDetail
              .replace(':eventId', currentEvent?.id || '')
              .replace(':assignmentId', row.id)
          );
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        getDisabled: (row: Assignment) => requiresShiftSlotUpdate(!eventTemplateView, row) || allDisabled || isComplete,
        onClick: (row: Assignment) => {
          openRemoveAssignment(row.id)
        },
      }
    ],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        width: '20%',
        renderValue: (value: string, index: number, row: Assignment) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {requiresShiftSlotUpdate(!eventTemplateView, row) && (
              <Tooltip title="This assignment needs dates added to shifts">
                <Iconify sx={{ color: 'orange', mb: 0.25 }} icon="ic:round-warning" />
              </Tooltip>
            )}
            <Typography variant="body1">{value}</Typography>
          </Box>
        ),
        onClick: (row: Assignment) => {
          if (requiresShiftSlotUpdate(!eventTemplateView, row)) {
            handleOpenShiftSlotsDialog(row);
          }
        },
        getHref: (row: Assignment) =>
          requiresShiftSlotUpdate(!eventTemplateView, row) ?
            '#' :
            basePath.eventAssignmentDetail
              .replace(':eventId', currentEvent?.id || '')
              .replace(':assignmentId', row.id),
      },
      {
        id: 'ranks',
        label: 'Ranks',
        emptyArrayLabel: 'None',
        width: '15%',
        noSort: true,
        columnType: 'array',
        maxRender: 1
      },
      {
        id: 'requiredSkills',
        label: 'Skills',
        width: '10%',
        noSort: true,
        columnType: 'array',
        maxRender: 1
      },
      {
        id: 'bwNeeded',
        label: 'B&W',
        width: '7.5%',
        columnType: 'boolean',
      },
      ...(!eventTemplateView ? [
        {
          id: 'startTime',
          label: 'Start',
          columnType: 'date',
          width: '10%',
        },
        {
          id: 'endTime',
          label: 'End',
          columnType: 'date',
          width: '10%',
        },
      ] : [] as any),
      {
        id: 'totalShifts',
        width: '10%',
        label: 'Total Shifts',
        columnType: 'string',
        renderValue: (value: string, index: number, row: Assignment) => {
          if (eventTemplateView) {
            return (row?.shiftSlots || []).reduce((acc: number, curr) => acc + (curr?.slotCount || 0), 0);
          }
          return value;
        },
      },
      ...(!eventTemplateView ? [
        {
          id: 'availableShifts',
          width: '10%',
          label: 'Open Shifts',
          columnType: 'string',
        },
      ] : [] as any),
      { id: '', width: '5%', columnType: 'action', label: '' },
    ],
    filters: []
  }), [
    onSaveEvent,
    openRemoveAssignment,
    handleOpenShiftSlotsDialog,
    enqueueSnackbar,
    currentEvent?.assignments,
    currentEvent?.id,
    isValid,
    router,
    upsertEventLoading,
    allDisabled,
    isComplete,
    eventTemplateView,
    basePath,
  ]);

  return (
    <>
      <GQLTable config={config} />
      
      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <LoadingButton loading={removeAssignmentLoading} variant="contained" color="error" onClick={handleRemoveAssignment}>
            Delete
          </LoadingButton>
        }
      />

      {selectedAssignment && (
        <PopulateShiftSlots
          open={shiftSlotsDialog.value}
          onClose={handleCloseShiftSlotsDialog}
          eventId={currentEvent?.id || ''}
          assignmentId={selectedAssignment.id}
          shiftSlots={(selectedAssignment.shiftSlots || []) as any[]}
          onSuccess={handleShiftSlotsSuccess}
        />
      )}
    </>
  );
}