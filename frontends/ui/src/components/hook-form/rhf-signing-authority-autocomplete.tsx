import { useState } from "react";
import { useQuery } from "@apollo/client";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import { GET_SIGNING_AUTHORITY_ASSIGNMENTS } from "src/api/assignment";
import RHFAutocomplete from "./rhf-autocomplete";

export default function RHFSigningAuthorityAutocomplete({
  eventId,
  name,
  label,
  disabled,
  helperText,
}: {
  eventId: string;
  label: string;
  helperText?: string;
  name: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [search, setSearch] = useState('');

  const { data, loading } = useQuery(GET_SIGNING_AUTHORITY_ASSIGNMENTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      eventId,
    },
  });
  const items = data?.signingAuthorityAssignments?.items || [];

  const filteredItems = items.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <RHFAutocomplete
      name={name}
      label={label}
      sx={{ width: '100%' }}
      placeholder={label}
      disabled={disabled}
      loading={loading}
      textFieldChange={(event) => {
        setSearch((event as any).target.value);
      }}
      helperText={helperText}
      options={filteredItems}
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
