// @mui
import { DateRangePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro';
import Grid from '@mui/material/Grid';
// types
import { Filter, ToolbarConfig } from '../table-config';
import SelectFilter from './select-filter';
import AutoCompleteFilter from './autocomplte-filter';
import TextFilter from './text-filter';

// ----------------------------------------------------------------------

type Props = {
  toolbarConfig?: ToolbarConfig;
  filters: Filter[];
  onFilters: (id: string, value: any) => any;
  localSearch: boolean;
};

export default function TableToolbar({
  toolbarConfig,
  filters,
  onFilters,
  localSearch,
}: Props) {
  return (
    <Grid container spacing={2} sx={{ width: '100%', margin: 0, paddingRight: '15px', marginBottom: '15px' }}>
      {filters.map((filter) => {
        let render = (<TextFilter filter={filter} onFilters={onFilters} localSearch={localSearch} />);
        if (filter.type === 'select') {
          render = (<SelectFilter filter={filter} onFilters={onFilters} />);
        }
        if (filter.type === 'autocomplete') {
          render = (<AutoCompleteFilter filter={filter} onFilters={onFilters} />);
        }
        if (filter.type === 'dateRange') {
          render = (
            <DateRangePicker slots={{
              field: SingleInputDateRangeField,
            }} onChange={(event) => {
              if (event[0] && event[1]) {
                onFilters(filter.id, event);
              }
            }} sx={{ width: '100% !important' }} localeText={{ start: 'Start After', end: 'Start Before' }} />
          );
        }
        return (
          <Grid
            item
            key={filter.id}
            xs={filter?.sizing?.xs || toolbarConfig?.xs || 12}
            sm={filter?.sizing?.sm || toolbarConfig?.sm || 12}
            md={filter?.sizing?.md || toolbarConfig?.md || 6}
            lg={filter?.sizing?.lg || toolbarConfig?.lg || 4}
          >
            {render}
          </Grid>
        );
      })}
    </Grid>
  );
}
