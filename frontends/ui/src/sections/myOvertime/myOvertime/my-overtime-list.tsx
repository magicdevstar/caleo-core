import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { isAfter, isBefore, subHours } from 'date-fns';
// types
import { GET_ALL_SHIFTS, GET_SHIFT_BUFFER_REQUESTS } from 'src/api/shifts';
import { TableProps } from 'src/components/table';
import { useResponsive } from 'src/hooks/use-responsive';
// local imports
import ShiftItems from 'src/components/shifts/shift-items';
import { Organization, Shift, ShiftBufferRequest, ShiftBufferRequestStatus, ShiftStatus } from 'src/__generated__/resolvers-types';
import { ORGANIZATION } from 'src/api/organization';
import { useBoolean } from 'src/hooks/use-boolean';
import RelinquishDialog from 'src/sections/dashboard/dashboard/overtime-shifts/relinquish-dialog';

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

interface Props {
  table: TableProps;
  setFilters: React.Dispatch<any>;
  filters: any;
}

export default function MyOvertimeList({
  table,
  setFilters,
  filters,
}: Props) {
  const mdDown = useResponsive('down', 'md');

  const { data: organizationData } = useQuery(ORGANIZATION, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });
  const organization = organizationData?.organization;

  const relinquishNoteRequired = organization?.settings?.userRelinquishShift?.enabled && organization?.settings?.userRelinquishShift?.requireNoteWhenRelinquishing;
  const relinquishConfirm = useBoolean<Shift | ShiftBufferRequest>();

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

  const shiftActions = [
    {
      key: 'relinquish',
      color: 'error',
      disabled: (shift: any) => getButtonInfo(organization, shift).disabled,
      onClick: (shift: any) => relinquishConfirm.onTrue(shift),
      getIcon: (shift: any) => getButtonInfo(organization, shift).icon,
      getName: (shift: any) => getButtonInfo(organization, shift).title,
    }
  ]

  return (
    <>
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
      <RelinquishDialog
        confirm={relinquishConfirm}
        relinquishNoteRequired={relinquishNoteRequired}
      />
    </>
  );
}
