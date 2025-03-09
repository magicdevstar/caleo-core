import { useEffect, useState } from "react";
// mui
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
// types
import { Filter } from "../table-config";

export default function SelectFilter({
  filter,
  onFilters,
}: {
  filter: Filter;
  onFilters: (id: string, value: any) => any;
}) {
  const [options, setOptions] = useState<any[]>(filter.calculatedOptions || []);

  useEffect(() => {
    if (filter.fetchOptions) {
      (async () => {
        const opts = await filter.fetchOptions!();
        setOptions(opts || []);
      })();
    }
  }, [filter.fetchOptions]);

  let renderSelect = (
    <Select
      multiple
      value={filter?.value || []}
      onChange={(event) => {
        const value = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
        onFilters(filter.id, value);
      }}
      input={<OutlinedInput label={filter.label} />}
      renderValue={(selected) => selected.map((value: any) => options.find(({ value: v }) => v === value)?.label || value).join(', ')}
      sx={{ textTransform: 'capitalize' }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          <Checkbox
            disableRipple
            size="small"
            checked={!!filter?.value?.includes?.(option.value)}
          />
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );

  if ('multiple' in (filter.selectOptions || {}) && !filter.selectOptions?.multiple) {
    renderSelect = (
      <Select
        value={filter?.value || ''}
        label={filter.label}
        onChange={(event) => onFilters(filter.id, event.target.value)}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    );
  }

  return (
    <FormControl id={filter.id} fullWidth>
      <InputLabel>{filter.label}</InputLabel>

      {renderSelect}
    </FormControl>
  );
};
