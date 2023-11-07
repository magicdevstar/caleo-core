import { useFormContext, Controller } from 'react-hook-form';
import ReactPhoneInput from 'react-phone-input-material-ui';
// @mui
import TextField, { TextFieldProps } from '@mui/material/TextField';

// ----------------------------------------------------------------------

type Props = TextFieldProps & {
  name: string;
  country?: string;
  onlyCountries?: string[];
  countryCodeEditable?: boolean;
};

const PhoneInput = ReactPhoneInput as any;

export default function RHFPhoneField({ name, helperText, type, ...other }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <PhoneInput
          {...field}
          fullWidth
          placeholder=""
          type={type}
          value={type === 'number' && field.value === 0 ? '' : field.value}
          onChange={(value: string, data: any, event: any, formattedValue: any) => {
            if (type === 'number') {
              field.onChange(Number(value));
            } else {
              field.onChange(value);
            }
          }}
          error={!!error}
          helperText={error ? error?.message : helperText}
          component={TextField as any}
          {...other}
        />
      )}
    />
  );
}
