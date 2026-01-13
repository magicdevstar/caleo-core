import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { DesktopTimePicker, TimePickerProps } from '@mui/x-date-pickers';
import { TextFieldProps } from '@mui/material/TextField';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

dayjs.extend(utc);
dayjs.extend(timezone);

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
  const { user } = useAuthContext();
  const tz = user?.member?.org?.timezone || 'UTC';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ref, ...RHFProps }, fieldState: { error } }) => (
        <DesktopTimePicker
          timezone={tz}
          onChange={(newValue) => (newValue ? onChange(newValue.toDate()) : onChange(null))}
          value={value == null ? null : dayjs(value).tz(tz)} // keeps field empty if value is null or undefined
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
