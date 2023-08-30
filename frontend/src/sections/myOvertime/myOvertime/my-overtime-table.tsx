import { useState, useCallback, useMemo } from 'react';
import { isAfter, subHours } from 'date-fns';
// @mui
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
// @apollo/client
import { useMutation, useQuery } from '@apollo/client';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Shift } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
import { ASSIGN_SHIFT, GET_ALL_SHIFTS } from 'src/api/shifts';
import { useAuthContext } from 'src/auth/hooks';
import { ORGANIZATION } from 'src/api/organization';


// ----------------------------------------------------------------------

export default function MyOvertimeTable() {
  const { user } = useAuthContext();
  const [relinquishNote, setRelinquishNote] = useState<string | undefined>();
  const { data: organizationData } = useQuery(ORGANIZATION);
  const organization = organizationData?.organization;
  const [assignShift, { loading: relinquishLoading }] = useMutation(ASSIGN_SHIFT, {
    refetchQueries: [GET_ALL_SHIFTS],
  });

  const relinquishNoteRequired = organization?.settings?.userRelinquishShift?.enabled && organization?.settings?.userRelinquishShift?.requireNoteWhenRelinquishing;
  const relinquishSubmitEnabled = useMemo(() => {
    if (!relinquishNoteRequired) return true;
    const validNote = relinquishNote && relinquishNote.trim() !== '';
    return validNote;
  }, [relinquishNote, relinquishNoteRequired]);

  const [editShift, setEditShift] = useState<Shift | null>(null);
  const relinquishConfirm = useBoolean();

  const config: TableConfig<Shift> = {
    header: {
      title: 'My Overtime',
    },
    search: {
      query: GET_ALL_SHIFTS,
      defaultTableConfig: {
        defaultOrderBy: 'startTime',
        defaultOrder: 'asc',
      },
      processResult: (data: any) => {
        const { shifts: { items, total } } = data || { shifts: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    rowActions: [
      {
        getName: () => 'Relinquish',
        getDisabled: (row: Shift) => {
          if (!organization?.settings?.userRelinquishShift?.enabled) {
            return true;
          }
          const startDate = new Date(row.startTime);
          const numberOfHoursBeforeShift = organization?.settings?.userRelinquishShift?.numberOfHoursBeforeShift;
          const disableDate = subHours(startDate, numberOfHoursBeforeShift || 0);
          const now = new Date();
          return isAfter(now, disableDate);
        },
        getIcon: () => 'mdi:close-thick',
        onClick: (row: Shift) => {
          setEditShift(row);
          relinquishConfirm.onTrue();
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
    filters: [
      {
        id: 'startTime',
        type: 'hidden',
        label: 'Start Time',
        defaultValue: new Date().toISOString(),
        value: new Date().toISOString(),
      },
      {
        id: 'userId',
        type: 'hidden',
        label: 'User Id',
        defaultValue: user.id,
        value: user.id,
      },
    ]
  };

  const closeRelinquish = useCallback(
    () => {
      setEditShift(null);
      setRelinquishNote(undefined);
      relinquishConfirm.onFalse();
    },
    [relinquishConfirm, setRelinquishNote, setEditShift]
  );

  const handleRelinquish = useCallback(
    async () => {
      try {
        await assignShift({
          variables: {
            id: editShift?.id,
            note: relinquishNote,
          }
        });
        closeRelinquish();
      } catch(error) {
        console.error(error);
      }
    },
    [editShift, relinquishNote, assignShift, closeRelinquish]
  );

  return (
    <>
      <GQLTable config={config} />

      <ConfirmDialog
        open={relinquishConfirm.value}
        onClose={closeRelinquish}
        title="Relinquish Overtime"
        content={(
          <>
            <Typography variant="body2">Are you sure you want to relinquish this overtime?</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              sx={{ mt: 2 }}
              label="Explain why you would like to relinquish this overtime"
              value={relinquishNote}
              helperText={relinquishNoteRequired ? 'This field is required' : undefined}
              onChange={(e: any) => setRelinquishNote(e.target.value)}
            />
          </>
        )}
        action={
          <LoadingButton
            disabled={!relinquishSubmitEnabled}
            loading={relinquishLoading}
            variant="contained"
            color="error"
            onClick={handleRelinquish}
          >
            Relinquish Overtime
          </LoadingButton>
        }
      />
    </>
  )
};


