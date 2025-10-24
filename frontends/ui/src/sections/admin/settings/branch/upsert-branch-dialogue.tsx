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
import { Branch } from 'src/__generated__/resolvers-types';
import { GET_BRANCHES, UPSERT_BRANCH } from 'src/api/branch';
import { UseBooleanReturnType } from 'src/hooks/use-boolean';

interface InputProps {
  upsert: UseBooleanReturnType<Branch>;
}

export default function UpsertDialogue({
  upsert,
}: InputProps) {
  const [upsertMutation, { loading, error: mutationErr }] = useMutation(UPSERT_BRANCH, {
    refetchQueries: [GET_BRANCHES],
  });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const action = useMemo(() => upsert.attribute ? 'Update' : 'Create', [upsert.attribute]);

  useEffect(() => {
    if (upsert.attribute) {
      setName(upsert.attribute.name);
    } else {
      setName('');
    }
  }, [upsert.attribute])

  const onSubmit = async () => {
    try {
      if (name.trim() === '') {
        const errorMessage = 'Name is required';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      await upsertMutation({
        variables: {
          input: {
            id: upsert.attribute?.id,
            name: name.trim(),
            active: upsert.attribute ? upsert.attribute.active : true,
          },
        },
      });
      upsert.onFalse();
      setName('');
    } catch(e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    setName('');
    upsert.onFalse();
  }, [upsert, setName]);

  return (
    <ConfirmDialog
      open={upsert.value}
      onClose={handleClose}
      title={`${action} Branch`}
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
          error={!!error || !!mutationErr}
          helperText={error || mutationErr?.message}
        />
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Branch
        </LoadingButton>
      }
    />
  );
};
