import { Controller, useFormContext } from "react-hook-form";
import { Theme, SxProps } from '@mui/material/styles';
import VehicleCategoriesSelect from "../vehicle-categories/vehicle-categories-select";

interface Props {
  /** the field name in your form data */
  name: string;
  /** optional label */
  label?: string;
  /** show helper/error text */
  helperText?: string;
  sx?: SxProps<Theme>;
}

export const RHFVehicleCategoriesSelect= ({
  name,
  label,
  helperText,
  sx,
}: Props) => {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { value, onChange },
        fieldState: { error },
      }) => (
        <VehicleCategoriesSelect
          value={value}
          onChange={onChange}
          label={label}
          sx={sx}
          helperText={error?.message || helperText}
        />
      )}
    />
  )
};