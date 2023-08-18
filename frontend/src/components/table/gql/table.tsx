import { useCallback, useEffect, useState } from "react";
// @apollo/client
import { useQuery } from "@apollo/client";
// @mui
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableBody from "@mui/material/TableBody";

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
  const table = useTable({
    defaultOrderBy: 'createdAt',
    defaultOrder: 'desc',
  });
  const [tableData, setTableData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(config.filters);

  const { data, loading: gqlLoading } = useQuery(config.search.query, {
    skip: !!config.search.data,
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
  const isEmpty = total === 0;

  useEffect(() => {
    if (items.length) {
      setTotal(apiTotal);
      setTableData(items);
    }
  }, [items, apiTotal]);

  const denseHeight = 60;

  const canReset = filters.some((filter) => JSON.stringify(filter.value) !== JSON.stringify(filter.defaultValue));

  const notFound = (!items.length && canReset) || (isEmpty && !loading);

  const handleFilters = useCallback(
    (id: string, value: any) => {
      table.onResetPage();
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
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters((c) => c.map((f) => ({
      ...f,
      value: f.defaultValue,
    })));
  }, [setFilters]);

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
        {config.header.button && <Button
          variant="contained"
          disabled={config.header.button.disabled}
          startIcon={<Iconify icon={config.header.button.icon}/>}
          onClick={config.header.button.onClick}
        >{config.header.button.text}</Button>}
      </Box>
      <TableToolbar
        filters={filters}
        onFilters={handleFilters}
      />

      {canReset && (
        <TableFiltersResult
          filters={filters}
          onFilters={handleFilters}
          onResetFilters={handleResetFilters}
          //
          results={total}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}

      <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
        <Scrollbar>
          <Table size='small' sx={{ minWidth: 960 }}>
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
                    .map((row: any) => (
                      <GQLTableRow
                        key={row.id}
                        row={row}
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
  );
}