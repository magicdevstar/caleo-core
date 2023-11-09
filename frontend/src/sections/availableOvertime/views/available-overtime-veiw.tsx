import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
// utils
import { client } from 'src/utils/apollo';
// components
import { useSettingsContext } from 'src/components/settings';
import { useAuthContext } from 'src/auth/hooks';
import { useTable } from 'src/components/table';
import { ASSIGN_SHIFT, CREATE_SHIFT_BUFFER, GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS } from 'src/api/shifts';
import { Shift } from 'src/__generated__/resolvers-types';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';
import ShiftItems from 'src/components/shifts/shift-items';
import { convertDate } from 'src/hooks/use-datejs';

// ----------------------------------------------------------------------

export default function AvailableOvertimeView() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const { enqueueSnackbar } = useSnackbar();
  const [assignShift, { loading: assignLoading }] = useMutation(ASSIGN_SHIFT, {
    refetchQueries: [GET_AVAILABLE_SHIFTS, GET_ALL_SHIFTS],
  });

  const [createShiftBuffer, { loading: createShiftBufferLoading }] = useMutation(CREATE_SHIFT_BUFFER, {
    refetchQueries: [GET_AVAILABLE_SHIFTS, GET_ALL_SHIFTS],
  });
  
  const [note, setNote] = useState<string>('');
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const assignConfirm = useBoolean();

  const canConfirm = useMemo(() => !editShift?.shiftBufferShift || (editShift?.shiftBufferShift && note.trim() !== ''), [editShift, note]);
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultOrder: 'asc',
  });
  const [filters, setFilters] = useState<any>({
    limit: table.rowsPerPage,
    skip: table.page * table.rowsPerPage,
    orderBy: table.orderBy,
    order: table.order,
  });
  const settings = useSettingsContext();

  const { data, loading } = useQuery(GET_AVAILABLE_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...filters
      },
    }
  });

  const { availableShifts: { items, total } } = data || { availableShifts: { items: [], total: 0 } };

  const shiftActions = [
    {
      key: 'signUp',
      onClick: (shift: Shift) => {
        setEditShift(shift);
        assignConfirm.onTrue();
      },
      getIcon: () => 'mdi:clipboard-check',
      getName: () => 'Sign Up',
    }
  ];

  const closeAssign = useCallback(
    () => {
      setNote('');
      setEditShift(null);
      assignConfirm.onFalse();
    },
    [assignConfirm, setEditShift, setNote]
  );

  const handleAssign = useCallback(
    async () => {
      try {
        if (editShift?.shiftBufferShift) {
          await createShiftBuffer({
            variables: {
              input: {
                shiftId: editShift.id,
                userId,
                note,
              },
            },
          });
        } else {
          await assignShift({
            variables: {
              id: editShift?.id,
              userId,
            }
          });
        }
        closeAssign();
      } catch(error) {
        if (/This shift if no longer available for this user/.test(error.message)) {
          enqueueSnackbar('This shift is no longer available. Please try selecting another shift.', { variant: 'error' });
          closeAssign();
          await client.refetchQueries({
            include: [GET_AVAILABLE_SHIFTS]
          });
        } else if (/This shift requires a shift buffer request/.test(error.message)) {
          enqueueSnackbar('This shift requires a buffer request. Please try again.', { variant: 'error' });
          closeAssign();
          await client.refetchQueries({
            include: [GET_AVAILABLE_SHIFTS]
          });
        } else {
          enqueueSnackbar('Something went wrong assigning this shift. Pleas try again.', { variant: 'error' });
        }
      }
    },
    [editShift, userId, note, assignShift, createShiftBuffer, closeAssign, enqueueSnackbar]
  );

  return (
    <Container sx={{
      height: '100%',
    }} maxWidth={settings.themeStretch ? false : 'lg'}>
      <Box sx={{mb: { xs: 3, md: 5 }}}>
        <Typography variant="h4" gutterBottom>
          Available Overtime
        </Typography>
      </Box>

      <ShiftItems
        emptyMessage='No Available Overtime'
        pageSize={table.rowsPerPage}
        total={total}
        setPage={(page: number) => {
          table.onChangePage(null, page - 1);
          setFilters((c: any) => ({
            ...c,
            skip: (page - 1) * table.rowsPerPage,
          }));
        }}
        currentPage={table.page + 1}
        shifts={items}
        shiftActions={shiftActions}
        loading={loading}
      />

      <ConfirmDialog
        open={assignConfirm.value}
        onClose={closeAssign}
        title="Sign Up for Overtime"
        content={
          editShift?.shiftBufferShift ? (<>
            <Typography variant='body1'>This shift overlaps with<br/><br/>Event: {editShift?.shiftBufferShift?.event?.name}<br/>Assignment: {editShift?.shiftBufferShift?.assignment?.name}<br/>Start Time: {editShift?.shiftBufferShift?.startTime ? dayjs(editShift?.shiftBufferShift?.startTime).format('MM/DD/YYYY hh:mm a') : 'N/A'}<br/>End Time: {editShift?.shiftBufferShift?.endTime ? dayjs(editShift?.shiftBufferShift?.endTime).format('MM/DD/YYYY hh:mm a') : 'N/A'}<br/><br/>You must submit a reason you are able to work this shift.</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason"
              type="text"
              autoFocus
              value={note}
              sx={{ mt: 2 }}
              onChange={(event) => {
                setNote(event.target.value);
              }}
            />
          </>) : (
            <Typography variant='body1'>
              Are you sure you want to sign up for <br /><strong>{editShift?.event?.name}</strong> - <strong>{editShift?.assignment?.name}</strong><br/><strong>{editShift?.startTime ? convertDate({ date: editShift?.startTime || 0, user }).format('ddd DD MMM YYYY HH:mm') : 'N/A'}?</strong>
            </Typography>
          )
        }
        action={
          <LoadingButton
            loading={assignLoading || createShiftBufferLoading}
            disabled={!canConfirm}
            variant="contained"
            color="primary"
            onClick={handleAssign}
          >
            Sign up for overtime
          </LoadingButton>
        }
      />
    </Container>
  );
}
