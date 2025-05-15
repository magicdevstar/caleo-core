import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// @apollo/client
import { useMutation } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';

// components
import ConfirmDialogWithForm from "src/components/custom-dialog/confirm-dialog-with-form";
import { RHFTextField } from 'src/components/hook-form';

// Types
import { Rank, RankGroup } from 'src/__generated__/resolvers-types';
import { GET_RANKS, UPSERT_RANK } from 'src/api/rank';
import { useFeatures } from 'src/hooks/use-features';
import { RHFRankGroup } from 'src/components/ranks/rhf-rank-group';

interface InputProps {
  rank?: Rank | null;
  upsertRank: ReturnType<any>;
  onUpsertRank?: () => void;
}

// Validation schema using yup
const schema = yup.object().shape({
  name: yup.string().trim().required('Name is required'),
  hourlyRate: yup.number().min(0, 'Hourly Rate must be a positive number').nullable(),
  rankGroup: yup.object().nullable(),
});

export default function UpsertRankDialogue({
  rank,
  upsertRank,
  onUpsertRank = () => {},
}: InputProps) {
  const { rankHourlyRate, rankGrouping } = useFeatures();
  const [rankMutation, { loading }] = useMutation(UPSERT_RANK, {
    refetchQueries: [GET_RANKS],
  });

  const action = useMemo(() => (rank ? 'Update' : 'Create'), [rank]);

  // Initialize react-hook-form with default values and validation schema
  const methods = useForm({
    defaultValues: {
      name: rank?.name || '',
      hourlyRate: rankHourlyRate ? rank?.hourlyRate || 0 : null,
      rankGroup: rank?.rankGroup || null,
    },
    resolver: yupResolver(schema),
  });

  const { handleSubmit, reset, setValue } = methods;

  useEffect(() => {
    if (rank) {
      setValue('name', rank.name);
      if (rankHourlyRate) {
        setValue('hourlyRate', rank.hourlyRate || 0);
      }
      if (rankGrouping && rank.rankGroup) {
        setValue('rankGroup', rank.rankGroup);
      }
    } else {
      reset();
    }
  }, [rank, rankHourlyRate, rankGrouping, reset, setValue]);

  const onSubmit = async (data: { name: string; hourlyRate: number | null, rankGroup: RankGroup | null }) => {
    try {
      await rankMutation({
        variables: {
          input: {
            id: rank?.id,
            name: data.name.trim(),
            ...(rankHourlyRate && { hourlyRate: data.hourlyRate }),
            active: rank ? rank.active : true,
            ...(rankGrouping && {
              rankGroupId: data.rankGroup?.id || null,
            }),
          },
        },
      });
      onUpsertRank();
      upsertRank.onFalse();
      reset();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    reset();
    onUpsertRank();
    upsertRank.onFalse();
  }, [reset, onUpsertRank, upsertRank]);

  return (
    <ConfirmDialogWithForm
      methods={methods}
      handleSubmit={handleSubmit(onSubmit as any)}
      open={upsertRank.value}
      onClose={handleClose}
      title={`${action} Rank`}
      content={
        <Stack spacing={2} mt={1}>
          <RHFTextField name="name" label="Name" type="text" autoFocus />
          {rankHourlyRate && (
            <RHFTextField name="hourlyRate" label="Hourly Rate" type="number" />
          )}
          {rankGrouping && (
            <RHFRankGroup name="rankGroup" label="Rank Group" />
          )}
        </Stack>
      }
      action={
        <LoadingButton
          type="submit"
          variant="contained"
          loading={loading}
        >
          {action} Rank
        </LoadingButton>
      }
    />
  );
}
