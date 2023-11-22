// @mui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack, { StackProps } from '@mui/material/Stack';
// components
import Iconify from 'src/components/iconify';
// types
import { Filter } from '../table-config';

// ----------------------------------------------------------------------

type Props = StackProps & {
  filters: Filter[];
  onFilters: (id: string, value: any) => any;
  results: number;
  onResetFilters: VoidFunction;
};

export default function TableFiltersResult({ filters, onFilters, results, onResetFilters, ...other}: Props) {
  return (
    <Stack spacing={1.5} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {
          filters
            .filter((filter) => (filter.type === 'select' || filter.type === 'autocomplete') && (filter.value || [])?.length)
            .map((filter) => (
              <Block key={filter.id} label={`${filter.label}:`}>
                {filter.value.map((item: any) => {
                  let label = item;
                  if (filter.type === 'select' && filter.calculatedOptions) {
                    label = filter.calculatedOptions.find(({ value }) => value === item)?.label || item;
                  }
                  if (filter.type === 'autocomplete') {
                    // eslint-disable-next-line prefer-destructuring
                    label = item.label;
                  }
                  return (
                    <Chip
                      key={item}
                      label={label}
                      size="small"
                      onDelete={() => onFilters(filter.id, filter.value.filter((value: any) => value !== item))}
                    />
                  )
                })}
              </Block>
            ))
        }

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

type BlockProps = StackProps & {
  label: string;
};

function Block({ label, children, sx, ...other }: BlockProps) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
        ...sx,
      }}
      {...other}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}
