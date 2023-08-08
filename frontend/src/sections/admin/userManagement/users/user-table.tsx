import { useState, useEffect, useCallback } from 'react';
// @apollo/client
import { useMutation, useQuery } from '@apollo/client';
// lodash
import isEqual from 'lodash/isEqual';
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
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import {
  useTable,
  emptyRows,
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
import { User } from 'src/__generated__/resolvers-types';
import {
  GET_USERS,
  UPDATE_USER,
  UserTableFilters,
  UserTableFilterValue
} from 'src/api/user';
//
import UserTableRow from './user-table-row';
import UserTableToolbar from './user-table-toolbar';
import UserTableFiltersResult from './user-table-filters-result';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'pNumber', label: 'P#', width: 160, noSort: true },
  { id: 'rank', label: 'Rank', width: 160 },
  { id: 'tier', label: 'Tier', width: 160 },
  { id: 'status', label: 'Account Status', width: 160 },
  { id: 'createdAt', label: 'Created', width: 160 },
  { id: '', width: 88 },
];

const CERT_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const ADMIN_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const ACTIVE_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'InActive' },
];

const defaultFilters: UserTableFilters = {
  name: '',
  pNumber: '',
  rankIds: [],
  statuses: [],
  skillIds: [],
  tiers: [],
};

// ----------------------------------------------------------------------

export default function UserTable() {
  const table = useTable({
    defaultOrderBy: 'createdAt',
    defaultOrder: 'desc',
  });
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);

  // const [removeUser] = useMutation(REMOVE_USER, {
  //   refetchQueries: [GET_USERS],
  // });
  const { data, loading } = useQuery(GET_USERS, {
    variables: {
      input: {
        limit: table.rowsPerPage,
        skip: table.page * table.rowsPerPage,
      },
    }
  });

  const { users: { items: users, total: apiTotal } } = data || { users: { items: [], total: 0 } };
  const isEmpty = total === 0;

  const [editUser, setEditUser] = useState<User | null>(null);
  const [tableData, setTableData] = useState<User[]>([]);

  const deleteConfirm = useBoolean();
  const upsertUser = useBoolean();

  useEffect(() => {
    if (users.length) {
      setTotal(apiTotal);
      setTableData(users);
    }
  }, [users, apiTotal]);

  const denseHeight = 60;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!users.length && canReset) || (isEmpty && !loading);

  const handleFilters = useCallback(
    (name: string, value: UserTableFilterValue) => {
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
      
    },
    []
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRows: total,
      totalRowsInPage: users.length,
      totalRowsFiltered: users.length,
    });
  }, [total, users.length, table, tableData]);

  const handleEditRow = useCallback(
    (user: User) => {
      setEditUser(user);
      upsertUser.onTrue();
    },
    [upsertUser]
  );

  const handleUpsert = useCallback(
    () => {
      setEditUser(null);
    },
    []
  );

  const handleToggleActivation = useCallback(
    (user: User, active: boolean) => {
      // updateUser({
      //   variables: {
      //     input: {
      //       id: user.id,
      //       active,
      //       name: user.name,
      //       requiresCert: skill.requiresCert,
      //       requiresAdminApproval: skill.requiresAdminApproval,
      //       rankOnlyIds: skill.rankOnlyIds,
      //     },
      //   },
      // });
    },
    [],
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
          <Typography variant="h4"> Users </Typography>
          {/* <Button
            variant="contained"
            startIcon={<Iconify icon="ic:baseline-add"/>}
            onClick={upsertUser.onTrue}
          >Invite User</Button> */}
        </Box>
        <UserTableToolbar
          filters={filters}
          onFilters={handleFilters}
          //
          rankIdOptions={ACTIVE_OPTIONS}
          statusOptions={ACTIVE_OPTIONS}
          skillIdOptions={ACTIVE_OPTIONS}
          tierOptions={ACTIVE_OPTIONS}
        />

        {canReset && (
          <UserTableFiltersResult
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
            rowCount={tableData.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                tableData.map((row) => row.id)
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
                rowCount={tableData.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    tableData.map((row) => row.id)
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
                    {users
                      .map((row: User) => (
                        <UserTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onToggleActivation={(active) => handleToggleActivation(row, active)}
                          onDeleteRow={() => handleDeleteRow(row.id)}
                          onEditRow={() => handleEditRow(row)}
                        />
                      ))}
                  </>
                )}

                {!loading && !notFound && <TableEmptyRows
                  height={denseHeight}
                  emptyRows={table.rowsPerPage - users.length}
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
    </>
  )
};
