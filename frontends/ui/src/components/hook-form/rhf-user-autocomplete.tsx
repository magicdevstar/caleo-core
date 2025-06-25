import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import { useQuery } from "@apollo/client";
import { GET_USERS_SLIM } from "src/api/user";
import { useState } from "react";
import { useDebounce } from "react-use";
import { MemberStatus } from "src/__generated__/resolvers-types";
import RHFAutocomplete from "./rhf-autocomplete";

export default function RHFUserAutocomplete({
  name,
  label,
  disabled,
  helperText,
}: {
  label: string;
  helperText?: string;
  name: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [userSearch, setUserSearch] = useState('');
  const [queryText, setQueryText] = useState('');

  useDebounce(() => {
    setQueryText(userSearch);
  }, 500, [userSearch, setQueryText]);

  const { data: usersData, loading: loadingUser } = useQuery(GET_USERS_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        query: queryText,
        limit: 10,
        statuses: [MemberStatus.Active],
      }
    },
  });
  const users = usersData?.users?.items || [];

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
      options={users}
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
