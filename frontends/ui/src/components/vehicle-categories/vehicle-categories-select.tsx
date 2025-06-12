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
import { GET_VEHICLE_CATEGORIES } from "../../api/vehicleCategories";

export interface VehicleCategoriesSelectProps {
  /** currently selected category id */
  value?: string;
  /** called when user selects a category */
  onChange: (id: string) => void;
  /** optional label */
  label?: string;
  /** show helper/error text */
  helperText?: string;
  sx?: SxProps<Theme>;
}

const VehicleCategoriesSelect: React.FC<VehicleCategoriesSelectProps> = ({
  value = "",
  onChange,
  label = "Vehicle Category",
  helperText,
  sx,
}) => {
  const { data, loading, error } = useQuery(GET_VEHICLE_CATEGORIES, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: { input: { skip: 0, limit: 10000 } },
  });

  const labelId = `vehicle-categories-select-label-${React.useId()}`;
  const categories = data?.vehicleCategories?.items || [];

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
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {categories.map((category: any) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </Select>
      {(error || helperText) && (
        <FormHelperText>{error ? "Error loading categories" : helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

export default VehicleCategoriesSelect;
