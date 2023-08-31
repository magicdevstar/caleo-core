import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
// @apollo/client
import { useMutation } from '@apollo/client';
import { client } from 'src/utils/apollo';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Shift } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
import { ASSIGN_SHIFT, GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS } from 'src/api/shifts';
import { useAuthContext } from 'src/auth/hooks';


// ----------------------------------------------------------------------

export default function AvailableOvertimeTable() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const { enqueueSnackbar } = useSnackbar();
  const [assignShift, { loading: assignLoading }] = useMutation(ASSIGN_SHIFT, {
    refetchQueries: [GET_AVAILABLE_SHIFTS, GET_ALL_SHIFTS],
  });

  const [editShift, setEditShift] = useState<Shift | null>(null);
  const assignConfirm = useBoolean();

  const config: TableConfig<Shift> = {
    header: {
      title: 'Available Overtime',
    },
    search: {
      query: GET_AVAILABLE_SHIFTS,
      defaultTableConfig: {
        defaultOrderBy: 'startTime',
        defaultOrder: 'asc',
      },
      processResult: (data: any) => {
        const { availableShifts: { items, total } } = data || { availableShifts: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    rowActions: [
      {
        getName: () => 'Sign Up',
        getIcon: () => 'mdi:clipboard-check',
        onClick: (row: Shift) => {
          setEditShift(row);
          assignConfirm.onTrue();
        },
      },
    ],
    columns: [
      {
        id: 'event.name',
        label: 'Event Name',
        columnType: 'string',
        noSort: true,
      },
      {
        id: 'assignment.name',
        label: 'Assignment Name',
        columnType: 'string',
        noSort: true,
      },
      {
        id: 'startTime',
        label: 'Start Time',
        columnType: 'date',
        width: 110,
        noSort: true,
      },
      {
        id: 'endTime',
        label: 'End Time',
        columnType: 'date',
        width: 110,
        noSort: true,
      },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: []
  };

  const closeAssign = useCallback(
    () => {
      setEditShift(null);
      assignConfirm.onFalse();
    },
    [assignConfirm, setEditShift]
  );

  const handleAssign = useCallback(
    async () => {
      try {
        await assignShift({
          variables: {
            id: editShift?.id,
            userId,
          }
        });
        closeAssign();
      } catch(error) {
        if (/This shift if no longer available for this user/.test(error.message)) {
          enqueueSnackbar('This shift is no longer available. Please try selecting another shift.', { variant: 'error' });
          closeAssign();
          await client.refetchQueries({
            include: [GET_AVAILABLE_SHIFTS]
          });
        } else {
          enqueueSnackbar('Something went wrong assigning this shift. Pleas try again.', { variant: 'error' });
        }
      }
    },
    [editShift, userId, assignShift, closeAssign, enqueueSnackbar]
  );

  return (
    <>
      <GQLTable config={config} />

      <ConfirmDialog
        open={assignConfirm.value}
        onClose={closeAssign}
        title="Sign Up for Overtime"
        content="Are you sure you want to sign up for this overtime?"
        action={
          <LoadingButton
            loading={assignLoading}
            variant="contained"
            color="primary"
            onClick={handleAssign}
          >
            Sign up for overtime
          </LoadingButton>
        }
      />
    </>
  )
};


