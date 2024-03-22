import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { isAfter, subHours } from 'date-fns';
import { capitalize, isEqual } from 'lodash';
// @mui
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTheme } from '@mui/material/styles';
// hooks
import { useLotteryCounterOptions } from 'src/hooks/use-lottery-counter-options';
import { CurrentShiftType, useCurrentShifts } from 'src/hooks/use-current-shifts';
import { useBoolean } from 'src/hooks/use-boolean';
import { convertDate, dateTimeFormat } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
import { useResponsive } from 'src/hooks/use-responsive';
// types
import Label, { LabelColor, LabelVariant } from 'src/components/label';
import { EventStatus, Shift, ShiftBufferRequest } from 'src/__generated__/resolvers-types';
import { ORGANIZATION } from 'src/api/organization';
import { DayMap } from 'src/types/day';
import { CalendarShift } from 'src/types/calendar';
// components
import { useTable } from 'src/components/table';
import ShiftItems from 'src/components/shifts/shift-items';
import Iconify from 'src/components/iconify';
import ShiftCalendar from 'src/components/shift-calendar/shift-calendar';
import { getButtonInfo } from './get-button-info';
import RelinquishDialog from './relinquish-dialog';
import SignUpDialog from './sign-up-dialog';
import ShiftFilters, { ShiftFilterValues } from './shift-filters';
import ShiftFilterResults from './shift-filter-results';
import ShiftDialog from './shift-dialog';

const defaultUIFilters: ShiftFilterValues = {
  range: [null, null],
  skillIds: [],
};

enum ShiftViewType {
  List = 'LIST',
  Calendar = 'CALENDAR',
}

export default function OvertimeShifts() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const mdDown = useResponsive('down', 'md');
  const smDown = useResponsive('down', 'sm');
  const [currentTab, setCurrentTab] = useState<CurrentShiftType>(CurrentShiftType.Assigned);
  const [shiftView, setShiftView] = useState<ShiftViewType>(ShiftViewType.List);
  const { onResetPage, ...table } = useTable({
    defaultOrderBy: 'startTime',
    defaultOrder: 'asc',
    defaultRowsPerPage: 10,
  });
  const filters = useMemo<any>(
    () => ({
      limit: table.rowsPerPage,
      skip: table.page * table.rowsPerPage,
      orderBy: table.orderBy,
      order: table.order,
    }),
    [table]
  );
  const [uiFilters, setUIFilters] = useState(defaultUIFilters);
  const [editShift, setEditShift] = useState<Shift | ShiftBufferRequest | null>(null);
  const [selectedDialogShift, setSelectedDialogShift] = useState<Shift | ShiftBufferRequest | null>(null);

  const canReset = useMemo(() => !isEqual(defaultUIFilters, uiFilters), [uiFilters]);

  // shift dialog properties
  const showDialogShift = useBoolean();
  const closeShiftDialog = useCallback(() => {
    setTimeout(() => {
      setSelectedDialogShift(null);
    }, 200);
    showDialogShift.onFalse();
  }, [showDialogShift]);

  // assigned and secured properties
  const relinquishConfirm = useBoolean();
  const closeRelinquish = useCallback(() => {
    setTimeout(() => {
      setEditShift(null);
    }, 200);
    relinquishConfirm.onFalse();
    if (showDialogShift.value) {
      closeShiftDialog();
    }
  }, [relinquishConfirm, setEditShift, showDialogShift, closeShiftDialog]);

  // available properties
  const assignConfirm = useBoolean();
  const closeAssign = useCallback(() => {
    setTimeout(() => {
      setEditShift(null);
    }, 200);
    assignConfirm.onFalse();
    if (showDialogShift.value) {
      closeShiftDialog();
    }
  }, [assignConfirm, setEditShift, showDialogShift, closeShiftDialog]);

  const {
    currentShifts,
    loading: currentShiftsLoading,
    shiftTotals,
    visited,
  } = useCurrentShifts({
    type: currentTab,
    ...filters,
    ...uiFilters,
  });

  const { data: organizationData } = useQuery(ORGANIZATION, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });

  const userRelinquishShift = useMemo(
    () => organizationData?.organization?.settings?.userRelinquishShift,
    [organizationData]
  );

  const { options: lotteryCounterOptions } = useLotteryCounterOptions({
    org: user.member.org!,
  });

  const getShiftColor = useCallback((shift: Shift | ShiftBufferRequest) => {
    if (shift.__typename === 'ShiftBufferRequest') {
      return theme.palette.warning.main;
    }
    switch (currentTab) {
      case CurrentShiftType.Assigned:
        return theme.palette.success.main;
      case CurrentShiftType.Available:
        return theme.palette.info.main;
      case CurrentShiftType.Upcoming: {
        if ((shift as Shift)?.event?.status === EventStatus.ReadyForLottery) {
          return theme.palette.success.dark;
        }
        return theme.palette.primary.main;
      }
      case CurrentShiftType.Secured:
        default:
        return theme.palette.grey[800];
    }
  }, [theme, currentTab]);

  // TODO: Handle routes that are routed to available and upcoming overtime. Also add query params to url for fast routing.
  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      onResetPage();
      setCurrentTab(newValue as CurrentShiftType);
      if (newValue === CurrentShiftType.Secured) {
        table.setOrder('desc');
      } else if (table.order === 'desc') {
        table.setOrder('asc');
      }
    },
    [table, onResetPage]
  );

  const handleViewChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newValue: ShiftViewType) => {
      if (newValue !== null) {
        onResetPage();
        setShiftView(newValue);
      }
    },
    [onResetPage]
  );

  const handleUIFilters = useCallback(
    (name: string, value: any) => {
      onResetPage();
      setUIFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [onResetPage]
  );

  const handleResetFilters = useCallback(() => {
    setUIFilters(defaultUIFilters);
  }, []);

  const handleCalendarShiftClick = useCallback((shift: CalendarShift) => {
    setSelectedDialogShift(shift as Shift | ShiftBufferRequest);
    showDialogShift.onTrue();
  }, [showDialogShift]);

  const currentShiftActions = useMemo(() => {
    switch (currentTab) {
      case CurrentShiftType.Assigned:
      case CurrentShiftType.Secured:
        return [
          {
            key: 'relinquish',
            color: 'error',
            disabled: (shift: any) => getButtonInfo(organizationData?.organization, shift).disabled,
            onClick: (shift: any) => {
              if (shift.__typename === 'ShiftBufferRequest') {
                setEditShift(shift);
              } else {
                setEditShift(shift);
              }
              relinquishConfirm.onTrue();
            },
            getIcon: (shift: any) => getButtonInfo(organizationData?.organization, shift).icon,
            getName: (shift: any) => getButtonInfo(organizationData?.organization, shift).title,
          },
        ];
      case CurrentShiftType.Available:
        return [
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
          },
        ];
      case CurrentShiftType.Upcoming:
      default:
        return [];
    }
  }, [currentTab, relinquishConfirm, organizationData, assignConfirm]);

  const currentShiftLabels = useMemo(() => {
    if (currentTab === CurrentShiftType.Upcoming) {
      return [
        {
          key: 'shift-post-date',
          variant: 'soft' as LabelVariant,
          sx: {
            border: 'none',
            background: 'none',
          },
          getHidden: (shift: Shift) =>
            ![EventStatus.ReadyForLottery, EventStatus.FirstComeFirstServe].includes(
              shift?.event?.status
            ),
          getLabel: (shift: Shift) => {
            if (shift?.event?.status === EventStatus.ReadyForLottery) {
              const foundCounter = lotteryCounterOptions.find(
                (c) => c.counter === shift?.event?.lotteryNumber
              );
              if (!foundCounter) {
                return '';
              }
              return foundCounter?.time;
            }
            if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
              const fcfsDate = convertDate({
                date: shift?.event?.scheduledFirstComeFirstServe || '',
                user,
              });
              return `${fcfsDate.format(dateTimeFormat)}`;
            }
            return '';
          },
        },
        {
          key: 'shift-event-status',
          variant: 'soft' as LabelVariant,
          getHidden: (shift: Shift) =>
            ![EventStatus.ReadyForLottery, EventStatus.FirstComeFirstServe].includes(
              shift?.event?.status
            ),
          getColor: (shift: Shift) => {
            if (shift?.event?.status === EventStatus.ReadyForLottery) {
              return 'success';
            }
            if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
              return 'primary';
            }
            return 'default';
          },
          getLabel: (shift: Shift) => {
            if (shift?.event?.status === EventStatus.ReadyForLottery) {
              return 'Pre-Lottery';
            }
            if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
              return 'Pre-First Come First Serve';
            }
            return '';
          },
        },
      ];
    }
    return undefined;
  }, [currentTab, lotteryCounterOptions, user]);

  const currentView = useMemo(() => {
    switch (shiftView) {
      case ShiftViewType.List:
        return (
          <ShiftItems
            emptyMessage={`No ${capitalize(currentTab.toLowerCase())} Shifts`}
            compact={mdDown}
            total={shiftTotals[currentTab]}
            pageSize={table.rowsPerPage}
            setPage={(page: number) => {
              table.onChangePage(null, page - 1);
            }}
            currentPage={table.page + 1}
            shifts={currentShifts.map((rawShift: any) => {
              const shift = JSON.parse(JSON.stringify(rawShift));
              if (shift.locked) {
                shift.disabled = true;
              } else {
                const startDate = new Date(shift.startTime);
                const numberOfHoursBeforeShift =
                  shift.organization?.settings?.userRelinquishShift?.numberOfHoursBeforeShift;
                const disableDate = subHours(startDate, numberOfHoursBeforeShift || 0);
                const now = new Date();
                shift.disabled = isAfter(now, disableDate);
              }

              return shift;
            })}
            shiftActions={currentShiftActions}
            shiftLabels={currentShiftLabels}
            loading={currentShiftsLoading}
          />
        );
      case ShiftViewType.Calendar:
        return (
          <ShiftCalendar
            shifts={currentShifts.map((shift) => ({...shift, color: getShiftColor(shift) }))}
            loading={currentShiftsLoading}
            timezone={user?.member?.org?.timezone}
            startDay={DayMap[user?.member?.org?.weekBegins?.toLowerCase() || 'sunday']}
            onShiftClick={handleCalendarShiftClick}
            sx={{ mb: 3 }}
          />
        );
      default:
        return undefined;
    }
  }, [
    currentShiftActions,
    currentShiftLabels,
    currentShifts,
    currentShiftsLoading,
    currentTab,
    mdDown,
    shiftView,
    table,
    shiftTotals,
    user?.member?.org?.timezone,
    user?.member?.org?.weekBegins,
    getShiftColor,
    handleCalendarShiftClick,
  ]);

  return (
    <>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Stack
          spacing={2}
          direction={{ xs: 'column-reverse', sm: 'row' }}
          justifyContent="space-between"
          sx={{ px: 2 }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{
              width: { xs: '100%', sm: 'initial' },
              justifyContent: { xs: 'space-between', sm: 'initial' },
            }}
          >
            {Object.keys(CurrentShiftType).map((tab) => {
              let color: LabelColor = 'info';
              switch(tab.toUpperCase()) {
                case CurrentShiftType.Assigned:
                  color = 'primary';
                  break;
                case CurrentShiftType.Secured:
                  color = 'warning';
                  break;
                case CurrentShiftType.Upcoming:
                  color = 'success';
                  break;
                default:
                  color = 'info';
                  break;
              }
              return (
                <Tab
                  key={tab}
                  iconPosition="end"
                  value={tab.toUpperCase()}
                  label={tab === 'Secured' ? 'Past' : tab}
                  icon={
                    visited[tab.toUpperCase() as CurrentShiftType] ?
                      (<Label color={color}>{shiftTotals[tab.toUpperCase() as CurrentShiftType]}</Label>) :
                      (<Label sx={{ width: 24 }}>-</Label>)
                  }
                  sx={{ mr: '4px !important', px: 1 }}
                />
              )
            })}
          </Tabs>
          <ToggleButtonGroup
            sx={{ backgroundColor: 'transparent' }}
            value={shiftView}
            exclusive
            onChange={handleViewChange}
            size="small"
            fullWidth={smDown}
          >
            <ToggleButton value={ShiftViewType.List}>
              <Iconify icon="heroicons:queue-list-16-solid" />
            </ToggleButton>
            <ToggleButton value={ShiftViewType.Calendar}>
              <Iconify icon="mdi:calendar" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <ShiftFilters filters={uiFilters} onFilters={handleUIFilters} user={user} />
        {canReset && (
          <ShiftFilterResults
            filters={uiFilters}
            onFilters={handleUIFilters}
            canReset={canReset}
            onResetFilters={handleResetFilters}
            results={shiftTotals[currentTab]}
            user={user}
            sx={{
              px: 3,
            }}
          />
        )}
        {currentView}
      </Stack>
      <RelinquishDialog
        open={relinquishConfirm.value}
        onClose={closeRelinquish}
        editShift={editShift}
        relinquishNoteRequired={
          userRelinquishShift?.enabled && userRelinquishShift?.requireNoteWhenRelinquishing
        }
      />
      <SignUpDialog
        open={assignConfirm.value}
        onClose={closeAssign}
        editShift={editShift as Shift}
        user={user}
      />
      <ShiftDialog
        open={showDialogShift.value}
        onClose={closeShiftDialog}
        shift={selectedDialogShift}
        shiftLabels={currentShiftLabels}
        shiftActions={currentShiftActions}
      />
    </>
  );
}
