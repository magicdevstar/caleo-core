import { memo, useEffect, useRef, useState } from 'react';
// mui
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
// hooks
import useDebounceText from 'src/hooks/use-debounce-text';
// types
import { Filter } from '../table-config';

const AutoCompleteFilter = memo(
  ({ filter, onFilters }: { filter: Filter; onFilters: (id: string, value: any) => any }) => {
    const [options, setOptions] = useState<any[]>([]);
    const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const dirtyInput = useRef(false);

    const { text, setText, debouncedText } = useDebounceText({ ms: 500 });

    useEffect(() => {
      if (!filter.fetchOptions || !dirtyInput.current) {
        setOptions([]);
      } else {
        const getOptions = async () => {
          setLoadingOptions(true);
          const opts = await filter.fetchOptions!(debouncedText);
          setOptions(opts);
          setLoadingOptions(false);
        };
        getOptions();
      }
    }, [filter.fetchOptions, debouncedText]);

    let renderValue: any = (
      <Autocomplete
        options={options}
        fullWidth
        value={filter.value}
        getOptionLabel={(option: any) => option.label}
        inputValue={text}
        loading={loadingOptions}
        loadingText={
          <>
            Loading...
            <CircularProgress color="inherit" size={14} sx={{ ml: 1.5 }} />
          </>
        }
        filterOptions={(x: any) => x}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        onInputChange={(_event, newInputValue, reason) => {
          if (!dirtyInput.current) {
            dirtyInput.current = true;
          }
          if (reason === 'reset') {
            return;
          }
          setText(newInputValue);
          if (!loadingOptions) {
            setOptions([]);
            setLoadingOptions(true);
          }
        }}
        onChange={(_, value) => {
          onFilters(filter.id, value);
        }}
        onBlur={() => {
          setText('');
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={filter.autoComplete?.inputLabel || 'Type to select'}
            placeholder={filter?.autoComplete?.inputPlaceholder || 'Search...'}
          />
        )}
      />
    );

    if (filter?.autoComplete?.multiSelect) {
      renderValue = (
        <Autocomplete
          multiple
          disableCloseOnSelect
          fullWidth
          open={open && dirtyInput.current}
          onOpen={() => {
            setOpen(true);
          }}
          onClose={() => {
            setOpen(false);
          }}
          options={options}
          value={filter.value || []}
          loading={loadingOptions}
          loadingText={
            <>
              Loading...
              <CircularProgress color="inherit" size={14} sx={{ ml: 1.5 }} />
            </>
          }
          filterOptions={(x: any) => x}
          getOptionLabel={(option: any) => option.label}
          inputValue={text || ''}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          onInputChange={(_event, newInputValue, reason) => {
            if (!dirtyInput.current) {
              dirtyInput.current = true;
            }
            if (reason === 'reset') {
              return;
            }
            setText(newInputValue);
            if (!loadingOptions) {
              setOptions([]);
              setLoadingOptions(true);
            }
          }}
          onChange={(_, value) => {
            onFilters(filter.id, value);
          }}
          onBlur={() => {
            setText('');
          }}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox style={{ marginRight: 8 }} checked={selected} />
              {option.label}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={filter.autoComplete?.inputLabel || 'Type to select'}
              placeholder={filter?.autoComplete?.inputPlaceholder || 'Search...'}
            />
          )}
        />
      );
    }

    return renderValue;
  }
);

export default AutoCompleteFilter;
