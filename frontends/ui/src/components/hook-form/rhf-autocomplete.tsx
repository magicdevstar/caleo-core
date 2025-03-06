import { useFormContext, Controller } from 'react-hook-form';
// @mui
import TextField from '@mui/material/TextField';
import Autocomplete, { AutocompleteProps } from '@mui/material/Autocomplete';

// ----------------------------------------------------------------------

interface Props<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
  name: string;
  label?: string;
  valueKey?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  textFieldChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

export default function RHFAutocomplete<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
>({
  name,
  label,
  placeholder,
  helperText,
  valueKey,
  textFieldChange,
  ...other
}: Omit<Props<T, Multiple, DisableClearable, FreeSolo>, 'renderInput'>) {
  const { control } = useFormContext();
  console.log(other.isOptionEqualToValue)
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          onChange={(event, newValue: any) => {
            console.log(newValue);
            if (valueKey && !other.multiple) {
              field.onChange(newValue[valueKey]) // Currently breaks with Multiple selection
            } else {
              field.onChange(newValue);
            }
          }}
          renderInput={(params: any) => (
            <TextField
              label={label}
              placeholder={placeholder}
              error={!!error}
              onChange={(...args) => {
                if (textFieldChange) {
                  textFieldChange(...args);
                }
                if (params.onChange) {
                  params.onChange(...args);
                }
              }}
              helperText={error ? error?.message : helperText}
              {...params}
            />
          )}
          {...other}
        />
      )}
    />
  );
}
