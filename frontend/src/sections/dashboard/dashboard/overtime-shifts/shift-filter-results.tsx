import { useCallback, useMemo } from 'react';
// @mui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack, { StackProps } from '@mui/material/Stack';
// types
import { FrontendUser } from 'src/api/user';
import { MemberSkill, SkillStatus } from 'src/__generated__/resolvers-types';
// components
import Iconify from 'src/components/iconify';
import { ShiftFilterValues } from './shift-filters';

type ShiftFilterResultsProps = StackProps & {
  filters: ShiftFilterValues;
  onFilters: (name: string, value: any) => void;
  canReset: boolean;
  onResetFilters: VoidFunction;
  results: number;
  user: FrontendUser;
};

export default function ShiftFilterResults({
  filters,
  onFilters,
  canReset,
  onResetFilters,
  results,
  user,
  ...other
}: ShiftFilterResultsProps) {
  const memberSkills = useMemo(
    () => (user?.member?.memberSkills || []).filter((s) => s?.status === SkillStatus.Approved),
    [user]
  ) as MemberSkill[];

  const handleRemoveDateRange = useCallback(() => {
    onFilters('range', [null, null]);
  }, [onFilters]);

  const handleRemoveSkills = useCallback(
    (inputValue: string) => {
      const newValue = filters.skillIds.filter((id) => id !== inputValue);
      onFilters('skillIds', newValue);
    },
    [onFilters, filters.skillIds]
  );

  return (
    <Stack spacing={1.5} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          {` result${results === 1 ? '' : 's'} found`}
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!(filters.range?.[0] && filters.range?.[1]) && (
          <Block label="Date Range:">
            <Chip
              size="small"
              label={`${filters.range[0].format('MM/DD/YY')} - ${filters.range[1].format(
                'MM/DD/YY'
              )}`}
              onDelete={handleRemoveDateRange}
            />
          </Block>
        )}

        {!!filters.skillIds?.length && (
          <Block label="Skills:">
            {filters.skillIds.map((skillId) => (
              <Chip
                key={skillId}
                label={
                  memberSkills.find((memberSkill) => memberSkill.skillId === skillId)?.skill?.name
                }
                size="small"
                onDelete={() => handleRemoveSkills(skillId)}
              />
            ))}
          </Block>
        )}

        {canReset && (
          <Button
            color="error"
            onClick={onResetFilters}
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          >
            Clear
          </Button>
        )}
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
