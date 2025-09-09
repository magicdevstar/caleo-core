import { useFormContext, Controller } from 'react-hook-form';
// @mui
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SxProps, Theme } from "@mui/material/styles";
// components
import PolygonDrawMap from './map-polygon';

// ----------------------------------------------------------------------

interface RHFMapWithPolygonProps {
  name: string;
  helperText?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export function RHFMapWithBoundingBox({
  name,
  helperText,
  disabled = false,
  sx,
}: RHFMapWithPolygonProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box>
          <PolygonDrawMap
            sx={sx}
            initialPolygon={field.value}
            disabled={disabled}
            onPolygonChange={(polygon: number[][] | null) => {
              field.onChange(polygon);
            }}
          />
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