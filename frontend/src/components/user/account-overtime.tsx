import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useDebounce } from 'react-use';
import omit from 'omit-deep';
// lodash
import capitalize from 'lodash/capitalize';
// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
// components
import { FrontendUser, GET_USER, GET_USERS, UPDATE_USER } from 'src/api/user';
import { DayAvailability, UserAvailability } from 'src/__generated__/resolvers-types';
import AccountTimePicker from './overtime/time-picker';

// ----------------------------------------------------------------------

const OVERTIME = [
  {
    dayOfWeek: 'monday',
    caption: 'Overtime availability for mondays',
  },
  {
    dayOfWeek: 'tuesday',
    caption: 'Overtime availability for tuesdays',
  },
  {
    dayOfWeek: 'wednesday',
    caption: 'Overtime availability for wednesdays',
  },
  {
    dayOfWeek: 'thursday',
    caption: 'Overtime availability for thursdays',
  },
  {
    dayOfWeek: 'friday',
    caption: 'Overtime availability for fridays',
  },
  {
    dayOfWeek: 'saturday',
    caption: 'Overtime availability for saturdays',
  },
  {
    dayOfWeek: 'sunday',
    caption: 'Overtime availability for sundays',
  },
];

// ----------------------------------------------------------------------

const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

export default function AccountOvertime({
  user
} : {
  user: FrontendUser
}) {
  const [updateUser] = useMutation(UPDATE_USER, {
    refetchQueries: [GET_USER, GET_USERS],
  });
  const [maxShifts, setMaxShifts] = useState(user?.member?.maxShifts || 6);
  const [modifiedAvailability, setModifiedAvailability] = useState(omit(clone(user.member.availability), ['__typename']) as UserAvailability);

  useDebounce(() => {
    if (JSON.stringify(user) !== JSON.stringify(modifiedAvailability)) {
      updateUser({
        variables: {
          input: {
            id: user.id,
            cognitoId: user.cognitoId,
            firstName: user.firstName,
            lastName: user.lastName,
            member: {
              orgId: user.member.orgId,
              pNumber: user.member.pNumber,
              maxShifts,
              availability: modifiedAvailability,
            },
          },
        }
      });
    }
  }, 1000, [user, modifiedAvailability, updateUser, maxShifts]);

  return (
    <Stack component={Card} spacing={3} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <ListItemText
            primary="Max Shifts"
            secondary="The maximum number of overtime shifts you are willing to work per week"
            primaryTypographyProps={{ typography: 'h6', mb: 0.5 }}
            secondaryTypographyProps={{ component: 'span' }}
          />
        </Grid>
        <Grid xs={12} md={8}>
          <Stack spacing={1} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.neutral' }}>
            <TextField fullWidth type="number" value={maxShifts} onChange={(event) => setMaxShifts(parseInt(event.target.value, 10))} />
          </Stack>
        </Grid>
      </Grid>
      {OVERTIME.map((overtime) => (
        <Grid key={overtime.dayOfWeek} container spacing={3}>
          <Grid xs={12} md={4}>
            <ListItemText
              primary={capitalize(overtime.dayOfWeek)}
              secondary={overtime.caption}
              primaryTypographyProps={{ typography: 'h6', mb: 0.5 }}
              secondaryTypographyProps={{ component: 'span' }}
            />
          </Grid>

          <Grid xs={12} md={8}>
            <Stack spacing={1} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.neutral' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={(modifiedAvailability[overtime.dayOfWeek as keyof UserAvailability] as DayAvailability).available}
                    onChange={(event, checked) => {
                      setModifiedAvailability((current: UserAvailability) => ({
                        ...current,
                        [overtime.dayOfWeek]: {
                          ...current[overtime.dayOfWeek as keyof UserAvailability] as DayAvailability,
                          available: checked,
                        },
                      }))
                    }}
                  />
                }
                label="Available"
              />

              <AccountTimePicker
                times={(modifiedAvailability[overtime.dayOfWeek as keyof UserAvailability] as DayAvailability).times || []}
                setTime={({
                  key,
                  value,
                  index
                }) => {
                  setModifiedAvailability((current: UserAvailability) => {
                    const dayOfWeekValue = {
                      ...current[overtime.dayOfWeek as keyof UserAvailability] as DayAvailability
                    };
                    dayOfWeekValue.times![index] = {
                      ...dayOfWeekValue.times![index],
                      [key]: value?.toISOString(),
                    };
                    return {
                      ...current,
                      [overtime.dayOfWeek]: dayOfWeekValue,
                    };
                  })
                }}
                removeTime={(index: number) => {
                  setModifiedAvailability((current: UserAvailability) => {
                    const dayOfWeekValue = {
                      ...current[overtime.dayOfWeek as keyof UserAvailability] as DayAvailability,
                      times: [
                        ...(current[overtime.dayOfWeek as keyof UserAvailability] as DayAvailability).times || [],
                      ],
                    };
                    dayOfWeekValue.times!.splice(index, 1);
                    return {
                      ...current,
                      [overtime.dayOfWeek]: dayOfWeekValue,
                    };
                  });
                }}
                newTime={() => {
                  setModifiedAvailability((current: UserAvailability) => {
                    const dayOfWeekValue = {
                      ...current[overtime.dayOfWeek as keyof UserAvailability] as DayAvailability,
                      times: [
                        ...(current[overtime.dayOfWeek as keyof UserAvailability] as DayAvailability).times || [],
                      ]
                    };
                    if (!Array.isArray(dayOfWeekValue.times)) {
                      dayOfWeekValue.times = [];
                    }
                    dayOfWeekValue.times!.push({
                      startTime: new Date(0).toISOString(),
                      endTime: new Date(0).toISOString(),
                    });
                    return {
                      ...current,
                      [overtime.dayOfWeek]: dayOfWeekValue,
                    };
                  })
                }}
              />
            </Stack>
          </Grid>
        </Grid>
      ))}
    </Stack>
  );
}
