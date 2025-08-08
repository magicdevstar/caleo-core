import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { DesktopTimePicker, TimePickerProps } from '@mui/x-date-pickers';
import { TextFieldProps } from '@mui/material/TextField';
import dayjs from 'dayjs';

type RHFTimePickerProps = TimePickerProps<any> & {
  name: string;
  helperText?: string;
  textFieldProps?: TextFieldProps;
  clearable?: boolean;
};

export default function RHFTimePicker({
  name,
  helperText,
  textFieldProps,
  clearable,
  ...other
}: RHFTimePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ref, ...RHFProps }, fieldState: { error } }) => (
        <DesktopTimePicker
          onChange={(newValue) => newValue ? onChange(newValue.toDate()) : onChange(null)}
          value={value == null ? null : dayjs(value)} // keeps field empty if value is null or undefined
          inputRef={ref}
          slotProps={{
            field: { clearable },
            textField: {
              ...RHFProps,
              fullWidth: true,
              helperText: error ? error?.message : helperText,
              error: !!error,
              ...textFieldProps,
            },
          }}
          {...other}
        />
      )}
    />
  );
}
