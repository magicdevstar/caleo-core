// react-
import { useCallback, useEffect, useMemo, useState } from 'react';

// @apollo/client
import { useMutation } from '@apollo/client';

// @mui
import Stack from '@mui/system/Stack';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';

// components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { Unit } from 'src/__generated__/resolvers-types';
import { GET_UNITS, UPSERT_UNIT } from 'src/api/unit';

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
  const [unitMutation, { loading, error: newUnitError }] = useMutation(UPSERT_UNIT, {
    refetchQueries: [GET_UNITS],
  });
  const [name, setName] = useState('');
  const [overtimeCode, setOvertimeCode] = useState('');
  const [error, setError] = useState('');
  const action = useMemo(() => unit ? 'Update' : 'Create', [unit]);

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setOvertimeCode(unit.overtimeCode || '');
    } else {
      setName('');
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
