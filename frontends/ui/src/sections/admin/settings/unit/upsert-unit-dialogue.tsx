// react-
import { useCallback, useEffect, useMemo, useState } from 'react';

// @apollo/client
import { useMutation, useQuery } from '@apollo/client';

// @mui
import Stack from '@mui/system/Stack';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';

// components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { Division, Unit } from 'src/__generated__/resolvers-types';
import { GET_UNITS, UPSERT_UNIT } from 'src/api/unit';
import { GET_DIVISIONS } from 'src/api/division';

interface InputProps {
  unit?: Unit | null;
  upsertUnit: ReturnType<any>;
  onUpsertUnit?: () => void;
}

export default function UpsertUnitDialogue({
  unit,
  upsertUnit,
  onUpsertUnit = () => {},
}: InputProps) {
  const [divisionSearchText, setDivisionSearchText] = useState('');
  const { data } = useQuery(GET_DIVISIONS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
        ...(divisionSearchText.trim() ? { query: divisionSearchText.trim() } : {}),
      }
    }
  });
  const { divisions: { items: divisions } } = data || { divisions: { items: [] } };

  const [unitMutation, { loading, error: newUnitError }] = useMutation(UPSERT_UNIT, {
    refetchQueries: [GET_UNITS],
  });
  const [name, setName] = useState('');
  const [overtimeCode, setOvertimeCode] = useState('');
  const [division, setDivision] = useState<Division | undefined>(unit?.divisions?.[0] || undefined);
  const [error, setError] = useState('');
  const action = useMemo(() => unit ? 'Update' : 'Create', [unit]);

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setOvertimeCode(unit.overtimeCode || '');
      setDivision(unit.divisions?.[0] || undefined);
    } else {
      setName('');
      setOvertimeCode('');
      setDivision(undefined);
    }
  }, [unit])

  const onSubmit = async () => {
    try {
      if (name.trim() === '') {
        const errorMessage = 'Name is required';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      await unitMutation({
        variables: {
          input: {
            id: unit?.id,
            name: name.trim(),
            divisionIds: division ? [division.id] : [],
            overtimeCode: overtimeCode.trim() || null,
            active: unit ? unit.active : true,
          },
        },
      });
      onUpsertUnit();
      upsertUnit.onFalse();
      setName('');
    } catch(e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    setName('');
    onUpsertUnit();
    upsertUnit.onFalse();
  }, [upsertUnit, setName, onUpsertUnit]);

  return (
    <ConfirmDialog
      open={upsertUnit.value}
      onClose={handleClose}
      title={`${action} Unit of assignment`}
      content={
        (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Name"
              type="text"
              autoFocus
              value={name}
              sx={{ mt: 1 }}
              onChange={(event) => {
                setName(event.target.value);
              }}
              error={!!error || !!newUnitError}
              helperText={error || newUnitError?.message}
            />
    
            <TextField
              fullWidth
              label="Overtime Code"
              type="text"
              value={overtimeCode}
              sx={{ mt: 1 }}
              onChange={(event) => {
                setOvertimeCode(event.target.value);
              }}
              error={!!error || !!newUnitError}
              helperText={error || newUnitError?.message}
            />

            <Autocomplete
              options={divisions}
              disableCloseOnSelect
              defaultValue={unit?.divisions?.[0] || undefined}
              fullWidth
              value={division}
              sx={{ mt: 2 }}
              getOptionLabel={(option: Division) => option.name}
              onChange={(_, value) => {
                setDivision(value as Division);
              }}
              renderOption={(props, option, { selected }) => (
                <li {...props} key={option?.id}>
                  <Checkbox style={{ marginRight: 8 }} checked={selected} />
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  value={divisionSearchText}
                  onChange={(event) => {
                    setDivisionSearchText(event.target.value);
                  }}
                  label="Open to division"
                  placeholder="Search for division"
                />
              )}
            />
          </Stack>
        )
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Unit
        </LoadingButton>
      }
    />
  );
};
