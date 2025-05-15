import { useEffect, useMemo } from 'react';
import { isEmpty } from 'lodash';
import { m } from 'framer-motion';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery } from '@apollo/client';
// @mui
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
// graphql
import { ME, UPDATE_USER } from 'src/api/user';
import { GET_RANKS } from 'src/api/rank';
import { GET_UNITS } from 'src/api/unit';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// types
import { Division, Rank, Unit, User } from 'src/__generated__/resolvers-types';
// components
import FormProvider, {
  RHFAutocomplete,
  RHFPhone,
} from 'src/components/hook-form';
import { MotionContainer, varBounce } from 'src/components/animate';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

const bouncerIn = varBounce().in;

export default function LasdCompleteProfile({
  inputUser,
  returnPath,
  close,
  ignoreUserHook = false,
}: {
  inputUser?: User;
  returnPath?: string;
  close?: () => void;
  ignoreUserHook?: boolean;
}) {
  const router = useRouter();
  const { user: authUser, reInitialize } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const user = useMemo(() => inputUser || authUser, [authUser, inputUser]);

  useEffect(() => {
    if (
      !ignoreUserHook &&
      !isEmpty(user.member.rank) &&
      !isEmpty(user.member.unit) &&
      !isEmpty(user.member.division) &&
      !isEmpty(user.member.contactInfo?.primaryPhone?.number)
    ) {
      router.replace(paths.dashboard.root);
    }
  }, [
    user,
    ignoreUserHook,
    router,
  ]);

  const [updateUser] = useMutation(UPDATE_USER, {
    fetchPolicy: 'network-only',
    refetchQueries: ignoreUserHook ? [] : [
      { query: ME },
    ],
    awaitRefetchQueries: true,
  });
  const { data } = useQuery(GET_RANKS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {},
    },
  });
  const ranks = data?.ranks?.items || [];

  const { data: unitData } = useQuery(GET_UNITS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {},
    },
  });
  const units = unitData?.units?.items || [];

  const UpdateUserSchema = Yup.object().shape({
    unit: Yup.object().nullable().required('Unit is required'),
    division: Yup.object().nullable(),
    rank: Yup.object().required('Rank is required'),
    primaryPhone: Yup.string().required('Primary phone is required'),
  });

  const defaultValues = useMemo(() => ({
    rank: (user?.member?.rank as Rank),
    division: (user?.member?.division as Division),
    unit: (user?.member?.unit as Unit),
    primaryPhone: user?.member?.contactInfo?.primaryPhone?.number || '',
  } as any), [user]);

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;
  const division = watch('unit')?.divisions?.[0]?.name;

  const onSubmit = handleSubmit(async (d) => {
    try {
      await updateUser({
        variables: {
          input: {
            id: user?.id,
            cognitoId: user?.cognitoId,
            firstName: user?.firstName,
            lastName: user?.lastName,
            member: {
              orgId: user?.member?.orgId,
              pNumber: user?.member?.pNumber,
              rankId: d.rank.id,
              divisionId: d.unit.divisions?.[0]?.id,
              unitId: d.unit.id,
              contactInfo: {
                primaryEmail: {
                  address: user.member?.contactInfo?.primaryEmail?.address,
                  receiveEmails: user.member?.contactInfo?.primaryEmail?.receiveEmails || true,
                },
                primaryPhone: {
                  number: d.primaryPhone,
                  receiveTexts: user.member.contactInfo?.primaryPhone?.receiveTexts || false,
                },
              }
            }
          }
        },
      });
      enqueueSnackbar('Profile complete!');
      if (!ignoreUserHook) {
        await reInitialize();
      }
      close?.();
      router.replace(returnPath || paths.dashboard.root);
    } catch (error) {
      enqueueSnackbar('Failed to save changes. Please try again.', { variant: 'error' });
      console.error(error);
    }
  });
  
  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <MotionContainer>
        <m.div variants={bouncerIn}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Welcome, to Caleo!
          </Typography>
        </m.div>

        <m.div variants={bouncerIn}>
          <Typography sx={{ color: 'text.secondary' }}>
            Please enter details below to view available shifts.
          </Typography>
        </m.div>
        <m.div variants={bouncerIn}>
          <Stack spacing={3} sx={{ mt: 3}}>
            <RHFAutocomplete
              name="rank"
              label="Rank"
              options={ranks}
              getOptionLabel={(option: any) => (option as Rank)?.name}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
                const rank = ranks.find(
                  (r: Rank) => r.id === option.id,
                );

                if (!rank) {
                  return null;
                }

                return (
                  <li {...props} key={rank.id}>
                    {rank.name}
                  </li>
                );
              }}
            />

            <RHFAutocomplete
              name="unit"
              label="Unit of Assignment"
              options={units}
              getOptionLabel={(option: any) => (option as Unit).name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option) => {
                const unit = units.find(
                  (u: Unit) => u.id === option.id,
                );

                if (!unit) {
                  return null;
                }

                return (
                  <li {...props} key={unit.id}>
                    {unit.name}
                  </li>
                );
              }}
            />

            <TextField
              disabled
              value={division || ''}
              label="Division"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <RHFPhone name="primaryPhone" label="Primary Phone" />

            <LoadingButton type="submit" variant="contained" loading={isSubmitting} fullWidth>
              Complete profile
            </LoadingButton>
            {
              close && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={close}
                  fullWidth
                >
                  Cancel
                </Button>
              )
            }
          </Stack>
        </m.div>
      </MotionContainer>
    </FormProvider>
  );
}
