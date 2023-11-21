import dayjs from 'dayjs';
// @mui
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
// components
import Iconify from 'src/components/iconify';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// types
import { Filter } from '../table-config';
import SelectFilter from './select-filter';

// ----------------------------------------------------------------------

type Props = {
  filters: Filter[];
  onFilters: (id: string, value: any) => any;
};

export default function TableToolbar({
  filters,
  onFilters,
}: Props) {
  const { user } = useAuthContext();

  return (
    <Stack
      spacing={{ xs: 1, sm: 2 }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      useFlexGap
      flexWrap="wrap"
      direction={{
        xs: 'column',
        md: 'row',
      }}
      sx={{
        p: 2.5,
        pr: { xs: 2.5, md: 1 },
        '& .MuiStack-root': {
          width: {
            md: 'inherit',
            xs: '100%',
          },
        },
      }}
    >
      {filters.map((filter) => {
        if (filter.type === 'select') {
          return (<SelectFilter key={filter.id} filter={filter} onFilters={onFilters} />);
        }
        if (filter.type === 'dateRange') {
          return (
            <Stack key={filter.id} direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
              <DateRangePicker onChange={(event) => {
                if (event[0] && event[1]) {
                  onFilters(filter.id, event);
                }
              }} sx={{ width: '100% !important' }} maxDate={dayjs().endOf('day')} timezone={user.member.org?.timezone} localeText={{ start: 'Start After', end: 'Start Before' }} />
            </Stack>
          );
        }
        return (
          <Stack key={filter.id} direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
            <TextField
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
            />
          </Stack>
        );
      })}
    </Stack>
  );
}
