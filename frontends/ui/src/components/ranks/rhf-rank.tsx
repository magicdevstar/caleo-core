import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { RHFAutocomplete } from 'src/components/hook-form';
import { useQuery } from '@apollo/client';
import { GET_RANKS, GET_RANK_GROUPS } from 'src/api/rank';
import { Rank, RankGroup } from 'src/__generated__/resolvers-types';
import { useFeatures } from 'src/hooks/use-features';

type RHFRankAutocompleteProps = {
  name: string;
  setValue: (name: 'ranks', value: any) => void;
  disabled?: boolean;
  isComplete?: boolean;
};

export default function RHFRankAutocomplete({
  name,
  setValue,
  disabled = false,
  isComplete = false,
}: RHFRankAutocompleteProps) {
  const { rankGrouping } = useFeatures();
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

  // Fetch rank groups
  const { data: rankGroupData, loading: rankGroupLoading } = useQuery(GET_RANK_GROUPS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    skip: !rankGrouping,
    variables: {
      input: {
        limit: 1000,
      },
    },
  });

  const ranks: Rank[] = rankData?.ranks?.items || [];
  const rankGroups: RankGroup[] = rankGroupData?.rankGroups?.items || [];

  // Handle rank group chip click
  const handleRankGroupClick = (rankGroup: RankGroup) => {
    const groupRanks = rankGroup.ranks || [];
    setValue('ranks', groupRanks);
  };

  return (
    <Stack spacing={1}>
      {/* Ranks Autocomplete */}
      <RHFAutocomplete
        name={name}
        placeholder="Open to Ranks"
        multiple
        disableCloseOnSelect
        disabled={disabled || isComplete}
        helperText="Enter the ranks that are allowed to work this assignment"
        options={ranks}
        getOptionLabel={(rank: any) => rank?.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option, { selected }) => (
          <li {...props} key={option?.id}>
            <Checkbox style={{ marginRight: 8 }} checked={selected} />
            {option?.name}
          </li>
        )}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option?.id}
              label={option?.name}
              size="small"
              color="info"
              variant="soft"
            />
          ))
        }
      />

      {rankGrouping && !rankGroupLoading && rankGroups.length > 0 && (
        <Box ml={1}>
          {/* Rank Groups */}
          <Typography variant="subtitle2">Select Rank Group</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Clicking on a rank group will automatically select all ranks associated with that group.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {rankGroups.map((rankGroup) => (
              <Chip
                key={rankGroup.id}
                label={rankGroup.name}
                onClick={() => handleRankGroupClick(rankGroup)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}