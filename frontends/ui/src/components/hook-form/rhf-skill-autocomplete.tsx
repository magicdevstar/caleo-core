import { useQuery } from "@apollo/client";
// @mui
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";

// types
import { GET_SKILL_SLIM } from "src/api/skill";

// components
import RHFAutocomplete from "./rhf-autocomplete";

interface IProps {
  name: string;
  label: string;
  helperText?: string;
  disabled?: boolean;
};

export default function RHFSkillAutocomplete({
  name,
  helperText,
  label,
  disabled = false,
}: IProps) {
  const { data } = useQuery(GET_SKILL_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
      }
    },
  });

  const skills = data?.skills?.items || [];

  return (
    <RHFAutocomplete
      name={name}
      placeholder={label}
      disabled={disabled}
      multiple
      disableCloseOnSelect
      helperText={helperText}
      options={(skills || [])}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(skill: any) => skill?.name}
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
}