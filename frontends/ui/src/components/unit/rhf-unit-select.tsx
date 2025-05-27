import { RHFSelect } from 'src/components/hook-form';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useQuery } from '@apollo/client';
import { GET_UNITS } from 'src/api/unit';
import { Unit } from 'src/__generated__/resolvers-types';

type RHFUnitSelectProps = {
  name: string;
  label?: string;
  disabled?: boolean;
  isComplete?: boolean;
};

export default function RHFUnitSelect({
  name,
  label = 'Select a Unit',
  disabled = false,
  isComplete = false,
}: RHFUnitSelectProps) {
  // Fetch units
  const { data: unitData } = useQuery(GET_UNITS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {},
    },
  });
  const units: Unit[] = unitData?.units?.items || [];

  return (
    <Stack spacing={1}>
      {/* Unit Select */}
      <RHFSelect
        sx={{ textAlign: 'left' }}
        name={name}
        label={label}
        placeholder={label}
        disabled={disabled || isComplete}
        SelectProps={{
          renderValue: (selected: unknown) => selected ? (selected as Unit).name : '',
        }}
      >
        {units.map((unit) => (
          <MenuItem key={unit.id} value={unit as any}>
            {unit.name}
          </MenuItem>
        ))}
      </RHFSelect>
    </Stack>
  );
}
