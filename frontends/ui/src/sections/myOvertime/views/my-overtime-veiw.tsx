import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { isAfter, isBefore, subHours } from 'date-fns';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
// components
import { useSettingsContext } from 'src/components/settings';
// types
import { GET_ALL_SHIFTS, GET_SHIFT_BUFFER_REQUESTS } from 'src/api/shifts';
import { useTable } from 'src/components/table';
import { useAuthContext } from 'src/auth/hooks';
import { useResponsive } from 'src/hooks/use-responsive';
// local imports
import ShiftItems from 'src/components/shifts/shift-items';
import { Organization, Shift, ShiftBufferRequest, ShiftBufferRequestStatus, ShiftStatus } from 'src/__generated__/resolvers-types';
import { ORGANIZATION } from 'src/api/organization';
import { useBoolean } from 'src/hooks/use-boolean';
import CheckInOut from 'src/components/shifts/check-in-out';
import RelinquishDialog from 'src/sections/dashboard/dashboard/overtime-shifts/relinquish-dialog';
import { useFeatures } from 'src/hooks/use-features';

// ----------------------------------------------------------------------

const getButtonInfo = (organization: Organization, shift: Shift | ShiftBufferRequest) => {
  if (shift.__typename === 'ShiftBufferRequest') {
    return {
      icon: 'mdi:close-thick',
      title: 'Cancel Buffer Request',
      disabled: false,
    };
  }

  if (!organization?.settings?.userRelinquishShift?.enabled) {
    return {
      icon: 'mdi:check',
      title: 'Secured',
      disabled: true,
    };
  }
  const startDate = new Date(shift.startTime);
  const endDate = new Date(shift.endTime);
  const numberOfHoursBeforeShift = organization?.settings?.userRelinquishShift?.numberOfHoursBeforeShift;
  const disableDate = subHours(startDate, numberOfHoursBeforeShift || 0);
  const now = new Date();
  const disabled = isAfter(now, disableDate);

  if (isAfter(now, startDate) && isBefore(now, endDate)) {
    return {
      icon: 'mdi:clock-alert',
      title: 'In Progress',
      disabled,
    }
  }
  if (isAfter(now, endDate)) {
    return {
      icon: 'mdi:check',
      title: 'Secured',
      disabled,
    }
  }
  if ((shift as Shift).locked || shift.status === ShiftStatus.Locked) {
    return {
      icon: 'mdi:lock',
      title: 'Locked',
      disabled: true,
    }
  }
  return {
    icon: 'mdi:close-thick',
    title: 'Scratch',
    disabled,
  };
};

export default function MyOvertimeView() {
  const { user } = useAuthContext();
  const theme = useTheme();
  const { officerCheckInOut } = useFeatures();
  const [currentTab, setCurrentTab] = useState('assigned');
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultOrder: 'asc',
    defaultRowsPerPage: 10000,
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
  const mdDown = useResponsive('down', 'md');

  const { data: organizationData } = useQuery(ORGANIZATION, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });
  const organization = organizationData?.organization;

  const [editShift, setEditShift] = useState<Shift | ShiftBufferRequest | null>(null);

  const relinquishNoteRequired = organization?.settings?.userRelinquishShift?.enabled && organization?.settings?.userRelinquishShift?.requireNoteWhenRelinquishing;
  const relinquishConfirm = useBoolean();

  const { data, loading } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...filters
      },
    }
  });

  const { data: shiftBufferRequests, loading: loadingShiftBuffers } = useQuery(GET_SHIFT_BUFFER_REQUESTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...filters,
        status: ShiftBufferRequestStatus.Pending,
      },
    }
  });

  const { shifts: { items, total } } = data || { shifts: { items: [], total: 0 } };
  const { shiftBufferRequests: { items: bufferItems } } = shiftBufferRequests || { shiftBufferRequests: { items: [] } };


  const listData = useMemo(() => {
    if (!items || !bufferItems) return [];
    return [
      ...items,
      ...bufferItems,
    ].sort((a: any, b: any) => {
      const aStart = new Date(a.startTime);
      const bStart = new Date(b.startTime);
      return bStart.getTime() - aStart.getTime();
    });
  }, [items, bufferItems]);

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setCurrentTab(newValue);
      if (newValue === 'assigned') {
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
      relinquishConfirm.onFalse();
    },
    [relinquishConfirm, setEditShift]
  );

  const shiftActions = [
    {
      key: 'relinquish',
      color: 'error',
      disabled: (shift: any) => getButtonInfo(organization, shift).disabled,
      onClick: (shift: any) => {
        if (shift.__typename === 'ShiftBufferRequest') {
          setEditShift(shift);
        } else {
          setEditShift(shift);
        }
        relinquishConfirm.onTrue();
      },
      getIcon: (shift: any) => getButtonInfo(organization, shift).icon,
      getName: (shift: any) => getButtonInfo(organization, shift).title,
    }
  ]

  return (
    <Container sx={{
      height: '100%',
    }} maxWidth={settings.themeStretch ? false : 'lg'}>
      <CheckInOut allowView={officerCheckInOut} />

      <Box>
        <Typography variant="h4" gutterBottom>
          My Overtime
        </Typography>
      </Box>

      <Card sx={{ background: alpha(theme.palette.background.paper, 0.5) }}>
        <CardContent>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{mb: { xs: 3, md: 5 }}}
          >
            {['assigned', 'past'].map((tab) => (
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
            emptyMessage='No Overtime'
            compact={mdDown}
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
            shifts={listData.map((rawShift: any) => {
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
            loading={loading || loadingShiftBuffers}
          />
        </CardContent>
      </Card>
      <RelinquishDialog
        open={relinquishConfirm.value}
        onClose={closeRelinquish}
        editShift={editShift}
        relinquishNoteRequired={relinquishNoteRequired}
      />
    </Container>
  );
}
