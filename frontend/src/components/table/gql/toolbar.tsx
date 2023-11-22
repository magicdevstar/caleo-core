// @mui
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import Grid from '@mui/material/Grid';
// components
import Iconify from 'src/components/iconify';
// types
import { Filter, ToolbarConfig } from '../table-config';
import SelectFilter from './select-filter';
import AutoCompleteFilter from './autocomplte-filter';

// ----------------------------------------------------------------------

type Props = {
  toolbarConfig?: ToolbarConfig;
  filters: Filter[];
  onFilters: (id: string, value: any) => any;
};

export default function TableToolbar({
  toolbarConfig,
  filters,
  onFilters,
}: Props) {
  return (
    <Grid container spacing={2} sx={{ width: '100%', margin: 0, paddingRight: '15px', marginBottom: '15px' }}>
      {filters.map((filter) => {
        let render = (<TextField
          fullWidth
          value={filter.value}
          onChange={(event) => onFilters(filter.id, event.target.value)}
          placeholder={`${filter.label}...`}
          sx={{
            minWidth: {
              xs: '100%',
              md: 300,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />);
        if (filter.type === 'select') {
          render = (<SelectFilter filter={filter} onFilters={onFilters} />);
        }
        if (filter.type === 'autocomplete') {
          render = (<AutoCompleteFilter filter={filter} onFilters={onFilters} />);
        }
        if (filter.type === 'dateRange') {
          render = (
            <DateRangePicker onChange={(event) => {
              if (event[0] && event[1]) {
                onFilters(filter.id, event);
              }
            }} sx={{ width: '100% !important' }} localeText={{ start: 'Start After', end: 'Start Before' }} />
          );
        }
        return (
          <Grid item key={filter.id} xs={toolbarConfig?.xs || 12} sm={toolbarConfig?.sm || 12} md={toolbarConfig?.md || 6} lg={toolbarConfig?.lg || 4}>
            {render}
          </Grid>
        );
      })}
    </Grid>
  );
}
