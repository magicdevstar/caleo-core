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
import { Rank } from 'src/__generated__/resolvers-types';
import { GET_RANKS, UPSERT_RANK } from 'src/api/rank';

interface InputProps {
  rank?: Rank | null;
  upsertRank: ReturnType<any>;
  onUpsertRank?: () => void;
}

export default function UpsertRankDialogue({
  rank,
  upsertRank,
  onUpsertRank = () => {},
}: InputProps) {
  const [rankMutation, { loading, error: newRankError }] = useMutation(UPSERT_RANK, {
    refetchQueries: [GET_RANKS],
  });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const action = useMemo(() => rank ? 'Update' : 'Create', [rank]);

  useEffect(() => {
    if (rank) {
      setName(rank.name);
    }
  }, [rank])

  const onSubmit = async () => {
    try {
      if (name.trim() === '') {
        const errorMessage = 'Name is required';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      await rankMutation({
        variables: {
          input: {
            id: rank?.id,
            name: name.trim(),
            active: rank ? rank.active : true,
          },
        },
      });
      onUpsertRank();
      upsertRank.onFalse();
      setName('');
    } catch(e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    setName('');
    onUpsertRank();
    upsertRank.onFalse();
  }, [upsertRank, setName, onUpsertRank]);

  return (
    <ConfirmDialog
      open={upsertRank.value}
      onClose={handleClose}
      title={`${action} Rank`}
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
          error={!!error || !!newRankError}
          helperText={error || newRankError?.message}
        />
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Rank
        </LoadingButton>
      }
    />
  );
};
