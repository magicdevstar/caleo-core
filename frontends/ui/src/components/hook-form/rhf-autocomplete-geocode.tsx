import { useState, useCallback, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { debounce } from 'lodash';
// @mui
import TextField from '@mui/material/TextField';
import { InputLabelProps } from '@mui/material/InputLabel';
import Autocomplete, { AutocompleteProps } from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { MAPBOX_API } from 'src/config-global';

// ----------------------------------------------------------------------

export interface GeocodeResult {
  id: string;
  place_name: string;
  place_name_en: string;
  text: string;
  text_en: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    text: string;
    text_en: string;
  }>;
  properties?: {
    address?: string;
  };
}

interface Props
  extends Omit<
    AutocompleteProps<GeocodeResult, false, false, false>,
    'options' | 'renderInput' | 'loading' | 'onInputChange'
  > {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  inputLabelProps?: Partial<InputLabelProps> | undefined;
  country?: string; // Optional country filter (e.g., 'us', 'ca')
  types?: string; // Optional type filter (e.g., 'address', 'poi', 'place')
  proximity?: [number, number]; // Optional proximity bias [longitude, latitude]
  language?: string; // Optional language code (e.g., 'en', 'es')
}

export default function RHFAutocompleteGeocode({
  name,
  label,
  placeholder,
  helperText,
  inputLabelProps = {},
  country,
  types,
  proximity,
  language = 'en',
  ...other
}: Props) {
  const { control } = useFormContext();
  const [options, setOptions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [hasFocused, setHasFocused] = useState(false);

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (searchText: string) => {
      if (!hasFocused || !searchText || searchText.length < 3) {
        setOptions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams({
          access_token: MAPBOX_API!,
          limit: '5',
          language,
        });

        if (country) {
          params.append('country', country);
        }

        if (types) {
          params.append('types', types);
        }

        if (proximity) {
          params.append('proximity', `${proximity[0]},${proximity[1]}`);
        }

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            searchText
          )}.json?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();
        setOptions(data.features || []);
      } catch (error) {
        console.error('Geocoding search error:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250),
    [country, types, proximity, language, hasFocused]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.SyntheticEvent, value: string) => {
      setInputValue(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setHasFocused(true);
  }, []);

  // Cleanup debounced function on unmount
  useEffect(() => () => {
      debouncedSearch.cancel();
  }, [debouncedSearch]);

  let noOptionsText = 'No addresses found';
  if (!hasFocused) {
    noOptionsText = 'Click to search addresses';
  } else if (inputValue.length < 3) {
    noOptionsText = 'Type at least 3 characters';
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          options={options}
          loading={loading}
          value={field.value || null}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={(event, newValue: GeocodeResult | null) => {
            field.onChange(newValue);
            if (newValue) {
              setInputValue(newValue.place_name_en);
            }
          }}
          getOptionLabel={(option: GeocodeResult) => option.place_name_en || ''}
          isOptionEqualToValue={(option: GeocodeResult, value: GeocodeResult) =>
            option.id === value.id
          }
          filterOptions={(x) => x} // Disable built-in filtering since we're using API search
          noOptionsText={noOptionsText}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder={placeholder}
              error={!!error}
              helperText={error ? error?.message : helperText}
              onFocus={handleInputFocus}
              InputLabelProps={{ ...(params?.InputLabelProps || {}), ...inputLabelProps }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option: GeocodeResult) => (
            <li {...props} key={option.id}>
              <div>
                <div style={{ fontWeight: 500 }}>{option.text}</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {option.place_name_en}
                </div>
              </div>
            </li>
          )}
          {...other}
        />
      )}
    />
  );
}
