import { useMemo, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import { InputLabelProps } from "@mui/material/InputLabel";
import { DocumentNode, useQuery } from "@apollo/client";
import { useDebounce } from "react-use";
import RHFAutocomplete from "./rhf-autocomplete";

export default function RHFGQLSearchAutocomplete({
  name,
  label,
  hideBeforeTyping = false,
  placeholder,
  disabled,
  helperText,
  query,
  responseKey,
  filters = {},
  inputLabelProps = {},
}: {
  label: string;
  helperText?: string;
  placeholder?: string;
  hideBeforeTyping?: boolean;
  name: string;
  disabled?: boolean;
  loading?: boolean;
  query: DocumentNode;
  responseKey: string;
  inputLabelProps?: Partial<InputLabelProps> | undefined;
  filters?: Record<string, any>;
}) {
  const [search, setSearch] = useState('');
  const [queryText, setQueryText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const open = useMemo(() => isFocused && (!hideBeforeTyping || search.trim() !== ''), [isFocused, hideBeforeTyping, search]);

  useDebounce(() => {
    setQueryText(search);
  }, 500, [search, setQueryText]);

  const { data, loading } = useQuery(query, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        query: queryText,
        limit: 10,
        ...filters,
      }
    },
  });
  const items = data?.[responseKey]?.items || [];

  return (
    <RHFAutocomplete
      name={name}
      label={label}
      open={open}
      sx={{ width: '100%' }}
      placeholder={placeholder || label}
      disabled={disabled}
      loading={loading}
      inputLabelProps={inputLabelProps}
      textFieldChange={(event) => {
        setSearch((event as any).target.value);
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      helperText={helperText}
      options={items}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(u: any) => u?.name}
      renderOption={(props, option, { selected }) => (
        <li {...props} key={option?.id}>
          <Checkbox style={{ marginRight: 8 }} checked={selected} />
          {option?.name}
        </li>
      )}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option?.id}
            label={option?.name}
            size="small"
            color="info"
            variant="soft"
          />
        ))

      }
    />
  )
};
