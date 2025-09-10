import { useFormContext, Controller } from 'react-hook-form';
import { useCallback } from 'react';
// @mui
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SxProps, Theme } from "@mui/material/styles";
// components
import PolygonDrawMap from './map-polygon';

// ----------------------------------------------------------------------

interface RHFMapWithPolygonProps {
  name: string;
  pinName?: string; // Optional pin field name
  helperText?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export function RHFMapWithBoundingBox({
  name,
  pinName,
  helperText,
  disabled = false,
  sx,
}: RHFMapWithPolygonProps) {
  const { control } = useFormContext();

  const handlePolygonChange = useCallback((polygon: number[][] | null, onChange: (value: any) => void) => {
    onChange(polygon);
  }, []);

  const handlePinChange = useCallback((pin: [number, number] | null, onChange: (value: any) => void) => {
    onChange(pin);
  }, []);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box>
          {pinName ? (
            <Controller
              name={pinName}
              control={control}
              render={({ field: pinField }) => (
                <PolygonDrawMap
                  sx={sx}
                  initialPolygon={field.value}
                  initialPin={pinField.value}
                  disabled={disabled}
                  onPolygonChange={(polygon: number[][] | null) => {
                    handlePolygonChange(polygon, field.onChange);
                  }}
                  onPinChange={(pin: [number, number] | null) => {
                    handlePinChange(pin, pinField.onChange);
                  }}
                />
              )}
            />
          ) : (
            <PolygonDrawMap
              sx={sx}
              initialPolygon={field.value}
              disabled={disabled}
              onPolygonChange={(polygon: number[][] | null) => {
                handlePolygonChange(polygon, field.onChange);
              }}
            />
          )}
          {(error || helperText) && (
            <Typography
              variant="caption"
              color={error ? 'error' : 'text.secondary'}
              sx={{ mt: 1, display: 'block' }}
            >
              {error?.message || helperText}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}