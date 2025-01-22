import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { TextFieldProps } from '@mui/material/TextField';
import { DateRangePicker, DateRangePickerProps, SingleInputDateRangeField } from '@mui/x-date-pickers-pro';

type RHFDatePickerProps = DateRangePickerProps<any> & {
  name: string;
  helperText?: string;
  textFieldProps?: TextFieldProps;
};

export default function RHFDateRangePicker({
  name,
  helperText,
  textFieldProps,
  ...other
}: RHFDatePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, ref, ...RHFProps }, fieldState: { error } }) => (
        <DateRangePicker
          inputRef={ref}
          onChange={onChange}
          slots={{
            field: SingleInputDateRangeField,
          }}
          slotProps={{
            fieldSeparator: {
              content: 'to',
            },
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
