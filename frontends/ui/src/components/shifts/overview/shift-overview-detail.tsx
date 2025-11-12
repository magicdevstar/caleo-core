import { useMemo } from 'react';
// @mui
import Typography from '@mui/material/Typography';
import Grid, { GridSize } from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
// components
import Label, { LabelColor, LabelVariant } from 'src/components/label';

interface Props {
  label: string;
  value?: any | any[];
  tag?: boolean;
  tagColor?: LabelColor;
  tagVariant?: LabelVariant;
  emptyValue?: string;
  fullRow?: boolean;
  children?: React.ReactNode;
  onClick?: (...args: any[]) => void;
  xs?: boolean | GridSize | undefined;
  sm?: boolean | GridSize | undefined;
  md?: boolean | GridSize | undefined;
  xl?: boolean | GridSize | undefined;
  lg?: boolean | GridSize | undefined;
};

export default function ShiftOverviewDetail({
  label,
  value,
  tag,
  tagColor = 'default',
  tagVariant = 'soft',
  emptyValue = 'N/A',
  fullRow,
  children,
  onClick,
  ...props
}: Props) {
  const renderValue = useMemo(() => {
    // children automatically override any value props
    if (children) {
      return children;
    }

    // normalize array values
    let normalizedValue = value;
    if (Array.isArray(value)) {
      normalizedValue = value.filter(Boolean)
      // convert empty normalized array values into null
      if (!normalizedValue.length) {
        normalizedValue = null;
      }
    }

    // tag label values
    if (tag) {
      if (Array.isArray(normalizedValue)) {
        return (
          // multiple tag values
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {normalizedValue.map((v: any) => (
              <Label key={v} color={tagColor} variant={tagVariant} sx={{ whiteSpace: 'break-spaces', lineHeight: 1.5, height: 'auto' }}>
                {v}
              </Label>
            ))}
          </Stack>
        );
      }
      // single tag value
      return normalizedValue ? (
        <Label color={tagColor} variant={tagVariant} sx={{ whiteSpace: 'break-spaces', lineHeight: 1.5, height: 'auto', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
          {normalizedValue}
        </Label>
      ) : (
        <Label color="default" sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>{emptyValue}</Label>
      );
    }

    // regular values
    if (Array.isArray(normalizedValue)) {
      // normalize multiple regular values
      normalizedValue = normalizedValue.join(', ');
    }
    return (
      <Typography variant="body2" sx={{ ml: 0.1 }}>
        {normalizedValue || emptyValue}
      </Typography>
    );
  }, [value, tag, tagColor, tagVariant, emptyValue, children, onClick]);

  return (
    <Grid
      item
      xs={fullRow ? 12 : 6}
      md={fullRow ? 12 : 4}
      xl={fullRow ? 12 : 3}
      sx={{ mb: 1 }}
      {...props}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.4 }}>
        {label}
      </Typography>
      {renderValue}
    </Grid>
  );
}
