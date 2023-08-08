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
import { IProductTableFilterValue, ISkillTableFilters } from 'src/types/product';
import { Skill } from 'src/__generated__/resolvers-types';
import { GET_SKILLS, REMOVE_SKILL, UPSERT_SKILL } from 'src/api/skill';
//
import SkillTableRow from './skill-table-row';
import SkillTableToolbar from './skill-table-toolbar';
import SkillTableFiltersResult from './skill-table-filters-result';
import UpsertSkillDialogue from './upsert-skill-dialogue';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Skill' },
  { id: 'ranks', label: 'Ranks', width: 200, noSort: true },
  { id: 'certRequired', label: 'Cert Required', width: 160 },
  { id: 'adminApproval', label: 'Admin Approval', width: 160 },
  { id: 'isActive', label: 'Active', width: 110 },
  { id: 'createdAt', label: 'Create at', width: 160 },
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

const defaultFilters: ISkillTableFilters = {
  name: '',
  admin: [],
  cert: [],
  active: [],
};

// ----------------------------------------------------------------------

export default function SkillTable() {
  const table = useTable({
    defaultOrderBy: 'createdAt',
    defaultOrder: 'desc',
  });
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);

  const [removeSkill] = useMutation(REMOVE_SKILL, {
    refetchQueries: [GET_SKILLS],
  });
  const { data, loading } = useQuery(GET_SKILLS, {
    variables: {
      input: {
        limit: table.rowsPerPage,
        skip: table.page * table.rowsPerPage,
        orderBy: table.orderBy,
        order: table.order,
        ...(filters.name.trim() !== '' ? { query: filters.name } : {}),
        ...(filters.active.length === 1 ? { active: filters.active[0] === 'active' } : {}),
        ...(filters.cert.length === 1 ? { requiresCert: filters.cert[0] === 'yes' } : {}),
        ...(filters.admin.length === 1 ? { requiresAdminApproval: filters.cert[0] === 'yes' } : {}),
      },
    }
  });
  const [updateSkill] = useMutation(UPSERT_SKILL, {
    refetchQueries: [GET_SKILLS],
  });

  const { skills: { items: skills, total: apiTotal } } = data || { skills: { items: [], total: 0 } };
  const isEmpty = total === 0;

  const [editSkill, setEditSkill] = useState<Skill | null>(null);
  const [tableData, setTableData] = useState<Skill[]>([]);

  const deleteConfirm = useBoolean();
  const upsertSkill = useBoolean();

  useEffect(() => {
    if (skills.length) {
      setTotal(apiTotal);
      setTableData(skills);
    }
  }, [skills, apiTotal]);

  const denseHeight = 60;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!skills.length && canReset) || (isEmpty && !loading);

  const handleFilters = useCallback(
    (name: string, value: IProductTableFilterValue) => {
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
      removeSkill({
        variables: {
          id,
        },
      });
    },
    [removeSkill]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRows: total,
      totalRowsInPage: skills.length,
      totalRowsFiltered: skills.length,
    });
  }, [total, skills.length, table, tableData]);

  const handleEditRow = useCallback(
    (skill: Skill) => {
      setEditSkill(skill);
      upsertSkill.onTrue();
    },
    [upsertSkill]
  );

  const handleUpsert = useCallback(
    () => {
      setEditSkill(null);
    },
    []
  );

  const handleToggleActivation = useCallback(
    (skill: Skill, active: boolean) => {
      updateSkill({
        variables: {
          input: {
            id: skill.id,
            active,
            name: skill.name,
            requiresCert: skill.requiresCert,
            requiresAdminApproval: skill.requiresAdminApproval,
            rankOnlyIds: skill.rankOnlyIds,
          },
        },
      });
    },
    [updateSkill],
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
          <Typography variant="h4"> Skill </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="ic:baseline-add"/>}
            onClick={upsertSkill.onTrue}
          >Create Skill</Button>
        </Box>
        <SkillTableToolbar
          filters={filters}
          onFilters={handleFilters}
          //
          activeOptions={ACTIVE_OPTIONS}
          certOptions={CERT_OPTIONS}
          adminOptions={ADMIN_OPTIONS}
        />

        {canReset && (
          <SkillTableFiltersResult
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
                    {skills
                      .map((row: Skill) => (
                        <SkillTableRow
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
                  emptyRows={table.rowsPerPage - skills.length}
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

      <UpsertSkillDialogue
        upsertSkill={upsertSkill}
        skill={editSkill}
        onUpsertSkill={handleUpsert}
      />
    </>
  )
};
