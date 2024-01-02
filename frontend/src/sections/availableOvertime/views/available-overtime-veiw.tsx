import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useSnackbar } from 'notistack';
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
import { MemberRole, Shift } from 'src/__generated__/resolvers-types';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';
import ShiftItems from 'src/components/shifts/shift-items';
import { convertDate, dateTimeFormat } from 'src/hooks/use-datejs';
import { useWeeklyShifts } from 'src/hooks/use-weekly-shift-count';

// ----------------------------------------------------------------------

export default function AvailableOvertimeView() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const { enqueueSnackbar } = useSnackbar();
  const [assignShift, { loading: assignLoading }] = useMutation(ASSIGN_SHIFT);
  const [createShiftBuffer, { loading: createShiftBufferLoading }] = useMutation(CREATE_SHIFT_BUFFER);

  const [note, setNote] = useState<string>('');
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const assignConfirm = useBoolean();

  const isAdmin = useMemo(() => user?.member?.role === MemberRole.Admin, [user]);

  const canConfirm = useMemo(() => !editShift?.shiftBufferShift || (editShift?.shiftBufferShift && note.trim() !== ''), [editShift, note]);
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultRowsPerPage: 10000,
    defaultOrder: 'asc',
  });
  const [filters, setFilters] = useState<any>({
    limit: table.rowsPerPage,
    skip: table.page * table.rowsPerPage,
    orderBy: table.orderBy,
    order: table.order,
  });
  const settings = useSettingsContext();

  const { weeklyShifts, loading: loadingWeeklyShifts, error: weeklyShiftsError } = useWeeklyShifts({
    userId,
    date: editShift?.startTime,
    skip: !isAdmin,
  });

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
      disabled: (shift: Shift) => false,
      color: 'info',
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
                shiftBufferShiftId: editShift.shiftBufferShift.id,
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

        client.refetchQueries({
          include: [GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS]
        });

        enqueueSnackbar(`You successfully signed up for ${editShift?.event?.name} - ${editShift?.assignment?.name}.`, { variant: 'success' });
        closeAssign();
      } catch(error) {
        if (/This shift has an overlapping time/.test(error.message)) {
          enqueueSnackbar('This shift overlaps with another shift. Please try selecting another shift.', { variant: 'error', autoHideDuration: 5000 });
          closeAssign();
          await client.refetchQueries({
            include: [GET_AVAILABLE_SHIFTS]
          });
        } else if (/This shift requires a shift buffer request/.test(error.message)) {
          enqueueSnackbar('This shift requires a buffer request. Please try again.', { variant: 'error', autoHideDuration: 5000 });
          closeAssign();
          await client.refetchQueries({
            include: [GET_AVAILABLE_SHIFTS]
          });
        } else if (/The user has reached their maximum shifts for that week/.test(error.message)) {
          enqueueSnackbar('You have reached your maximum number of shifts for that week.', { variant: 'error', autoHideDuration: 5000 });
          closeAssign();
          await client.refetchQueries({
            include: [GET_AVAILABLE_SHIFTS]
          });
        } else if (/Shift already assigned/.test(error.message)) {
          enqueueSnackbar('This shift is no longer available. Please try selecting another shift.', { variant: 'error', autoHideDuration: 5000 });
          closeAssign();
          await client.refetchQueries({
            include: [GET_AVAILABLE_SHIFTS]
          });
        } else {
          enqueueSnackbar('Something went wrong assigning this shift. Please try again.', { variant: 'error' });
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
        emptyMessage='No Overtime Shifts Available - Check Back Later'
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
          <>
            {editShift?.shiftBufferShift ? (<>
              <Typography variant='body1'>
                This shift overlaps with<br/><br/>
                Event: {editShift?.shiftBufferShift?.event?.name}<br/>
                Assignment: {editShift?.shiftBufferShift?.assignment?.name}<br/>
                Start Time: {editShift?.shiftBufferShift?.startTime ? convertDate({ date: editShift?.shiftBufferShift?.startTime, user }).format('MM/DD/YYYY HH:mm') : 'N/A'}<br/>
                End Time: {editShift?.shiftBufferShift?.endTime ? convertDate({ date: editShift?.shiftBufferShift?.endTime, user }).format('MM/DD/YYYY HH:mm') : 'N/A'}<br/><br/>
                You must submit a reason you are able to work this shift.
              </Typography>
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
                Are you sure you want to sign up for <br /><strong>{editShift?.event?.name}</strong> - <strong>{editShift?.assignment?.name}</strong><br/><strong>{editShift?.startTime ? convertDate({ date: editShift?.startTime || new Date().toISOString(), user }).format(dateTimeFormat) : 'N/A'}?</strong>
              </Typography>
            )}
            {
              isAdmin &&
              ((weeklyShifts?.length || 0) >= (user?.member?.maxShifts || user?.member?.org?.settings?.shiftsPerWeek || Number.POSITIVE_INFINITY)) &&
              !weeklyShiftsError &&
              !loadingWeeklyShifts && (
                <Typography variant='body2' color="warning.main" sx={{ mt: 2 }}>
                  Warning: You have reached your max shift limit for this shift week.
                </Typography>
              )
            }
            {weeklyShiftsError && !loadingWeeklyShifts && (
              <Typography variant='body2' color="error.main" sx={{ mt: 2 }}>
                Error retrieving weekly shift count. Shift count for this shift week is unknown. Proceed with Caution.
              </Typography>
            )}
          </>
        }
        action={
          <LoadingButton
            loading={assignLoading || createShiftBufferLoading || loadingWeeklyShifts}
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
