import React from "react";
import { useQuery } from "@apollo/client";
import { Theme, SxProps } from '@mui/material/styles';
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import FormHelperText from "@mui/material/FormHelperText";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { GET_OUTSIDE_USERS } from "src/api/outsideUser";

export interface OutsideUsersSelectProps {
  /** currently selected outside user id */
  value?: string;
  /** called when user selects a outside user */
  onChange: (id: string) => void;
  /** optional label */
  label?: string;
  /** show helper/error text */
  helperText?: string;
  sx?: SxProps<Theme>;
}

const OutsideUsersSelect: React.FC<OutsideUsersSelectProps> = ({
  value = "",
  onChange,
  label = "Reviewer Search",
  helperText,
  sx,
}) => {
  const { data, loading, error } = useQuery(GET_OUTSIDE_USERS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: { input: { skip: 0, limit: 10000 } },
  });

  const labelId = `outside-users-select-label-${React.useId()}`;
  const items = data?.outsideUsers?.items || [];

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    onChange(event.target.value as string);
  };

  return (
    <FormControl fullWidth error={!!error} sx={sx}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        value={value}
        label={label}
        onChange={handleChange as any}
        disabled={loading}
        endAdornment={loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
            <CircularProgress color="inherit" size={20} />
          </Box>
        ) : null}
      >
        {items.map((item: any) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}: {item.email}
          </MenuItem>
        ))}
      </Select>
      {(error || helperText) && (
        <FormHelperText>{error ? "Error loading select" : helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

export default OutsideUsersSelect;
