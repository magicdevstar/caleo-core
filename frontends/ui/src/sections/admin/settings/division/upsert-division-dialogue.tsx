// react-
import { useCallback, useEffect, useMemo, useState } from 'react';

// @apollo/client
import { useMutation } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';

// components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { Division } from 'src/__generated__/resolvers-types';
import { GET_DIVISIONS, UPSERT_DIVISION } from 'src/api/division';

interface InputProps {
  division?: Division | null;
  upsertDivision: ReturnType<any>;
  onUpsertDivision?: () => void;
}

export default function UpsertDivisionDialogue({
  division,
  upsertDivision,
  onUpsertDivision = () => {},
}: InputProps) {
  const [divisionMutation, { loading, error: newDivisionError }] = useMutation(UPSERT_DIVISION, {
    refetchQueries: [GET_DIVISIONS],
  });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const action = useMemo(() => division ? 'Update' : 'Create', [division]);

  useEffect(() => {
    if (division) {
      setName(division.name);
    } else {
      setName('');
    }
  }, [division])

  const onSubmit = async () => {
    try {
      if (name.trim() === '') {
        const errorMessage = 'Name is required';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      await divisionMutation({
        variables: {
          input: {
            id: division?.id,
            name: name.trim(),
            active: division ? division.active : true,
          },
        },
      });
      onUpsertDivision();
      upsertDivision.onFalse();
      setName('');
    } catch(e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    setName('');
    onUpsertDivision();
    upsertDivision.onFalse();
  }, [upsertDivision, setName, onUpsertDivision]);

  return (
    <ConfirmDialog
      open={upsertDivision.value}
      onClose={handleClose}
      title={`${action} Division`}
      content={
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
          error={!!error || !!newDivisionError}
          helperText={error || newDivisionError?.message}
        />
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Division
        </LoadingButton>
      }
    />
  );
};
