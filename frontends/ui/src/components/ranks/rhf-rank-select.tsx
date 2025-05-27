import { RHFSelect } from 'src/components/hook-form';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useQuery } from '@apollo/client';
import { GET_RANKS } from 'src/api/rank';
import { Rank } from 'src/__generated__/resolvers-types';

type RHFRankSelectProps = {
  name: string;
  label?: string;
  disabled?: boolean;
  isComplete?: boolean;
};

export default function RHFRankSelect({
  name,
  label = 'Select a Ranks',
  disabled = false,
  isComplete = false,
}: RHFRankSelectProps) {
  // Fetch ranks
  const { data: rankData } = useQuery(GET_RANKS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        active: true,
      },
    },
  });

  const ranks: Rank[] = rankData?.ranks?.items || [];

  return (
    <Stack spacing={1}>
      {/* Ranks Select */}
      <RHFSelect
        name={name}
        label={label}
        sx={{ textAlign: 'left' }}
        placeholder={label}
        disabled={disabled || isComplete}
        SelectProps={{
          renderValue: (selected: unknown) => selected ? (selected as Rank).name : '',
        }}
      >
        {ranks.map((rank) => (
          <MenuItem key={rank.id} value={rank as any}>
            {rank.name}
          </MenuItem>
        ))}
      </RHFSelect>
    </Stack>
  );
}