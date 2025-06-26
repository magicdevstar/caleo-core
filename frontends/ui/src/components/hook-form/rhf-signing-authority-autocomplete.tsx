import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import { useQuery } from "@apollo/client";
import { GET_SIGNING_AUTHORITY_USERS } from "src/api/user";
import { useState } from "react";
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
  const [userSearch, setUserSearch] = useState('');

  const { data: usersData, loading: loadingUser } = useQuery(GET_SIGNING_AUTHORITY_USERS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      eventId,
    },
  });
  const users = usersData?.signingAuthorityUsers?.items || [];

  const filteredUsers = users.filter((user: any) => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <RHFAutocomplete
      name={name}
      label={label}
      sx={{ width: '100%' }}
      placeholder={label}
      disabled={disabled}
      loading={loadingUser}
      textFieldChange={(event) => {
        setUserSearch((event as any).target.value);
      }}
      helperText={helperText}
      options={filteredUsers}
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
