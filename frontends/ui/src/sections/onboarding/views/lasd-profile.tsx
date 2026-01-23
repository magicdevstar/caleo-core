import { useEffect, useMemo } from 'react';
import isEmpty from 'lodash/isEmpty';
import { m } from 'framer-motion';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@apollo/client';
// @mui
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
// graphql
import { ME, UPDATE_USER } from 'src/api/user';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// types
import { Division, Rank, Unit, User } from 'src/__generated__/resolvers-types';
// components
import FormProvider, {
  RHFPhone,
} from 'src/components/hook-form';
import { MotionContainer, varBounce } from 'src/components/animate';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import TextField from '@mui/material/TextField';
import RHFRankSelect from 'src/components/ranks/rhf-rank-select';
import RHFUnitSelect from 'src/components/unit/rhf-unit-select';

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
      !isEmpty(user.member.division)
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

  const UpdateUserSchema = Yup.object().shape({
    unit: Yup.object().nullable().required('Unit is required'),
    division: Yup.object().nullable(),
    rank: Yup.object().required('Rank is required'),
    primaryPhone: Yup.string(),
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
                  number: d.primaryPhone.trim() === '1' ? '' : d.primaryPhone.trim(),
                  receiveTexts: true,
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
            <RHFRankSelect name="rank" label="Rank" />

            <RHFUnitSelect name="unit" label="Unit of Assignment" />

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
