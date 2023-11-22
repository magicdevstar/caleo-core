import { memo, useEffect, useState } from "react";
// mui
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
// components
import Iconify from "src/components/iconify";
// hooks
import useDebounceText from "src/hooks/use-debounce-text";
// types
import { Filter } from "../table-config";

const icon = <Iconify color="info" icon="mdi:checkbox-blank-outline" width={32} />
const checkedIcon = <Iconify color="info" icon="mdi:checkbox-outline" width={32} />

const AutoCompleteFilter = memo(({
  filter,
  onFilters,
}: {
  filter: Filter;
  onFilters: (id: string, value: any) => any;
}) => {
  const [options, setOptions] = useState<any[]>([]);

  const {
    text,
    setText,
    debouncedText,
  } = useDebounceText({ ms: 500 });

  useEffect(() => {
    if(!filter.fetchOptions) {
      setOptions([]);
    }
    const getOptions = async () => {
      const opts = await filter.fetchOptions!(debouncedText);
      setOptions(opts);
    };
    getOptions();
  }, [filter.fetchOptions, debouncedText]);

  let renderValue: any = (
    <Autocomplete
      options={options}
      fullWidth
      value={filter.value}
      onInputChange={(event, newInputValue) => {
        console.log(newInputValue);
      }}
      getOptionLabel={(option: any) => option.label}
      onChange={(_, value) => {
        // onFilters(filter.id, value);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={filter.autoComplete?.inputLabel || "Type to select"}
          placeholder={filter?.autoComplete?.inputPlaceholder || "Search..."}
        />
      )}
    />
  )

  if (filter?.autoComplete?.multiSelect) {
    renderValue = (
      <Autocomplete
        multiple
        disableCloseOnSelect
        fullWidth
        options={options}
        value={filter.value || []}
        getOptionLabel={(option: any) => option.label}
        inputValue={text}
        onInputChange={(_event, newInputValue, reason) => {
          if (reason === 'reset') {
            return;   
          }
          setText(newInputValue);
        }}
        onChange={(_, value) => {
          onFilters(filter.id, value);
        }}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.label}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={filter.autoComplete?.inputLabel || "Type to select"}
            placeholder={filter?.autoComplete?.inputPlaceholder || "Search..."}
          />
        )}
      />
    );
  }

  return renderValue;
});

export default AutoCompleteFilter;
