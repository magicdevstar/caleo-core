import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { DatePickerProps } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextFieldProps } from '@mui/material/TextField';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

dayjs.extend(utc);
dayjs.extend(timezone);

type RHFDatePickerProps = DatePickerProps<any> & {
  name: string;
  helperText?: string;
  textFieldProps?: TextFieldProps;
};

export default function RHFDatePicker({
  name,
  helperText,
  textFieldProps,
  ...other
}: RHFDatePickerProps) {
  const { control } = useFormContext();
  const { user } = useAuthContext();
  const tz = user?.member?.org?.timezone || 'UTC';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ref, ...RHFProps }, fieldState: { error } }) => (
        <DatePicker
          timezone={tz}
          onChange={(newValue) => onChange(newValue.toDate())}
          value={value == null ? null : dayjs(value).tz(tz)} // keeps field empty if value is null or undefined
          inputRef={ref}
          slotProps={{
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
