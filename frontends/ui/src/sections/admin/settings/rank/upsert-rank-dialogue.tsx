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
import Stack from '@mui/material/Stack';
import { useFeatures } from 'src/hooks/use-features';

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
  const { rankHourlyRate } = useFeatures();
  const [rankMutation, { loading, error: newRankError }] = useMutation(UPSERT_RANK, {
    refetchQueries: [GET_RANKS],
  });
  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [error, setError] = useState('');
  const action = useMemo(() => rank ? 'Update' : 'Create', [rank]);

  useEffect(() => {
    if (rank) {
      setName(rank.name);
      if (rankHourlyRate) {
        setHourlyRate(rank.hourlyRate || 0);
      }
    } else {
      setHourlyRate(0);
      setName('');
    }
  }, [rank, rankHourlyRate, setHourlyRate])

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
            ...(rankHourlyRate && { hourlyRate }),
            active: rank ? rank.active : true,
          },
        },
      });
      onUpsertRank();
      upsertRank.onFalse();
      setName('');
      setHourlyRate(0);
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
            error={!!error || !!newRankError}
            helperText={error || newRankError?.message}
          />

          {rankHourlyRate && (
            <TextField
              fullWidth
              label="Hourly Rate"
              type="number"
              value={hourlyRate}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                if (!Number.isNaN(value)) {
                  setHourlyRate(value);
                } else {
                  setHourlyRate(0);
                }
              }}
            />
          )}
        </Stack>
      }
      action={
        <LoadingButton onClick={onSubmit} variant="contained" loading={loading}>
          {action} Rank
        </LoadingButton>
      }
    />
  );
};
