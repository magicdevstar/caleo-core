
import { ChangeEvent, useCallback, useEffect } from 'react';
// @mui
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
// hooks
import useDebounceText from 'src/hooks/use-debounce-text';
// components
import Iconify from 'src/components/iconify';
// types
import { Filter } from '../table-config';

export default function TextFilter({
  filter,
  onFilters,
  localSearch
}: {
  filter: Filter;
  onFilters: (id: string, value: any) => any;
  localSearch: boolean;
}) {
  const { text, setText, debouncedText } = useDebounceText({ ms: 500 });

  useEffect(() => {
    onFilters(filter.id, debouncedText);
  }, [onFilters, filter.id, debouncedText]);

  const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (localSearch) {
      onFilters(filter.id, event.target.value);
    } else {
      setText(event.target.value);
    }
  }, [localSearch, filter.id, setText, onFilters])

  return (
    <TextField
      fullWidth
      type={filter.type || 'text'}
      value={localSearch ? filter.value : text}
      onChange={handleTextChange}
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
        )
      }}
    />
  );
};
