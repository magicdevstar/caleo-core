import { useState } from "react";
import { useDebounce } from "react-use";
// @mui
import { useQuery } from "@apollo/client";
import LoadingButton from "@mui/lab/LoadingButton";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Typography from '@mui/material/Typography';
// components
import { ConfirmDialog } from "src/components/custom-dialog";
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// Types
import { GET_USERS_SLIM } from "src/api/user";
import { MemberStatus, User } from "src/__generated__/resolvers-types";
import { useWeeklyShifts } from "src/hooks/use-weekly-shift-count";

export const AssignShiftModal = ({
  shiftId,
  shiftStartTime,
  orgMaxShifts,
  existingUserIds,
  assignConfirm,
  assignLoading,
  assignShift,
}: {
  shiftId?: string | null;
  shiftStartTime?: string;
  orgMaxShifts?: number;
  existingUserIds: string[];
  assignConfirm: ReturnType<typeof useBoolean>;
  assignLoading: boolean;
  assignShift: (userId?: string) => Promise<void>;
}) => {
  const [value, setValue] = useState<User | undefined>();
  const [userSearch, setUserSearch] = useState('');
  const [queryText, setQueryText] = useState('');

  useDebounce(() => {
    setQueryText(userSearch);
  }, 500, [userSearch, setQueryText]);

  const { weeklyShifts, loading: loadingWeeklyShifts, error: weeklyShiftsError } = useWeeklyShifts({
    userId: value?.id,
    date: shiftStartTime,
  });

  const { data } = useQuery(GET_USERS_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        excludeIds: existingUserIds,
        query: queryText,
        statuses: [MemberStatus.Active],
      }
    },
    skip: !shiftId || shiftId === '',
  });

  const users = data?.users?.items || [];

  return (
    <ConfirmDialog
      open={assignConfirm.value}
      onClose={assignConfirm.onFalse}
      title="Assign shift slot"
      content={(
        <>
          <Autocomplete
            sx={{ mt: 1 }}
            options={users}
            onChange={(_event, newValue: any) => {
              setValue(newValue);
            }}
            getOptionLabel={(user: any) => user.name}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                label="User Search"
                helperText="Type a users first name and last name to search"
                onChange={(e) => setUserSearch(e.target.value)}
                {...params}
              />
            )}
          />
          {
            value &&
            ((weeklyShifts?.length || 0) >= (value?.member?.maxShifts || orgMaxShifts || Number.POSITIVE_INFINITY)) &&
            !weeklyShiftsError &&
            !loadingWeeklyShifts && (
              <Typography variant='body2' color="warning.main" sx={{ mt: 2, ml: 1 }}>
                { `Warning: ${value?.name} has reached their max shift limit for this shift week.` }
              </Typography>
            )
          }
          {weeklyShiftsError && !loadingWeeklyShifts && (
            <Typography variant='body2' color="error.main" sx={{ mt: 2, ml: 1 }}>
              { `Error retrieving user weekly shift count. User's shift count for this shift week is unknown. Proceed with caution.` }
            </Typography>
          )}
        </>
      )}
      action={
        <LoadingButton
          disabled={!value}
          variant="contained"
          color="primary"
          onClick={() => assignShift(value?.id)}
          loading={assignLoading || loadingWeeklyShifts}
        >
          Assign
        </LoadingButton>
      }
    />
  )
};
