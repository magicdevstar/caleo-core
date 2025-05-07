import { useCallback, useMemo, useState } from 'react';
// @mui
import { useTheme, alpha } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
// components
import Label from 'src/components/label';
// types
import { Shift, ShiftStatus } from 'src/__generated__/resolvers-types';
import TableContainer from '@mui/material/TableContainer';
import Scrollbar from 'src/components/scrollbar';
import Table from '@mui/material/Table';
import { emptyRows, getComparator, TableEmptyRows, TableHeadCustom, TableNoData, useTable } from 'src/components/table';
import TableBody from '@mui/material/TableBody';
import { usePNumberLabel } from 'src/hooks/use-pNumber-label';
import Row from './row';

export default function ShiftTable({
  data,
  loading,
}: {
  loading: boolean;
  data: Shift[] | undefined;
}) {
  const shiftData = useMemo(() => (data || []).filter((shift) => shift.status === ShiftStatus.Assigned), [data]);
  const unassignedData = useMemo(() => (data || []).filter((shift) => shift.status === ShiftStatus.Available), [data]);
  const totalUnassigned = unassignedData.length;
  const total = shiftData.length;
  const { pNumberLabel } = usePNumberLabel();
  const TABLE_HEAD = [
    { id: 'refNumber', label: 'Slot Ref #' },
    { id: 'user.name', label: 'Name' },
    { id: 'user.member.rank.name', label: 'Rank' },
    { id: 'user.member.pNumber', label: pNumberLabel },
    { id: 'user.member.contactInfo.primaryPhone.number', label: 'Phone #' },
    { id: 'docusignEvent.status', label: 'Docusign' },
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

  const totalCheckedIn = data?.filter((shift) => !!shift.shiftCheckInOut?.checkInTime).length || 0;
  const totalNotCheckedIn = data?.filter((shift) => !shift.shiftCheckInOut?.checkInTime).length || 0;
  const totalNoShow = data?.filter((shift) => !!shift.shiftCheckInOut?.noShow).length || 0;

  const TABS = [
    { value: 'all', label: 'All', color: 'default', count: total },
    {
      value: 'awaitingArrival',
      label: 'Await Arrival',
      color: 'warning',
      count: totalNotCheckedIn,
    },
    {
      value: 'checkedIn',
      label: 'Checked In',
      color: 'success',
      count: totalCheckedIn,
    },
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
    let fData = shiftData;

    if (tableTab === 'unassigned') {
      fData = unassignedData;
    }

    if (searchText !== '') {
      fData = fData?.filter((shift) => searchRegex.test(shift?.user?.name || ''));
    }
    if (tableTab === 'awaitingArrival') {
      return fData?.filter((shift) => !shift.shiftCheckInOut?.checkInTime);
    }
    if (tableTab === 'checkedIn') {
      return fData?.filter((shift) => !!shift.shiftCheckInOut?.checkInTime);
    }
    if (tableTab === 'shiftCheckInOut.noShow') {
      return fData?.filter((shift) => !!shift.shiftCheckInOut?.noShow);
    }
    return fData;
  }, [
    searchText,
    shiftData,
    unassignedData,
    tableTab
  ]);

  const finalData = useMemo(() => applySort({
    inputData: filteredData || [],
    comparator: getComparator(table.order, table.orderBy),
  }), [table, filteredData]);

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
                rowCount={data?.length || 0}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {finalData?.map((row) => (
                  <Row
                    key={row.id}
                    row={row}
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

function applySort({
  inputData,
  comparator,
}: {
  inputData: Shift[];
  comparator: (a: any, b: any) => number;
}) {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  return inputData;
}
