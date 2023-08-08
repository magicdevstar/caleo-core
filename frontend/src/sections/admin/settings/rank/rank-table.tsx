import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';
// @mui
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
// @apollo/client
import { useMutation, useQuery } from '@apollo/client';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import {
  useTable,
  TableNoData,
  TableSkeleton,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Rank } from 'src/__generated__/resolvers-types';
import { GET_RANKS, RankTableFilters, RankTableFilterValue, REMOVE_RANK, UPSERT_RANK } from 'src/api/rank';
//
import RankTableRow from './rank-table-row';
import RankTableToolbar from './rank-table-toolbar';
import RankTableFiltersResult from './rank-table-filters-result';
import UpsertRankDialogue from './upsert-rank-dialogue';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Rank' },
  { id: 'isActive', label: 'Active', width: 110 },
  { id: 'createdAt', label: 'Create at', width: 160 },
  { id: '', width: 88 },
];

const ACTIVE_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'InActive' },
];

const defaultFilters: RankTableFilters = {
  name: '',
  active: [],
};

// ----------------------------------------------------------------------

export default function RankTable() {
  const table = useTable({
    defaultOrderBy: 'createdAt',
    defaultOrder: 'desc',
  });
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [removeRank] = useMutation(REMOVE_RANK, {
    refetchQueries: [GET_RANKS],
  });
  const { data, loading } = useQuery(GET_RANKS, {
    variables: {
      input: {
        limit: table.rowsPerPage,
        skip: table.page * table.rowsPerPage,
        orderBy: table.orderBy,
        order: table.order,
        ...(filters.name.trim() !== '' ? { query: filters.name } : {}),
        ...(filters.active.length === 1 ? { active: filters.active[0] === 'active' } : {}),
      },
    }
  });
  const [updateRank] = useMutation(UPSERT_RANK, {
    refetchQueries: [GET_RANKS],
  });
  const { ranks: { items: ranks, total: apiTotal } } = data || { ranks: { items: [], total: 0 } };
  const isEmpty = total === 0;

  const [editRank, setEditRank] = useState<Rank | null>(null);
  const [tableData, setTableData] = useState<Rank[]>([]);

  const deleteConfirm = useBoolean();
  const upsertRank = useBoolean();

  useEffect(() => {
    if (ranks.length) {
      setTotal(apiTotal);
      setTableData(ranks);
    }
  }, [ranks, apiTotal]);

  const denseHeight = 60;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!ranks.length && canReset) || (isEmpty && !loading);

  const handleFilters = useCallback(
    (name: string, value: RankTableFilterValue) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleDeleteRow = useCallback(
    (id: string) => {
      removeRank({
        variables: {
          id,
        },
      });
    },
    [removeRank]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRows: total,
      totalRowsInPage: ranks.length,
      totalRowsFiltered: ranks.length,
    });
  }, [total, ranks.length, table, tableData]);

  const handleEditRow = useCallback(
    (rank: Rank) => {
      setEditRank(rank);
      upsertRank.onTrue();
    },
    [upsertRank]
  );

  const handleUpsert = useCallback(
    () => {
      setEditRank(null);
    },
    []
  );

  const handleToggleActivation = useCallback(
    (rank: Rank, active: boolean) => {
      updateRank({
        variables: {
          input: {
            id: rank.id,
            active,
            name: rank.name,
          },
        },
      });
    },
    [updateRank],
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return (
    <>
      <Card>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          p: 2,
          pb: 0,
        }}>
          <Typography variant="h4"> Ranks </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="ic:baseline-add"/>}
            onClick={upsertRank.onTrue}
          >Create Rank</Button>
        </Box>
        <RankTableToolbar
          filters={filters}
          onFilters={handleFilters}
          //
          activeOptions={ACTIVE_OPTIONS}
        />

        {canReset && (
          <RankTableFiltersResult
            filters={filters}
            onFilters={handleFilters}
            //
            onResetFilters={handleResetFilters}
            //
            results={total}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <TableSelectedAction
            dense
            numSelected={table.selected.length}
            rowCount={ranks.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                ranks.map((row: Rank) => row.id)
              )
            }
            action={
              <Tooltip title="Delete">
                <IconButton color="primary" onClick={deleteConfirm.onTrue}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            }
          />

          <Scrollbar>
            <Table size='small' sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={ranks.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    ranks.map((row: Rank) => row.id)
                  )
                }
              />

              <TableBody>
                {loading ? (
                  [...Array(table.rowsPerPage)].map((i, index) => (
                    <TableSkeleton key={index} sx={{ height: denseHeight }} />
                  ))
                ) : (
                  <>
                    {ranks
                      .map((rank: Rank) => (
                        <RankTableRow
                          key={rank.id}
                          row={rank}
                          selected={table.selected.includes(rank.id)}
                          onSelectRow={() => table.onSelectRow(rank.id)}
                          onToggleActivation={(active) => handleToggleActivation(rank, active)}
                          onDeleteRow={() => handleDeleteRow(rank.id)}
                          onEditRow={() => handleEditRow(rank)}
                        />
                      ))}
                  </>
                )}

                {!loading && !notFound && <TableEmptyRows
                  height={denseHeight}
                  emptyRows={table.rowsPerPage - ranks.length}
                />}

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          count={total}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense
        />
      </Card>

      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              deleteConfirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />

      <UpsertRankDialogue
        upsertRank={upsertRank}
        rank={editRank}
        onUpsertRank={handleUpsert}
      />
    </>
  )
};


