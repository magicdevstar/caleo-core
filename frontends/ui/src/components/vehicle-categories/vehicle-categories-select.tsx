import React from "react";
import { useQuery } from "@apollo/client";
import { Theme, SxProps } from '@mui/material/styles';
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
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
  value,
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

  return (
    <div>
      <Autocomplete
        options={data?.vehicleCategories?.items || []}
        getOptionLabel={(option: any) => option.name}
        value={data?.vehicleCategories?.items.find((cat: any) => cat.id === value) || null}
        onChange={(event, newValue) => onChange(newValue?.id || "")}
        loading={loading}
        sx={sx}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={!!error}
            helperText={error ? "Error loading categories" : helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </div>
  );
};

export default VehicleCategoriesSelect;
