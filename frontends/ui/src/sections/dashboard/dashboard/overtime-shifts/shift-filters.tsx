import { useMemo } from 'react';
import { Dayjs } from 'dayjs';
// @mui
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { DateRange, DateRangePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro';
// types
import { FrontendUser } from 'src/api/user';
import { MemberSkill, SkillStatus } from 'src/__generated__/resolvers-types';

export type ShiftFilterValues = {
  range: [Dayjs | null, Dayjs | null];
  skillIds: string[];
};

type ShiftFiltersProps = {
  filters: ShiftFilterValues;
  onFilters: (name: string, value: any) => void;
  user: FrontendUser;
};

export default function ShiftFilters({ filters, onFilters, user }: ShiftFiltersProps) {
  const memberSkills = useMemo(
    () => (user?.member?.memberSkills || []).filter((s) => s?.status === SkillStatus.Approved),
    [user]
  ) as MemberSkill[];

  return (
    <Grid
      container
      spacing={2}
      sx={{ width: '100%', margin: 0, paddingRight: '15px', marginBottom: '15px' }}
    >
      <Grid item xs={12} md={4}>
        <DateRangePicker
          label="Date Range"
          calendars={1}
          timezone={user?.member?.org?.timezone}
          value={filters.range}
          slots={{
            field: SingleInputDateRangeField,
          }}
          localeText={{ start: 'Start After', end: 'Start before' }}
          sx={{ width: '100% !important' }}
          onChange={(event: DateRange<Dayjs>) => {
            if (event[0] && event[1]) {
              onFilters('range', event);
            }
          }}
        />
      </Grid>
      <Grid item xs={12} md={8}>
        <FormControl id="skillIds" fullWidth>
          <InputLabel>Skills</InputLabel>
          <Select
            multiple
            value={filters?.skillIds || []}
            input={<OutlinedInput label="Skills" />}
            renderValue={(selected) =>
              selected
                .map(
                  (value) =>
                    memberSkills.find((memberSkill) => memberSkill?.skillId === value)?.skill
                      ?.name || value
                )
                .join(', ')
            }
            onChange={(event) => {
              const value =
                typeof event.target.value === 'string'
                  ? event.target.value.split(',')
                  : event.target.value;
              onFilters('skillIds', value);
            }}
          >
            {memberSkills.map((memberSkill) => (
              <MenuItem key={memberSkill.skillId} value={memberSkill.skillId}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={!!filters?.skillIds?.includes(memberSkill.skillId)}
                />
                {memberSkill?.skill?.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}
