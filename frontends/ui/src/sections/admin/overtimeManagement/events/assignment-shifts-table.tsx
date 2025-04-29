import { useMemo, useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import orderBy from 'lodash/orderBy';
import { isAfter, isBefore } from 'date-fns';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { Assignment, Shift, ShiftStatus } from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import { GET_ALL_EVENTS, GET_EVENT } from 'src/api/event';
import { GET_ASSIGNMENT } from 'src/api/assignment';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { GET_ALL_SHIFTS, REMOVE_SHIFTS } from 'src/api/shifts';
import { TableConfig } from 'src/components/table/table-config';
import GQLTable from 'src/components/table/gql/table';

// ----------------------------------------------------------------------

const takenShifts = [ShiftStatus.Assigned, ShiftStatus.Removed, ShiftStatus.Relinquished];
const unassignAbleShifts = [ShiftStatus.Removed, ShiftStatus.Relinquished];

type Props = {
  eventId: string;
  currentAssignment?: Assignment;
  allDisabled: boolean;
  isComplete: boolean;
  isValid: boolean;
  upsertAssignmentLoading: boolean;
  createAssignmentWithValues: (values: any) => Promise<string | null>;
  getFormValues: () => any;
};

export default function AssignmentShiftsTable({
  eventId,
  currentAssignment,
  allDisabled,
  isComplete,
  isValid,
  upsertAssignmentLoading,
  createAssignmentWithValues,
  getFormValues,
}: Props) {
  const router = useRouter();
  const [removeShiftId, setRemoveShiftId] = useState<string | null>();
  const deleteConfirm = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  const [removeShifts, { loading: removeShiftLoading }] = useMutation(REMOVE_SHIFTS, {
    refetchQueries: [GET_ALL_EVENTS, {
      query: GET_EVENT,
      variables: {
        id: eventId,
      },
    }, {
      query: GET_ASSIGNMENT,
      variables: {
        id: currentAssignment?.id,
      },
    }],
  });

  const handleAddShift = async () => {
    let assignmentId: string | null | undefined = currentAssignment?.id;
    if (!assignmentId) {
      assignmentId = await createAssignmentWithValues(getFormValues());
      if (assignmentId) {
        enqueueSnackbar('Created Assignment!');
      }
    }

    if (assignmentId) {
      router.push(
        paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
        .replace(':eventId', eventId)
        .replace(':assignmentId', assignmentId)
        .replace(':shiftId', 'new')
      );
    }
  };

  const openRemoveShift = useCallback((shiftId: string) => {
    setRemoveShiftId(shiftId);
    deleteConfirm.onTrue();
  }, [deleteConfirm, setRemoveShiftId]);

  const handleRemoveShift = useCallback(async () => {
    await removeShifts({
      variables: {
        id: removeShiftId,
      },
    });
    setRemoveShiftId(null);
    deleteConfirm.onFalse();
  }, [removeShifts, setRemoveShiftId, removeShiftId, deleteConfirm]);

  const shiftMeta = useMemo(() =>
    Object.values((currentAssignment?.shifts || []).reduce((acc, shift) => {
      const { shiftId } = shift!;
      if (!acc[shiftId]) {
        acc[shiftId] = {
          shiftId,
          openShifts: 0,
          totalShifts: 0,
          startTime: shift!.startTime,
          endTime: shift!.endTime,
        };
      }
      acc[shiftId].totalShifts += unassignAbleShifts.includes(shift?.status || ShiftStatus.Assigned) ? 0 : 1;
      acc[shiftId].openShifts += (shift?.userId || takenShifts.includes(shift?.status || ShiftStatus.Assigned)) ? 0 : 1;

      if (isBefore(new Date(shift!.startTime), new Date(acc[shiftId].startTime))) {
        acc[shiftId].startTime = shift!.startTime;
      }
      if (isAfter(new Date(shift!.endTime), new Date(acc[shiftId].endTime))) {
        acc[shiftId].endTime = shift!.endTime;
      }

      return acc;
    }, {} as any)),
  [currentAssignment?.shifts]);

  const config: TableConfig<Shift> = {
    header: {
      title: 'Shifts',
      button: {
        text: 'Add Shift',
        icon: 'ic:baseline-add',
        loading: upsertAssignmentLoading,
        disabled: (!currentAssignment?.id && !isValid) || allDisabled || isComplete,
        onClick: handleAddShift
      }
    },
    table: {
      sx: {
        minWidth: 'inherit',
      }
    },
    search: {
      data: (shiftMeta || []) as any,
      query: GET_ALL_SHIFTS,
      processResult: (data: any, options) => ({
        total: data.length,
        items: orderBy<any>(data, [options?.orderBy], [options?.order || 'asc' as any]),
      }),
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Shift) => {
          router.push(
            paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
              .replace(':eventId', currentAssignment?.eventId || '')
              .replace(':assignmentId', currentAssignment?.id || '')
              .replace(':shiftId', row.shiftId || '')
          );
        },
      },
      {
        getName: () => 'Delete',
        getDisabled: () => allDisabled || isComplete,
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Shift) => {
          openRemoveShift(row.shiftId)
        },
      }
    ],
    columns: [
      {
        id: 'startTime',
        label: 'Start',
        columnType: 'date',
        width: '20%',
        getHref: (row: Shift) =>
          paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
            .replace(':eventId', currentAssignment?.eventId || '')
            .replace(':assignmentId', currentAssignment?.id || '')
            .replace(':shiftId', row.shiftId || ''),
      },
      {
        id: 'endTime',
        label: 'End',
        columnType: 'date',
        width: '20%',
        getHref: (row: Shift) =>
          paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
            .replace(':eventId', currentAssignment?.eventId || '')
            .replace(':assignmentId', currentAssignment?.id || '')
            .replace(':shiftId', row.shiftId || ''),
      },
      { id: 'totalShifts', width: '20%', label: 'Total Shifts', columnType: 'string' },
      { id: 'openShifts', width: '30%', label: 'Open Shifts', columnType: 'string' },
      { id: '', width: '10%', columnType: 'action', label: '' },
    ],
    filters: []
  };

  return (
    <>
      <GQLTable config={config} />
      
      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <LoadingButton loading={removeShiftLoading} variant="contained" color="error" onClick={handleRemoveShift}>
            Delete
          </LoadingButton>
        }
      />
    </>
  );
}