// @mui
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
// components
import Iconify from 'src/components/iconify';
// types
import { Filter } from '../table-config';

// ----------------------------------------------------------------------

type Props = {
  filters: Filter[];
  onFilters: (id: string, value: any) => any;
};

export default function TableToolbar({
  filters,
  onFilters,
}: Props) {

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
          const options = filter.fetchOptions?.() || [];
          return (
            <FormControl
              id={filter.id}
              sx={{
                flexShrink: 0,
                width: { xs: 1, md: 200 },
              }}
            >
              <InputLabel>{filter.label}</InputLabel>

              <Select
                multiple
                value={filter.value}
                onChange={(event) => {
                  const value = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
                  onFilters(filter.id, value);
                }}
                input={<OutlinedInput label={filter.label} />}
                renderValue={(selected) => selected.map((value: any) => value).join(', ')}
                sx={{ textTransform: 'capitalize' }}
              >
                {options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox
                      disableRipple
                      size="small"
                      checked={filter.value.includes(option.value)}
                    />
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
        return (
          <Stack id={filter.id} direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
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
