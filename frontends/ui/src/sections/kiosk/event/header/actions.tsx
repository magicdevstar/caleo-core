import { useEffect } from 'react';
import { ApolloQueryResult, useQuery } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// components
import FormProvider, {
  RHFAutocomplete,
} from 'src/components/hook-form';
import Iconify from 'src/components/iconify';
// types
import { GET_DIVISIONS } from 'src/api/division';
import { ShiftData } from 'src/api/shifts';
import { useBoolean } from 'src/hooks/use-boolean';
import KioskOpenDialog from 'src/components/custom-dialog/kiosk-dialog';

interface IProps {
  eventId: string;
  setFilters: (filters: IActions) => void;
  refetch: () => Promise<ApolloQueryResult<ShiftData>>;
};
export interface IActions {
  divisionIds: string[];
}

export const defaultFilterValues = {
  divisions: [],
};
const schema = Yup.object().shape({
  divisions: Yup.array(),
});

export default function Actions({
  eventId,
  refetch,
  setFilters,
}: IProps) {
  const kioskConfirm = useBoolean();
  const { data: divisionData } = useQuery(GET_DIVISIONS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
      }
    },
  });
  const divisions = divisionData?.divisions?.items || [];

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultFilterValues,
  });
  const { watch } = methods;

  useEffect(() => {
    const { unsubscribe } = watch((value) => {
      setFilters({
        divisionIds: value.divisions?.map((division) => division.id) || [],
      });
    });
    return () => unsubscribe();
  }, [setFilters, watch])

  return (
    <FormProvider methods={methods} >
      <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
        <RHFAutocomplete
          name="divisions"
          placeholder="Filter by division"
          multiple
          disableCloseOnSelect
          options={(divisions || [])}
          sx={{ minWidth: 200 }}
          getOptionLabel={(division: any) => division?.name}
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

        <IconButton size='large' onClick={() => refetch()}>
          <Iconify icon="ic:baseline-refresh" />
        </IconButton>

        <Tooltip title="Open Kiosk View">
          <IconButton size='large' onClick={() => kioskConfirm.onTrue()}>
            <Iconify icon="material-symbols:moved-location" />
          </IconButton>
        </Tooltip>
      </Box>

      <KioskOpenDialog kioskConfirm={kioskConfirm} eventId={eventId} />
    </FormProvider>
  );
}
