import { useCallback, useMemo, useState } from "react";
// @apollo/client
import { useQuery } from "@apollo/client";
// @mui
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableBody from "@mui/material/TableBody";
import LoadingButton from "@mui/lab/LoadingButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
// Types
import { TableConfig, resolveFilterValue } from "../table-config";
// Hooks
import useTable from "../use-table";
// Components
import Iconify from "../../iconify";
import Scrollbar from "../../scrollbar";
import TableSkeleton from "../table-skeleton";
import TablePaginationCustom from "../table-pagination-custom";
import TableNoData from "../table-no-data";
import TableEmptyRows from "../table-empty-rows";
import TableToolbar from "./toolbar";
import TableFiltersResult from "./filter-result";
import TableHeadCustom from "../table-head-custom";
import GQLTableRow from "./row";

export default function GQLTable({
  config,
} : {
  config: TableConfig<any>;
}) {
  const [currentTab, setCurrentTab] = useState(config?.tabs?.default || 'all');
  const { onResetPage, ...table } = useTable({
    defaultRowsPerPage: config.search?.defaultTableConfig?.defaultRowsPerPage,
    defaultOrderBy: config.search?.defaultTableConfig?.defaultOrderBy || 'createdAt',
    defaultOrder: config.search?.defaultTableConfig?.defaultOrder || 'desc',
  });
  const [filters, setFilters] = useState(config.filters);
  const uiFilters = useMemo(() =>
    filters.filter(({ type }) => type !== 'hidden' && type !== 'hiddenValue'), [filters]);
  const { data, loading: gqlLoading } = useQuery(config.search.query, {
    skip: !!config.search.data,
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        limit: table.rowsPerPage,
        skip: table.page * table.rowsPerPage,
        orderBy: table.orderBy,
        order: table.order,
        ...(filters.reduce((acc, filter) => {
          acc[filter.id] = resolveFilterValue(filter);
          return acc;
        }, {} as any)),
      },
    }
  });

  const loading = config.search.loading || gqlLoading;
  const { items, total: apiTotal } = config.search.processResult(data || config.search.data);
  const tableData = useMemo(() => items, [items]);
  const total = useMemo(() => apiTotal, [apiTotal]);
  const isEmpty = total === 0;

  const denseHeight = 57;

  const canReset = filters
    .filter(({ type, value }) =>
      type !== 'hidden' && type !== 'hiddenValue' && (Array.isArray(value) && value.length > 0)
    )
    .some((filter) => JSON.stringify(filter.value) !== JSON.stringify(filter.defaultValue));

  const notFound = (!items.length && canReset) || (isEmpty && !loading);

  const handleFilters = useCallback(
    (id: string, value: any) => {
      onResetPage();
      setFilters((prevState) => prevState.map((filter) => {
        if (filter.id === id) {
          return {
            ...filter,
            value,
          }
        }
        return filter;
      }));
    },
    [onResetPage]
  );

  const setAllFilters = useCallback(
    (values: {id: string, value: any}[]) => {
      onResetPage();
      setFilters((prevState) => {
        const valueToAdd = values.filter((v) => !prevState.find((f) => f.id === v.id));
        const res = [
          ...valueToAdd.map((v) => ({
            id: v.id,
            type: 'hiddenValue',
            label: v.id,
            defaultValue: v.value,
            value: v.value,
          })),
          ...prevState.map((filter) => {
            const foundValue = values.find((v) => v.id === filter.id);
            if (filter.id === foundValue?.id) {
              return {
                ...filter,
                value: foundValue?.value,
              };
            }
            return filter;
          }),
        ] as any;
        return res;
      });
    },
    [onResetPage]
  );

  const handleResetFilters = useCallback(() => {
    setFilters((c) => c.map((f) => ({
      ...f,
      value: f.defaultValue,
    })));
  }, [setFilters]);

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setCurrentTab(newValue);
    },
    [setCurrentTab]
  );

  return (
    <Card>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        p: 2,
        pb: 0,
      }}>
        <Typography variant="h4"> { config.header.title } </Typography>
        <Stack direction="row" spacing={2}>
          {config.header.button && <LoadingButton
            loading={config.header.button.loading}
            variant="contained"
            disabled={config.header.button.disabled}
            startIcon={<Iconify icon={config.header.button.icon}/>}
            onClick={config.header.button.onClick}
          >{config.header.button.text}</LoadingButton>}
          {config.header.buttons &&
            config.header.buttons.map((buttonConfig) => (
              <LoadingButton
                key={buttonConfig.key}
                loading={buttonConfig.loading}
                variant={(buttonConfig.variant || 'contained' as any)}
                disabled={buttonConfig.disabled}
                startIcon={<Iconify icon={buttonConfig.icon}/>}
                onClick={buttonConfig.onClick}
              >{buttonConfig.text}</LoadingButton>
            ))
          }
        </Stack>
      </Box>

      {config?.tabs && <Tabs
        value={currentTab}
        onChange={handleTabChange}
        sx={{
          px: 2.5,
          boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
        }}
      >
        {config?.tabs?.items.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.value}
            onClick={() => tab.onClick(setAllFilters)}
          />
        ))}
      </Tabs>}

      <TableToolbar
        toolbarConfig={config?.table?.toolbar}
        filters={uiFilters}
        onFilters={handleFilters}
        localSearch={!!config?.search?.data}
      />

      {canReset && (
        <TableFiltersResult
          filters={uiFilters}
          onFilters={handleFilters}
          onResetFilters={handleResetFilters}
          //
          results={total}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}

      <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
        <Scrollbar>
          <Table size='small' sx={{ minWidth: config?.table?.sx?.minWidth || 960 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headLabel={config.columns}
              rowCount={tableData.length}
              numSelected={table.selected.length}
              onSort={table.onSort}
            />

            <TableBody>
              {loading ? (
                [...Array(table.rowsPerPage)].map((i, index) => (
                  <TableSkeleton key={index} sx={{ height: denseHeight }} />
                ))
              ) : (
                <>
                  {items
                    .map((row: any, index) => (
                      <GQLTableRow
                        key={row.id}
                        row={row}
                        index={index}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        config={config}
                      />
                    ))}
                </>
              )}

              {!loading && !notFound && <TableEmptyRows
                height={denseHeight}
                emptyRows={table.rowsPerPage - items.length}
              />}

              {!loading && <TableNoData notFound={notFound} />}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      {!config.search.data && <TablePaginationCustom
        count={total}
        page={total ? table.page : 0}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        dense
      />}
    </Card>
  );
}
