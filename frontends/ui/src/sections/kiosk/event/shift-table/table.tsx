import { useCallback, useMemo, useState } from 'react';
import { ApolloQueryResult } from '@apollo/client';
// @mui
import { useTheme, alpha } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
// components
import Label from 'src/components/label';
// types
import { Shift } from 'src/__generated__/resolvers-types';
import Scrollbar from 'src/components/scrollbar';
import { emptyRows, TableEmptyRows, TableHeadCustom, TableNoData, useTable } from 'src/components/table';
import { usePNumberLabel } from 'src/hooks/use-pNumber-label';
import { useFeatures } from 'src/hooks/use-features';
import { mixedTypeSort } from 'src/utils/mixed-type-sort';
import { IShiftData } from 'src/types/event-dashboard';
import { ShiftData } from 'src/api/shifts';
import Row from './row';
import { IShiftTableHead } from './types';

export default function ShiftTable({
  tableHead,
  data,
  loading,
  refetch,
}: {
  tableHead?: IShiftTableHead[];
  loading: boolean;
  data: IShiftData;
  refetch: () => Promise<ApolloQueryResult<ShiftData>>;
}) {
  const { eventCheckIn, eventCheckOut, customizableShiftId, docusignCheckout } = useFeatures();
  const totalUnassigned = data.unassignedShifts.total;
  const { total } = data.assignedShifts;
  const { pNumberLabel } = usePNumberLabel();
  const TABLE_HEAD = tableHead || [
    customizableShiftId ? { id: 'customId', label: 'Shift Id' } : { id: 'refNumber', label: 'Slot Ref #' },
    { id: 'callSign', label: 'Call Sign' },
    { id: 'user.name', label: 'Name' },
    { id: 'user.member.rank.name', label: 'Rank' },
    { id: 'user.member.pNumber', label: pNumberLabel },
    { id: 'user.member.contactInfo.primaryPhone.number', label: 'Phone #' },
    ...(docusignCheckout ? [{ id: 'docusignEvent.status', label: 'Docusign' }] : []),
    { id: 'shiftCheckInOut.noShow', label: 'No Show' },
    { id: 'shiftCheckInOut.adminNotes', label: 'Comments' },
    { id: 'startTime', label: 'Start' },
    { id: '' },
  ];
  const theme = useTheme();

  const table = useTable({
    defaultDense: true,
    defaultOrderBy: 'startTime',
  });

  const denseHeight = table.dense ? 56 : 76;
  const [searchText, setSearchText] = useState<string>('');
  const [tableTab, setTableTab] = useState<string>('all');
  const handleTableTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setTableTab(newValue);
    },
    [setTableTab]
  );

  const totalCheckedIn = data.checkedIn.total;
  const totalCheckedOut = data.checkedOut.total;
  const totalNotCheckedIn = data.awaitingArrival.total;
  const totalNoShow = data.noShow.total;
  const totalLate = data.late.total;

  const TABS = [
    { value: 'all', label: 'All', color: 'default', count: total },
    {
      value: 'awaitingArrival',
      label: 'Await Arrival',
      color: 'warning',
      count: totalNotCheckedIn,
    },
    ...(eventCheckIn ? [
      {
        value: 'late',
        label: 'Late',
        color: 'error',
        count: totalLate,
      },
      {
        value: 'checkedIn',
        label: 'Checked In',
        color: 'success',
        count: totalCheckedIn,
      },
    ] : [] as any),
    {
      value: 'demobilized',
      label: 'Demobilized',
      color: 'secondary',
      count: data.demobilized.total,
    },
    ...(eventCheckOut ? [
      {
        value: 'checkedOut',
        label: 'Checked Out',
        color: 'default',
        count: totalCheckedOut,
      },
    ] : [] as any),
    {
      value: 'shiftCheckInOut.noShow',
      label: 'No Show',
      color: 'error',
      count: totalNoShow,
    },
    {
      value: 'unassigned',
      label: 'Unassigned',
      color: 'default',
      count: totalUnassigned,
    }
  ] as const;

  const filteredData = useMemo(() => {
    const searchRegex = new RegExp(searchText, 'i');
    let fData = data.assignedShifts.items;

    switch(tableTab) {
      case 'unassigned':
        fData = data.unassignedShifts.items;
        break;
      case 'awaitingArrival':
        fData = data.awaitingArrival.items;
        break;
      case 'checkedIn':
        fData = data.checkedIn.items;
        break;
      case 'demobilized':
        fData = data.demobilized.items;
        break;
      case 'checkedOut':
        fData = data.checkedOut.items;
        break;
      case 'late':
        fData = data.late.items;
        break;
      case 'shiftCheckInOut.noShow':
        fData = data.noShow.items;
        break;
      default:
        break;
    }

    if (searchText !== '') {
      return fData?.filter((shift) => searchRegex.test(shift?.user?.name || ''));
    }

    return fData;
  }, [
    searchText,
    data,
    tableTab
  ]);

  const finalData = useMemo(() => mixedTypeSort(filteredData || [], table), [table, filteredData]).items as Shift[];

  const searchBox = (
    <TextField
      label="Search"
      fullWidth
      onChange={(event) => setSearchText(event.target.value)}
    />
  )

  return (
    <Grid item xs={12} sx={{ mb: 15 }}>
      <Card>
        <CardHeader title="Shift Overview" action={searchBox} />
        <Tabs
          value={tableTab}
          onChange={handleTableTabChange}
          sx={{
            mt: 2,
            px: 2.5,
            boxShadow: `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === tableTab) && 'filled') || 'soft'
                  }
                  color={tab.color}
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </Tabs>

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={data?.shifts.total}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {finalData?.map((row) => (
                  <Row
                    key={row.id}
                    header={TABLE_HEAD}
                    row={row}
                    refetch={refetch}
                  />
                ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, finalData?.length || 0)}
                />

                <TableNoData notFound={!loading && (finalData?.length || 0) === 0} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>
    </Grid>
  )
}
