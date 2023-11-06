import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { isAfter, subHours } from 'date-fns';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
// components
import { useSettingsContext } from 'src/components/settings';
// types
import { ASSIGN_SHIFT, GET_ALL_SHIFTS } from 'src/api/shifts';
import { useTable } from 'src/components/table';
import { useAuthContext } from 'src/auth/hooks';
// local imports
import ShiftItems from 'src/components/shifts/shift-items';
import { Shift } from 'src/__generated__/resolvers-types';
import { ORGANIZATION } from 'src/api/organization';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export default function MyOvertimeView() {
  const { user } = useAuthContext();
  const [currentTab, setCurrentTab] = useState('upcoming');
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultOrder: 'asc',
  });
  const [filters, setFilters] = useState<any>({
    limit: table.rowsPerPage,
    skip: table.page * table.rowsPerPage,
    orderBy: table.orderBy,
    order: table.order,
    userId: user?.id,
    startTime: new Date().toISOString(),
  });
  const settings = useSettingsContext();

  const [relinquishNote, setRelinquishNote] = useState<string | undefined>();
  const { data: organizationData } = useQuery(ORGANIZATION, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });
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

  const { data, loading } = useQuery(GET_ALL_SHIFTS, {
    variables: {
      input: {
        ...filters
      },
    }
  });

  const { shifts: { items, total } } = data || { shifts: { items: [], total: 0 } };

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setCurrentTab(newValue);
      if (newValue === 'upcoming') {
        setFilters((c: any) => {
          delete c.endTime;
          c.startTime = new Date().toISOString();
          return c;
        });
      } else if (newValue === 'past') {
        setFilters((c: any) => {
          c.endTime = new Date().toISOString();
          delete c.startTime;
          return c;
        });
      } else {
        setFilters((c: any) => {
          delete c.endTime;
          delete c.startTime;
          return c;
        });
      }
    },
    [setFilters]
  );

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

  const shiftActions = [
    {
      key: 'relinquish',
      onClick: (shift: Shift) => {
        setEditShift(shift);
        relinquishConfirm.onTrue();
      },
      getIcon: () => 'mdi:close-thick',
      getName: () => 'Relinquish',
    }
  ]

  return (
    <Container sx={{
      height: '100%',
    }} maxWidth={settings.themeStretch ? false : 'lg'}>
      <Box sx={{mb: { xs: 3, md: 5 }}}>
        <Typography variant="h4" gutterBottom>
          My Overtime
        </Typography>
      </Box>

      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        sx={{mb: { xs: 3, md: 5 }}}
      >
        {['upcoming', 'past', 'all'].map((tab) => (
          <Tab
            key={tab}
            iconPosition="end"
            value={tab}
            label={tab}
            sx={{ textTransform: 'capitalize' }}
          />
        ))}
      </Tabs>

      <ShiftItems
        total={total}
        pageSize={table.rowsPerPage}
        setPage={(page: number) => {
          table.onChangePage(null, page - 1);
          setFilters((c: any) => ({
            ...c,
            skip: (page - 1) * table.rowsPerPage,
          }));
        }}
        currentPage={table.page + 1}
        shifts={items.map((rawShift: any) => {
          const shift = JSON.parse(JSON.stringify(rawShift));
          if (shift.locked) {
            shift.disabled = true;
          } else {
            const startDate = new Date(shift.startTime);
            const numberOfHoursBeforeShift = shift.organization?.settings?.userRelinquishShift?.numberOfHoursBeforeShift;
            const disableDate = subHours(startDate, numberOfHoursBeforeShift || 0);
            const now = new Date();
            shift.disabled = isAfter(now, disableDate);
          }

          return shift;
        })}
        shiftActions={shiftActions}
        loading={loading}
      />

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
    </Container>
  );
}
