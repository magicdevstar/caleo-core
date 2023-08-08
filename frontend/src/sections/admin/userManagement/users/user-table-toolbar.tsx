import { useCallback } from 'react';
// @mui
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Select, { SelectChangeEvent } from '@mui/material/Select';
// components
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
// types
import { UserTableFilterValue, UserTableFilters } from 'src/api/user';

// ----------------------------------------------------------------------

type Props = {
  filters: UserTableFilters;
  onFilters: (name: string, value: UserTableFilterValue) => void;
  //
  rankIdOptions: {
    value: string;
    label: string;
  }[];
  statusOptions: {
    value: string;
    label: string;
  }[];
  skillIdOptions: {
    value: string;
    label: string;
  }[];
  tierOptions: {
    value: string;
    label: string;
  }[];
};

export default function UserTableToolbar({
  filters,
  onFilters,
  //
  rankIdOptions,
  statusOptions,
  skillIdOptions,
  tierOptions,
}: Props) {
  const popover = usePopover();

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterActive = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      onFilters(
        'active',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  const handleFilterCert = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      onFilters(
        'cert',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  const handleFilterAdmin = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      onFilters(
        'admin',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{
          xs: 'column',
          md: 'row',
        }}
        sx={{
          p: 2.5,
          pr: { xs: 2.5, md: 1 },
        }}
      >
        {/* <FormControl
          sx={{
            flexShrink: 0,
            width: { xs: 1, md: 200 },
          }}
        >
          <InputLabel>Cert Required</InputLabel>

          <Select
            multiple
            value={filters.cert}
            onChange={handleFilterCert}
            input={<OutlinedInput label="Cert Required" />}
            renderValue={(selected) => selected.map((value) => value).join(', ')}
            sx={{ textTransform: 'capitalize' }}
          >
            {certOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={filters.cert.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

      <FormControl
          sx={{
            flexShrink: 0,
            width: { xs: 1, md: 200 },
          }}
        >
          <InputLabel>Admin Approval</InputLabel>

        <Select
            multiple
            value={filters.admin}
            onChange={handleFilterAdmin}
            input={<OutlinedInput label="Admin Approval" />}
            renderValue={(selected) => selected.map((value) => value).join(', ')}
            sx={{ textTransform: 'capitalize' }}
          >
            {adminOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={filters.admin.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          sx={{
            flexShrink: 0,
            width: { xs: 1, md: 200 },
          }}
        >
          <InputLabel>Active</InputLabel>

          <Select
            multiple
            value={filters.active}
            onChange={handleFilterActive}
            input={<OutlinedInput label="Active" />}
            renderValue={(selected) => selected.map((value) => value).join(', ')}
            sx={{ textTransform: 'capitalize' }}
          >
            {activeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={filters.active.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
 */}
        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder="Search..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>
      </Stack>
    </>
  );
}
